import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, Maximize2 } from "lucide-react";
import { CodeBlockModal } from "./CodeBlockModal";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const [modalCode, setModalCode] = useState<{ code: string; language: string } | null>(null);

  return (
    <div className={`prose-container max-w-none break-words ${className}`} id="shawez-markdown-root">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const rawCode = String(children).replace(/\n$/, "");
            const isCodeBlock = !inline || Boolean(match) || rawCode.includes("\n");

            if (isCodeBlock) {
              return (
                <CodeBlockWrapper
                  code={rawCode}
                  language={language}
                  onExpand={() => setModalCode({ code: rawCode, language })}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-md text-[13px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-500/20"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-200 dark:border-slate-700">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-xs tracking-wider uppercase">{children}</th>;
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                {children}
              </td>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                {children}
              </tr>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 pl-4 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 py-2 pr-3 rounded-r-lg italic text-slate-700 dark:text-slate-300">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 underline decoration-emerald-400/40 underline-offset-2 hover:decoration-emerald-500"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline-block opacity-70" />
              </a>
            );
          },
          ul({ children }) {
            return <ul className="my-2.5 pl-6 list-disc space-y-1 text-slate-800 dark:text-slate-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 pl-6 list-decimal space-y-1 text-slate-800 dark:text-slate-200">{children}</ol>;
          },
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 mb-2">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white mt-3 mb-1.5">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <div className="my-2 leading-relaxed text-slate-800 dark:text-slate-200">{children}</div>;
          },
          hr() {
            return <hr className="my-4 border-slate-200 dark:border-slate-800" />;
          },
        }}
      >
        {content}
      </Markdown>

      {modalCode && (
        <CodeBlockModal
          isOpen={true}
          onClose={() => setModalCode(null)}
          code={modalCode.code}
          language={modalCode.language}
        />
      )}
    </div>
  );
};

interface CodeBlockWrapperProps {
  code: string;
  language: string;
  onExpand: () => void;
}

const CodeBlockWrapper: React.FC<CodeBlockWrapperProps> = ({
  code,
  language,
  onExpand,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-slate-400 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="uppercase font-semibold text-emerald-400">
            {language || "code"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExpand}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Expand Full Screen"
            id="codeblock-expand-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            id="codeblock-copy-btn"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-slate-100 bg-slate-950">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
