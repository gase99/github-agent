import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { copyText } from '../services/nativeBridge';
import type { VulnCategory } from '../types/app';

export const SecurityAuditScreen: React.FC = () => {
  const {
    selectedRepo,
    vulnerabilities,
    setVulnerabilities,
    navigate,
    showToast,
    t,
  } = useApp();

  const [filter, setFilter] = useState<'all' | VulnCategory>('all');
  const [rescanning, setRescanning] = useState(false);

  const activeVulns = useMemo(
    () => vulnerabilities.filter((v) => !v.ignored),
    [vulnerabilities]
  );

  const counts = useMemo(() => {
    const open = activeVulns.filter((v) => !v.fixed);
    return {
      critical: open.filter((v) => v.severity === 'critical').length,
      high: open.filter((v) => v.severity === 'high').length,
      medium: open.filter((v) => v.severity === 'medium').length,
      info: 4,
    };
  }, [activeVulns]);

  const healthScore = useMemo(() => {
    const penalty =
      counts.critical * 14 + counts.high * 5 + counts.medium * 2;
    return Math.max(45, Math.min(100, 100 - penalty));
  }, [counts]);

  const filteredList = useMemo(() => {
    if (filter === 'all') return activeVulns;
    return activeVulns.filter((v) => v.category === filter);
  }, [activeVulns, filter]);

  const handleRescan = () => {
    setRescanning(true);
    setTimeout(() => {
      setVulnerabilities((prev) =>
        prev.map((v) => ({ ...v, ignored: false }))
      );
      setRescanning(false);
      showToast(
        t('اسکن امنیتی SAST و بررسی وابستگی‌ها به‌روز شد ✓', 'SAST & CVE security scan refreshed ✓'),
        'cyan'
      );
    }, 850);
  };

  const handleAutoFix = (vulnId: string) => {
    setVulnerabilities((prev) =>
      prev.map((v) => (v.id === vulnId ? { ...v, fixed: true } : v))
    );
    showToast(
      t(
        'پچ امنیتی هوشمند توسط Gemini اعمال شد ✨',
        'AI Security Patch applied automatically ✨'
      ),
      'cyan'
    );
  };

  const handleFixAll = () => {
    setVulnerabilities((prev) => prev.map((v) => ({ ...v, fixed: true })));
    showToast(
      t('تمام آسیب‌پذیری‌های فعال پچ و ایمن شدند ✓', 'All active vulnerabilities patched ✓'),
      'cyan'
    );
  };

  const handleIgnore = (vulnId: string) => {
    setVulnerabilities((prev) =>
      prev.map((v) => (v.id === vulnId ? { ...v, ignored: true } : v))
    );
    showToast(t('مورد انتخاب‌شده نادیده گرفته شد', 'Finding muted safely'), 'purple');
  };

  const handleExportSarif = async () => {
    const sarif = JSON.stringify(
      {
        version: '2.1.0',
        repository: selectedRepo.fullName,
        score: healthScore,
        findings: vulnerabilities.map((v) => ({
          id: v.codeId,
          title: v.title,
          severity: v.severity,
          fixed: Boolean(v.fixed),
        })),
      },
      null,
      2
    );
    await copyText(sarif);
    showToast(
      t('گزارش استاندارد SARIF در کلیپ‌بورد کپی شد ✓', 'SARIF JSON report copied to clipboard ✓'),
      'cyan'
    );
  };

  const circumference = 188.4;
  const dashOffset = circumference * (1 - healthScore / 100);
  const unfixedCount = activeVulns.filter((v) => !v.fixed).length;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-10 gap-4">
      {/* Sub-Navigation Switcher: Security Audit <-> PR Review */}
      <div className="p-1 rounded-xl bg-surface-container-low grid grid-cols-2 gap-1 cyber-border-subtle">
        <button
          type="button"
          className="py-2 px-3 rounded-lg bg-surface-container-high text-primary-container font-display text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('ممیزی امنیتی (SAST)', 'Security Audit')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('pr-review')}
          className="py-2 px-3 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-all"
        >
          <GitPullRequest className="w-4 h-4 text-secondary" />
          <span>{t('بازبینی Pull Request', 'Pull Request Review')}</span>
        </button>
      </div>

      {/* Target Repo & Rescan Bar */}
      <section className="bg-surface-container-low rounded-2xl p-4 shadow-lg cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-on-surface truncate" dir="ltr">
              {selectedRepo.fullName}
            </p>
            <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-on-surface-variant" dir="ltr">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container">
                <GitBranch className="w-3 h-3 text-secondary" />
                {selectedRepo.defaultBranch}
              </span>
              <span>Sentinel Pro SAST</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportSarif}
              title="Export SARIF JSON"
              className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRescan}
              className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary-container font-mono text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin' : ''}`} />
              <span>{t('اسکن مجدد', 'Rescan')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Health Score & Severity Matrix */}
      <section className="bg-surface-container-low rounded-2xl p-4 shadow-lg cyber-border-subtle space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase">
              {t('امتیاز سلامت کد امنیتی', 'Security Health Score')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1" dir="ltr">
              <span className="font-display text-4xl font-bold text-primary">
                {healthScore}
              </span>
              <span className="font-mono text-sm text-outline">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-primary-container" />
              <span className="text-secondary font-medium">
                {unfixedCount === 0
                  ? t('ایمن • تمام موارد بحرانی رفع شدند ✓', 'All critical issues resolved ✓')
                  : t(
                      `${unfixedCount} مورد نیازمند بررسی و اصلاح`,
                      `${unfixedCount} findings awaiting remediation`
                    )}
              </span>
            </div>
          </div>

          {/* Radial SVG Gauge */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="transparent"
                stroke="#32343e"
                strokeWidth="6"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="transparent"
                stroke="#00f5d4"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <ShieldCheck className="w-6 h-6 text-primary-container absolute" />
          </div>
        </div>

        {/* 4-Column Severity Counters */}
        <div className="grid grid-cols-4 gap-2 bg-surface-container-lowest/80 p-2 rounded-xl">
          <div className="p-2 rounded-lg bg-surface-container text-center">
            <span className="text-[10px] text-error font-bold block">
              {t('بحرانی', 'Critical')}
            </span>
            <span className="font-display text-lg font-bold text-error">
              {counts.critical}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container text-center">
            <span className="text-[10px] text-secondary font-bold block">
              {t('بالا', 'High')}
            </span>
            <span className="font-display text-lg font-bold text-secondary">
              {counts.high}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container text-center">
            <span className="text-[10px] text-tertiary-fixed-dim font-bold block">
              {t('متوسط', 'Medium')}
            </span>
            <span className="font-display text-lg font-bold text-tertiary-fixed-dim">
              {counts.medium}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container text-center">
            <span className="text-[10px] text-outline font-bold block">
              {t('بهینگی', 'Info')}
            </span>
            <span className="font-display text-lg font-bold text-on-surface">
              {counts.info}
            </span>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface shrink-0">
            OWASP Mobile: <strong className="text-primary-container">92%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface shrink-0">
            CWE Top 25: <strong className="text-primary-container">Verified</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface shrink-0">
            Play Integrity: <strong className="text-secondary">Ready</strong>
          </span>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', fa: 'همه یافته‌ها', en: 'All Findings' },
          { id: 'secrets', fa: 'اسرار و کلیدها (Secrets)', en: 'Secrets' },
          { id: 'dependencies', fa: 'وابستگی‌ها (CVE)', en: 'Dependencies' },
          { id: 'sast', fa: 'کد استاتیک (SAST)', en: 'SAST Code' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              filter === tab.id
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t(tab.fa, tab.en)}
          </button>
        ))}
      </div>

      {/* Vulnerability Cards */}
      <div className="flex flex-col gap-3.5">
        {filteredList.map((vuln) => (
          <article
            key={vuln.id}
            className={`rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all cyber-border-subtle ${
              vuln.fixed ? 'bg-surface-container/60 opacity-85' : 'bg-surface-container-low'
            }`}
          >
            <div
              className={`absolute top-0 inset-x-0 h-1 ${
                vuln.fixed
                  ? 'bg-primary-container'
                  : vuln.severity === 'critical'
                    ? 'bg-error'
                    : vuln.severity === 'high'
                      ? 'bg-secondary'
                      : 'bg-tertiary-fixed-dim'
              }`}
            />

            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {vuln.fixed ? (
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-mono text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('ایمن‌شده (Patched)', 'Patched ✓')}
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 ${
                      vuln.severity === 'critical'
                        ? 'bg-error-container text-error'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {vuln.cvssOrCve}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[10px]">
                  {vuln.cweTag}
                </span>
              </div>
              <span className="font-mono text-[11px] text-outline" dir="ltr">
                {vuln.codeId}
              </span>
            </div>

            <h3 className="font-display text-sm font-bold text-on-surface" dir="ltr">
              {vuln.title}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {t(vuln.descriptionFa, vuln.descriptionEn)}
            </p>

            {/* Code Evidence */}
            <div className="mt-3 rounded-xl bg-surface-container-lowest p-3 overflow-x-auto" dir="ltr">
              <div className="flex items-center justify-between text-[10px] font-mono text-outline pb-1.5 mb-1.5 border-b border-white/[0.06]">
                <span>{vuln.filePath}</span>
                <span>{vuln.languageLabel}</span>
              </div>
              <pre
                className={`font-mono text-[11px] leading-relaxed whitespace-pre ${
                  vuln.fixed ? 'text-primary-container' : 'text-on-surface'
                }`}
              >
                {vuln.fixed ? vuln.fixedSnippet : vuln.codeSnippet}
              </pre>
            </div>

            {/* AI Remediation */}
            <div className="mt-3 p-3 rounded-xl bg-secondary-container/20 space-y-1">
              <div className="flex items-center gap-1.5 text-secondary font-display text-xs font-bold">
                <Bot className="w-4 h-4" />
                <span>{t('راهکار پیشنهادی Gemini Sentinel', 'Gemini Sentinel Remediation')}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t(vuln.remediationFa, vuln.remediationEn)}
              </p>
            </div>

            {!vuln.fixed && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAutoFix(vuln.id)}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{t('اصلاح خودکار با هوش مصنوعی', 'Auto-Fix with AI')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleIgnore(vuln.id)}
                  className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-bright text-xs text-on-surface-variant"
                >
                  {t('چشم‌پوشی امن', 'Mute')}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Floating Quick Patch All Bar */}
      {unfixedCount > 0 && (
        <div className="sticky bottom-20 z-20 p-3 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl shadow-2xl cyber-border flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-xs font-bold text-on-surface truncate">
              {t(
                `${unfixedCount} آسیب‌پذیری آماده رفع خودکار`,
                `${unfixedCount} vulnerabilities ready for instant patch`
              )}
            </p>
            <p className="text-[10px] font-mono text-primary-fixed-dim truncate">
              {t('پیش‌نویس پچ امنیتی آماده اعمال است', 'AI remediation patch generated')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleFixAll}
            className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>{t('اعمال همه پچ‌ها', 'Patch All')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
