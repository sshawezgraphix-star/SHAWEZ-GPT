import { Message, GroundingSource } from '../types';

export function getOpenRouterApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('shawezgpt_custom_openrouter_key') || '';
  }
  return process.env.OPENROUTER_API_KEY || '';
}

export async function streamOpenRouter({
  messages,
  modelId = 'deepseek/deepseek-r1:free',
  systemInstruction,
  temperature = 0.7,
  onChunk,
  signal,
}: {
  messages: Message[];
  modelId?: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<{ fullText: string; sources: GroundingSource[] }> {
  const apiKey = getOpenRouterApiKey();
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({ role: 'system', content: systemInstruction.trim() });
  }

  for (const m of messages) {
    let content = m.content || '';
    if (m.attachments && m.attachments.length > 0) {
      for (const att of m.attachments) {
        if (att.textContent) {
          content += "\n\n[Attached File: " + (att.name || "document") + "]\n```\n" + att.textContent.slice(0, 20000) + "\n```";
        }
      }
    }
    if (!content.trim()) content = 'Hello';
    formattedMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://shawezgpt.local',
      'X-Title': 'ShawezGPT Swarm Hub',
    },
    body: JSON.stringify({
      model: modelId.includes(':free') ? modelId : `${modelId}:free`,
      messages: formattedMessages,
      temperature,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP error ${response.status}: ${response.statusText}`);
  }

  if (!response.body) throw new Error('No readable stream from OpenRouter.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      if (jsonStr === '[DONE]') break;
      try {
        const data = JSON.parse(jsonStr);
        const chunkText = data.choices?.[0]?.delta?.content || '';
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      } catch {}
    }
  }

  return { fullText, sources: [] };
}
