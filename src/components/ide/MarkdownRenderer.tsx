"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";


export function MarkdownRenderer({ content }: { content: string }) {
  // Preprocess LaTeX math delimiters because standard markdown sometimes escapes them
  const preprocessMath = (text: string) => {
    if (!text) return text;
    let processed = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
    return processed;
  };

  return (
    <div className="flex flex-col gap-1 text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-1 text-foreground border-b border-charcoal pb-1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-4 mb-1 text-foreground" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-3 mb-0.5 text-accent-blue" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-medium mt-2 mb-0.5 text-foreground/80" {...props} />,
          p: ({ node, ...props }) => <p className="leading-relaxed mb-1" {...props} />,
          ul: ({ node, ...props }) => <ul className="my-2 flex flex-col gap-1 pl-5 list-disc marker:text-accent-green" {...props} />,
          ol: ({ node, ...props }) => <ol className="my-2 flex flex-col gap-1 pl-5 list-decimal marker:text-accent-blue marker:font-mono marker:text-xs" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-accent-blue pl-3 my-2 text-foreground/70 italic" {...props} />
          ),
          hr: ({ node, ...props }) => <hr className="border-charcoal my-3" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-foreground/80" {...props} />,
          pre: ({ node, children, ...props }) => <>{children}</>,
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            
            if (match) {
              return (
                <pre className="my-3 rounded bg-charcoal/60 border border-charcoal px-4 py-3 text-xs font-mono overflow-x-auto text-emerald-300">
                  {match[1] && (
                    <span className="block mb-2 text-[10px] text-foreground/40 uppercase tracking-widest">
                      {match[1]}
                    </span>
                  )}
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            
            return (
              <code className="px-1 py-0.5 rounded bg-charcoal/60 font-mono text-emerald-300 text-xs" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {preprocessMath(content)}
      </ReactMarkdown>
    </div>
  );
}
