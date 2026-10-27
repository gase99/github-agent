import React, { useState } from 'react';
import { BookmarkPlus, Check, Code2, Copy, Share2 } from 'lucide-react';
import { copyText, shareText } from '../services/nativeBridge';
import { useApp } from '../context/AppContext';
import type { ParsedCodeBlock } from '../types/app';

export function parseMessageSegments(
  raw: string
): Array<{ type: 'text'; text: string } | { type: 'code'; block: ParsedCodeBlock }> {
  const regex = /```([a-zA-Z0-9_+-]*)(?::([^\n`]+))?\n([\s\S]*?)```/g;
  const segments: Array<
    { type: 'text'; text: string } | { type: 'code'; block: ParsedCodeBlock }
  > = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIdx) {
      const textChunk = raw.slice(lastIdx, match.index).trim();
      if (textChunk) segments.push({ type: 'text', text: textChunk });
    }
    const lang = (match[1] || 'kotlin').toLowerCase();
    const filename = match[2]?.trim();
    const code = match[3].replace(/\n$/, '');
    segments.push({
      type: 'code',
      block: { language: lang, filename, code },
    });
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < raw.length) {
    const rest = raw.slice(lastIdx).trim();
    if (rest) segments.push({ type: 'text', text: rest });
  }

  if (segments.length === 0 && raw.trim()) {
    segments.push({ type: 'text', text: raw });
  }

  return segments;
}

interface CodeBlockCardProps {
  language: string;
  filename?: string;
  code: string;
  showSaveToSnippets?: boolean;
}

export const CodeBlockCard: React.FC<CodeBlockCardProps> = ({
  language,
  filename,
  code,
  showSaveToSnippets = true,
}) => {
  const { t, showToast, addSnippet, settings } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(code);
    setCopied(true);
    showToast(t('کد در حافظه کپی شد ✓', 'Code copied to clipboard ✓'), 'cyan');
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveSnippet = () => {
    const normalizedLang = (
      ['kotlin', 'python', 'javascript', 'bash', 'sql'].includes(language)
        ? language
        : language === 'ts' || language === 'typescript'
          ? 'javascript'
          : language === 'sh'
            ? 'bash'
            : 'kotlin'
    ) as 'kotlin' | 'python' | 'javascript' | 'bash' | 'sql';

    const shortMap: Record<string, string> = {
      kotlin: 'KT',
      python: 'PY',
      javascript: 'JS',
      bash: 'SH',
      sql: 'SQL',
    };

    addSnippet({
      title: filename || `${language.toUpperCase()} AI Snippet`,
      subtitleFa: 'ذخیره‌شده از گفتگوی دستیار هوشمند',
      language: normalizedLang,
      langShort: shortMap[normalizedLang] || 'KT',
      category: 'ai',
      tags: [`#${language}`, '#Gemini'],
      badgeText: 'Saved from Chat',
      code,
      favorite: false,
    });
  };

  const handleShare = async () => {
    await shareText(filename || 'Code Snippet', code);
    showToast(t('آماده اشتراک‌گذاری شد', 'Ready to share'), 'purple');
  };

  const lines = code.split('\n');

  return (
    <div
      className="w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-xl cyber-border-subtle my-1"
      dir="ltr"
      onClick={() => {
        if (settings.autoCopyCode) {
          handleCopy();
        }
      }}
    >
      {/* Terminal Top Bar */}
      <div className="bg-surface-container-high px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-error" />
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant ml-1 flex items-center gap-1 truncate">
            <Code2 className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
            <span className="truncate text-on-surface font-medium">
              {filename || `${language || 'code'}.snippet`}
            </span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[9px] font-mono uppercase text-primary-fixed-dim shrink-0">
            {language || 'code'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="px-2 py-1 rounded-md bg-surface-container-highest hover:bg-surface-bright active:scale-95 text-on-surface flex items-center gap-1 transition-all text-[11px] font-mono"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary-container" />
                <span className="text-primary-container">{t('کپی شد', 'Copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-primary-fixed-dim" />
                <span>{t('کپی', 'Copy')}</span>
              </>
            )}
          </button>
          {showSaveToSnippets && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveSnippet();
              }}
              title={t('ذخیره در تکه‌کدها', 'Save to Snippets')}
              className="p-1.5 rounded-md bg-primary-container/15 text-primary-container hover:bg-primary-container/25 active:scale-95 transition-all"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            title={t('اشتراک‌گذاری', 'Share')}
            className="p-1.5 rounded-md bg-surface-container-highest text-secondary hover:bg-surface-bright active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monospace Line-Numbered Code Pane */}
      <div className="p-3 overflow-x-auto text-left font-mono text-[12px] leading-[20px]">
        <div className="min-w-0">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start hover:bg-white/[0.02] px-1 rounded">
              <span className="w-7 pr-2.5 text-right select-none text-outline/60 text-[11px] shrink-0">
                {idx + 1}
              </span>
              <span className="whitespace-pre text-on-surface flex-1">{line || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
