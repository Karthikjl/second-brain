'use client';

import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const parsedHtml = useMemo(() => {
    if (!content) return '';
    try {
      const rawHtml = marked.parse(content) as string;
      if (typeof window !== 'undefined') {
        return DOMPurify.sanitize(rawHtml);
      }
      return rawHtml;
    } catch (err) {
      return content;
    }
  }, [content]);

  // Handle code block copying
  function handleCopy(codeText: string, idx: number) {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div
      className={`prose prose-sm max-w-none break-words text-[var(--sb-ink)] leading-relaxed space-y-2.5 
      [&_h1]:text-base [&_h1]:font-black [&_h1]:text-[var(--sb-ink)] [&_h1]:border-b [&_h1]:border-[var(--sb-border)] [&_h1]:pb-1.5 [&_h1]:mt-3 [&_h1]:mb-2
      [&_h2]:text-sm [&_h2]:font-black [&_h2]:text-[var(--sb-ink)] [&_h2]:mt-3 [&_h2]:mb-1.5
      [&_h3]:text-xs [&_h3]:font-black [&_h3]:text-[var(--sb-ink)] [&_h3]:mt-2.5 [&_h3]:mb-1
      [&_p]:my-1.5 [&_p]:leading-relaxed
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ul]:space-y-1
      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_ol]:space-y-1
      [&_li]:leading-normal
      [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--sb-primary)] [&_blockquote]:bg-[var(--sb-surface-alt)] [&_blockquote]:px-3 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-xs
      [&_code]:bg-[var(--sb-surface-alt)] [&_code]:text-[var(--sb-ink)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono [&_code]:border [&_code]:border-[var(--sb-border-light)]
      [&_pre]:bg-[#18181b] [&_pre]:text-[#f4f4f5] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:border-2 [&_pre]:border-[var(--sb-border)] [&_pre]:overflow-x-auto [&_pre]:my-2.5 [&_pre]:shadow-[2px_2px_0px_var(--sb-shadow-color)]
      [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:border-0 [&_pre_code]:text-xs
      [&_table]:w-full [&_table]:border-collapse [&_table]:border-2 [&_table]:border-[var(--sb-border)] [&_table]:my-3 [&_table]:text-xs
      [&_th]:border-2 [&_th]:border-[var(--sb-border)] [&_th]:bg-[var(--sb-surface-alt)] [&_th]:p-2 [&_th]:text-left [&_th]:font-black
      [&_td]:border [&_td]:border-[var(--sb-border-light)] [&_td]:p-2 [&_td]:bg-[var(--sb-surface)]
      [&_hr]:my-3 [&_hr]:border-t-2 [&_hr]:border-[var(--sb-border)]
      [&_strong]:font-black [&_strong]:text-[var(--sb-ink)]
      [&_a]:text-[var(--sb-accent-cyan)] [&_a]:underline [&_a]:font-bold hover:[&_a]:opacity-80
      ${className}`}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}
