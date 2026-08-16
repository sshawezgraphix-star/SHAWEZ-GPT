// Speech Synthesis (Text-to-Speech) and Speech Recognition (Voice-to-Text) wrapper

export class SpeechManager {
  private static synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  // Speak text
  static speak(
    text: string,
    options: {
      rate?: number;
      voiceName?: string;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ) {
    if (!this.synth) return;

    this.stop();

    // Clean markdown symbols for cleaner pronunciation
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#~>[\]]/g, "")
      .replace(/https?:\/\/\S+/g, "link")
      .slice(0, 2500); // Guard long speeches

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.0;

    if (options.voiceName) {
      const voices = this.synth.getVoices();
      const found = voices.find((v) => v.name === options.voiceName);
      if (found) utterance.voice = found;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      options.onError?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  // Stop speaking
  static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  // Check if speaking
  static isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  // Get available voices
  static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // Create Speech Recognition instance (Voice dictation)
  static createRecognizer(
    onResult: (transcript: string) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): any {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript + " ";
        } else {
          currentTranscript += event.results[i][0].transcript;
        }
      }
      if (currentTranscript.trim()) {
        onResult(currentTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      onError(event.error);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  }
}
