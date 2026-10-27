import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Code2,
  Gauge,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Lightbulb,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { publishPrCommentToGithub } from '../services/githubApi';
import { copyText } from '../services/nativeBridge';

export const PrReviewScreen: React.FC = () => {
  const {
    activePr,
    setActivePr,
    navigate,
    settings,
    showToast,
    t,
  } = useApp();

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const currentDiffFile = activePr.files[selectedFileIdx] || activePr.files[0];

  const handleMergePr = () => {
    setActivePr((prev) => ({
      ...prev,
      state: 'merged',
      verdictFa: 'ادغام شد ✓',
      verdictEn: 'Merged ✓',
    }));
    showToast(
      t(
        `درخواست ادغام #${activePr.number} تایید و ادغام شد ✓`,
        `Pull Request #${activePr.number} approved & merged ✓`
      ),
      'cyan'
    );
  };

  const handleRequestChanges = () => {
    showToast(
      t('درخواست اصلاحات برای نویسنده ارسال شد', 'Requested changes on Pull Request'),
      'purple'
    );
  };

  const handleApplyInlineSuggestion = (lineIndex: number) => {
    setActivePr((prev) => {
      const updatedFiles = prev.files.map((f, fIdx) => {
        if (fIdx !== selectedFileIdx) return f;
        return {
          ...f,
          lines: f.lines.map((ln, lIdx) => {
            if (lIdx !== lineIndex || !ln.aiComment) return ln;
            return {
              ...ln,
              content: `    ${ln.aiComment.suggestedCode}`,
              aiComment: { ...ln.aiComment, applied: true },
            };
          }),
        };
      });
      return {
        ...prev,
        securityScore: Math.min(100, prev.securityScore + 4),
        files: updatedFiles,
      };
    });
    showToast(
      t('پیشنهاد هوش مصنوعی روی کد اعمال شد ✓', 'Inline AI suggestion applied ✓'),
      'cyan'
    );
  };

  const toggleChecklist = (id: string) => {
    setActivePr((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) =>
        c.id === id ? { ...c, checked: !c.checked } : c
      ),
    }));
  };

  const bumpReaction = (key: 'rocket' | 'eyes' | 'fire') => {
    setActivePr((prev) => ({
      ...prev,
      reactions: {
        ...prev.reactions,
        [key]: prev.reactions[key] + 1,
      },
    }));
  };

  const handlePostComment = async (customBody?: string) => {
    const body = (customBody ?? commentText).trim();
    if (!body) return;
    setPublishing(true);
    try {
      let postedLive = false;
      if (activePr.isRemoteGithub && settings.githubToken.trim()) {
        postedLive = await publishPrCommentToGithub(
          activePr.repoFullName,
          activePr.number,
          body,
          settings.githubToken
        );
      }

      setActivePr((prev) => ({
        ...prev,
        comments: [
          ...prev.comments,
          {
            id: `c-${Date.now()}`,
            author: settings.githubUsername || 'developer_pro',
            body,
            time: 'Just now',
          },
        ],
      }));
      if (!customBody) setCommentText('');
      showToast(
        postedLive
          ? t('گزارش در GitHub منتشر شد ✓', 'Published review comment to GitHub ✓')
          : t('دیدگاه بازبینی ثبت شد ✓', 'Review comment saved ✓'),
        'cyan'
      );
    } finally {
      setPublishing(false);
    }
  };

  const passedChecks = activePr.checklist.filter((c) => c.checked).length;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-10 gap-4">
      {/* Sub-Navigation Switcher: Security Audit <-> PR Review */}
      <div className="p-1 rounded-xl bg-surface-container-low grid grid-cols-2 gap-1 cyber-border-subtle">
        <button
          type="button"
          onClick={() => navigate('security')}
          className="py-2 px-3 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-all"
        >
          <ShieldAlert className="w-4 h-4 text-error" />
          <span>{t('ممیزی امنیتی (SAST)', 'Security Audit')}</span>
        </button>
        <button
          type="button"
          className="py-2 px-3 rounded-lg bg-surface-container-high text-primary-container font-display text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <GitPullRequest className="w-4 h-4" />
          <span>{t('بازبینی Pull Request', 'Pull Request Review')}</span>
        </button>
      </div>

      {/* PR Header Bento */}
      <section className="bg-surface-container rounded-2xl p-4 shadow-xl cyber-border-subtle space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                activePr.state === 'merged'
                  ? 'bg-secondary-container/40 text-secondary'
                  : 'bg-primary-container/15 text-primary-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {activePr.state === 'merged'
                ? t('MERGED · ادغام‌شده', 'MERGED')
                : t('OPEN · باز', 'OPEN')}
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant" dir="ltr">
              {activePr.repoFullName}
            </span>
          </div>

          <div
            className="flex items-center gap-1 font-mono text-[11px] bg-surface-container-lowest px-2.5 py-1 rounded-lg text-on-surface-variant"
            dir="ltr"
          >
            <GitCommit className="w-3.5 h-3.5 text-primary-fixed-dim" />
            <span className="text-primary-fixed-dim">#{activePr.number}</span>
            <span>·</span>
            <span>{activePr.commitSha}</span>
          </div>
        </div>

        <div>
          <h1 className="font-display text-base font-bold text-on-surface leading-snug" dir="ltr">
            {activePr.title}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">{activePr.subtitleFa}</p>
        </div>

        {/* Branch Flow */}
        <div
          className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest/80 font-mono text-xs overflow-x-auto"
          dir="ltr"
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/30 text-secondary shrink-0">
            <GitBranch className="w-3.5 h-3.5" />
            {activePr.sourceBranch}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-outline shrink-0" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary-fixed-dim shrink-0">
            <GitMerge className="w-3.5 h-3.5" />
            {activePr.targetBranch}
          </span>
        </div>

        {/* Author & Diff Metrics */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-mono text-xs font-bold">
              {activePr.author.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-mono text-xs text-on-surface font-semibold" dir="ltr">
                {activePr.author}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {t(activePr.authorRoleFa, activePr.authorRoleEn)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs" dir="ltr">
            <span className="text-primary-fixed-dim font-bold">+{activePr.additions}</span>
            <span className="text-error font-bold">-{activePr.deletions}</span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] text-on-surface-variant">
              {activePr.files.length} files
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleRequestChanges}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright active:scale-95 transition-all text-xs font-semibold text-on-surface"
          >
            {t('درخواست اصلاح (Request Changes)', 'Request Changes')}
          </button>
          <button
            type="button"
            disabled={activePr.state === 'merged'}
            onClick={handleMergePr}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-primary-container disabled:opacity-50 text-on-primary-container font-display text-xs font-bold shadow-[0_0_16px_rgba(0,245,212,0.3)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {activePr.state === 'merged'
                ? t('ادغام انجام شد ✓', 'Merged ✓')
                : t('تأیید و ادغام PR', 'Approve & Merge')}
            </span>
          </button>
        </div>
      </section>

      {/* Gemini AI Review Suite */}
      <section className="bg-surface-container-high rounded-2xl p-4 shadow-xl cyber-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary-container">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold text-on-surface" dir="ltr">
                  {settings.geminiModel}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-mono text-[9px] uppercase">
                  AI Audit
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                {t('تحلیل هوشمند چندسطحی و امنیتی تغییرات کد', 'Multi-layer code & security review')}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary-container font-mono text-[11px] font-semibold">
            {t(activePr.verdictFa, activePr.verdictEn)}
          </span>
        </div>

        {/* Score Meters */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-surface-container rounded-xl p-3 space-y-1">
            <span className="text-[11px] text-on-surface-variant">
              {t('شاخص امنیت و ریسک', 'Security & Risk Score')}
            </span>
            <div className="flex items-baseline gap-1" dir="ltr">
              <span className="font-display text-2xl font-bold text-primary-container">
                {activePr.securityScore}
              </span>
              <span className="font-mono text-xs text-outline">/ 100</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all"
                style={{ width: `${activePr.securityScore}%` }}
              />
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-3 space-y-1">
            <span className="text-[11px] text-on-surface-variant">
              {t('معماری و استاندارد', 'Architecture Grade')}
            </span>
            <div className="flex items-baseline gap-1.5" dir="ltr">
              <span className="font-display text-2xl font-bold text-secondary">
                {activePr.architectureGrade}
              </span>
              <span className="font-mono text-xs text-outline">Clean Arch</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full w-[96%]" />
            </div>
          </div>
        </div>

        {/* Findings */}
        <div className="space-y-2">
          {activePr.findings.map((f, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-surface-container/80 flex items-start gap-2.5"
            >
              <div className="w-6 h-6 rounded-lg bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0 mt-0.5">
                {f.icon === 'speed' ? (
                  <Gauge className="w-3.5 h-3.5" />
                ) : f.icon === 'security' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-secondary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xs font-bold text-on-surface" dir="ltr">
                  {f.title}
                </p>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  {t(f.descFa, f.descEn)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={publishing}
          onClick={() =>
            handlePostComment(
              `### Gemini AI Review Summary (Score: ${activePr.securityScore}/100)\n- Architecture: ${activePr.architectureGrade}\n- Verdict: ${activePr.verdictEn}`
            )
          }
          className="w-full py-2.5 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface hover:text-primary-container text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Send className="w-3.5 h-3.5 text-primary-container" />
          <span>
            {t(
              'ارسال خودکار گزارش هوش مصنوعی به GitHub PR',
              'Publish AI Audit Report to GitHub PR'
            )}
          </span>
        </button>
      </section>

      {/* Interactive Multi-File Diff Viewer */}
      {currentDiffFile && (
        <section className="bg-surface-container rounded-2xl p-4 shadow-xl cyber-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-on-surface">
              {t('تغییرات فایل‌ها (Diff Viewer)', 'Changed Files (Diff)')}
            </span>
            <span className="font-mono text-[11px] text-outline" dir="ltr">
              {selectedFileIdx + 1}/{activePr.files.length} files
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" dir="ltr">
            {activePr.files.map((file, idx) => (
              <button
                key={file.filename}
                type="button"
                onClick={() => setSelectedFileIdx(idx)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                  idx === selectedFileIdx
                    ? 'bg-surface-container-high text-primary-container cyber-border'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{file.filename.split('/').pop()}</span>
                <span className="text-[10px] text-outline">
                  (+{file.additions}, -{file.deletions})
                </span>
              </button>
            ))}
          </div>

          <div
            className="rounded-xl bg-surface-container-lowest overflow-hidden font-mono text-xs cyber-border-subtle"
            dir="ltr"
          >
            <div className="px-3 py-2 bg-surface-container-high flex items-center justify-between text-[11px]">
              <span className="text-on-surface truncate">{currentDiffFile.filename}</span>
              <button
                type="button"
                onClick={() => {
                  copyText(currentDiffFile.filename);
                  showToast(t('مسیر فایل کپی شد', 'Copied file path'), 'cyan');
                }}
                className="text-primary-fixed-dim hover:underline"
              >
                {currentDiffFile.language}
              </button>
            </div>

            <div className="py-1.5 overflow-x-auto leading-5">
              {currentDiffFile.lines.map((ln, lIdx) => (
                <React.Fragment key={lIdx}>
                  <div
                    className={`flex items-stretch px-1 ${
                      ln.type === 'add'
                        ? 'bg-primary-container/12 text-primary-fixed'
                        : ln.type === 'del'
                          ? 'bg-error-container/25 text-error'
                          : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="w-7 text-right pr-1.5 select-none opacity-60 text-[10px] shrink-0">
                      {ln.oldLine ?? ''}
                    </span>
                    <span className="w-7 text-right pr-1.5 select-none opacity-60 text-[10px] shrink-0">
                      {ln.newLine ?? ''}
                    </span>
                    <span className="w-4 text-center select-none font-bold shrink-0">
                      {ln.type === 'add' ? '+' : ln.type === 'del' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre pl-1">{ln.content}</span>
                  </div>

                  {/* Inline AI Comment Callout */}
                  {ln.aiComment && (
                    <div
                      className="mx-2 my-2 p-3 rounded-xl bg-surface-container-high shadow-lg cyber-border space-y-2"
                      dir="auto"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-secondary font-display text-xs font-bold">
                          <Bot className="w-4 h-4" />
                          <span>{t(ln.aiComment.titleFa, ln.aiComment.titleEn)}</span>
                        </div>
                        <span className="font-mono text-[10px] text-outline" dir="ltr">
                          Line {ln.newLine}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface leading-relaxed font-sans">
                        {t(ln.aiComment.bodyFa, ln.aiComment.bodyEn)}
                      </p>

                      <div
                        className="p-2 rounded-lg bg-surface-container-lowest text-primary-container font-mono text-[11px] overflow-x-auto"
                        dir="ltr"
                      >
                        + {ln.aiComment.suggestedCode}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={ln.aiComment.applied}
                          onClick={() => handleApplyInlineSuggestion(lIdx)}
                          className="px-3 py-1.5 rounded-lg bg-primary-container disabled:opacity-50 text-on-primary-container font-display text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {ln.aiComment.applied
                              ? t('اعمال شد ✓', 'Applied ✓')
                              : t('اعمال پیشنهاد (Apply)', 'Apply Patch')}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CI/CD Audit Checklist & Reactions */}
      <section className="bg-surface-container rounded-2xl p-4 shadow-xl cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-bold text-on-surface">
            {t('چک‌لیست بررسی کیفیت (CI/CD)', 'CI/CD Quality Checklist')}
          </span>
          <span className="font-mono text-xs text-primary-container" dir="ltr">
            {passedChecks}/{activePr.checklist.length} Passed
          </span>
        </div>

        <div className="space-y-2">
          {activePr.checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklist(item.id)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-start"
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  item.checked ? 'text-primary-container' : 'text-outline'
                }`}
              />
              <span className="text-xs text-on-surface flex-1">
                {t(item.labelFa, item.labelEn)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <span className="text-xs text-on-surface-variant">
            {t('واکنش سریع تیم:', 'Team Reactions:')}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => bumpReaction('rocket')}
              className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs flex items-center gap-1 active:scale-95"
            >
              <span>🚀</span>
              <span className="font-mono">{activePr.reactions.rocket}</span>
            </button>
            <button
              type="button"
              onClick={() => bumpReaction('eyes')}
              className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs flex items-center gap-1 active:scale-95"
            >
              <span>👀</span>
              <span className="font-mono">{activePr.reactions.eyes}</span>
            </button>
            <button
              type="button"
              onClick={() => bumpReaction('fire')}
              className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs flex items-center gap-1 active:scale-95"
            >
              <span>🔥</span>
              <span className="font-mono">{activePr.reactions.fire}</span>
            </button>
          </div>
        </div>

        {/* User Posted Comments */}
        {activePr.comments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.05]">
            {activePr.comments.map((c) => (
              <div key={c.id} className="p-2.5 rounded-xl bg-surface-container-lowest text-xs">
                <div className="flex justify-between font-mono text-[10px] text-primary-fixed-dim mb-1">
                  <span>@{c.author}</span>
                  <span>{c.time}</span>
                </div>
                <p className="text-on-surface whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Review Note Composer */}
      <div className="p-2.5 bg-surface-container-high rounded-2xl shadow-2xl cyber-border flex items-center gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
          placeholder={t(
            'ثبت دیدگاه نهایی یا یادداشت روی این PR...',
            'Add a review comment on this PR...'
          )}
          className="flex-1 bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs px-3 py-2.5 rounded-xl outline-none"
        />
        <button
          type="button"
          disabled={!commentText.trim() || publishing}
          onClick={() => handlePostComment()}
          className="w-10 h-10 rounded-xl bg-primary-container disabled:opacity-40 text-on-primary-container flex items-center justify-center active:scale-95 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
