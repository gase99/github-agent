import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  GitFork,
  GitPullRequest,
  Globe,
  Lock,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  fetchGithubPullRequests,
  fetchGithubRepositories,
  fetchSingleGithubRepo,
} from '../services/githubApi';
import { runSpecializedAiTask } from '../services/geminiApi';
import type { RepoItem } from '../types/app';

export const RepositoriesScreen: React.FC = () => {
  const {
    repositories,
    setRepositories,
    selectRepo,
    toggleRepoStar,
    setActivePr,
    navigate,
    settings,
    updateSettings,
    recordTokenUsage,
    showToast,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'private' | 'public' | 'review' | 'starred'>('all');
  const [syncing, setSyncing] = useState(false);
  const [analyzingRepoId, setAnalyzingRepoId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [repoSlugInput, setRepoSlugInput] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);

  const filteredRepos = useMemo(() => {
    return repositories.filter((r) => {
      if (filter === 'private' && !r.private) return false;
      if (filter === 'public' && r.private) return false;
      if (filter === 'review' && !r.needsReview && !r.prNumber) return false;
      if (filter === 'starred' && !r.starred) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.fullName.toLowerCase().includes(q) ||
          r.language.toLowerCase().includes(q) ||
          r.descriptionFa.toLowerCase().includes(q) ||
          r.descriptionEn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [repositories, filter, search]);

  const handleSyncGithub = async () => {
    setSyncing(true);
    try {
      const liveRepos = await fetchGithubRepositories(
        settings.githubToken,
        settings.githubUsername
      );
      if (liveRepos.length > 0) {
        setRepositories((prev) => {
          const demoKeep = prev.filter((p) => !p.isRemoteGithub);
          const mergedMap = new Map<string, RepoItem>();
          for (const lr of liveRepos) mergedMap.set(lr.fullName.toLowerCase(), lr);
          for (const dr of demoKeep) {
            if (!mergedMap.has(dr.fullName.toLowerCase())) {
              mergedMap.set(dr.fullName.toLowerCase(), dr);
            }
          }
          return Array.from(mergedMap.values());
        });
        showToast(
          t(
            `${liveRepos.length} مخزن واقعی از GitHub همگام‌سازی شد ✓`,
            `Synced ${liveRepos.length} live repositories from GitHub ✓`
          ),
          'cyan'
        );
      } else {
        showToast(
          t('مخزنی برای این نام کاربری یافت نشد', 'No repositories found for this user'),
          'purple'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'GitHub error';
      showToast(
        t(
          `خطا در همگام‌سازی GitHub (${msg}) — نمایش مخازن ذخیره شده`,
          `GitHub sync error (${msg}) — showing cached repos`
        ),
        'error'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyzeRepo = async (repo: RepoItem) => {
    setAnalyzingRepoId(repo.id);
    try {
      const res = await runSpecializedAiTask({
        task: 'repo-scan',
        targetName: repo.fullName,
        codeOrContext: `${repo.fullName} (${repo.language}) - ${repo.descriptionEn}`,
        settings,
      });
      recordTokenUsage(`Repo Scan: ${repo.name}`, settings.geminiModel, res.tokensUsed, 410);
      setRepositories((prev) =>
        prev.map((r) =>
          r.id === repo.id
            ? {
                ...r,
                architectureSummaryFa: [res.summary],
                architectureSummaryEn: [res.summary],
              }
            : r
        )
      );
      selectRepo(
        {
          ...repo,
          architectureSummaryFa: [res.summary],
          architectureSummaryEn: [res.summary],
        },
        true
      );
      showToast(t('تحلیل هوشمند مخزن آماده شد ✨', 'AI repository analysis ready ✨'), 'cyan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis error';
      showToast(msg, 'error');
    } finally {
      setAnalyzingRepoId(null);
    }
  };

  const handleOpenPrReview = async (repo: RepoItem) => {
    selectRepo(repo, false);
    if (repo.isRemoteGithub) {
      const prs = await fetchGithubPullRequests(repo.owner, repo.name, settings.githubToken);
      if (prs.length > 0) {
        setActivePr(prs[0]);
        showToast(
          t(`PR واقعی #${prs[0].number} بارگذاری شد`, `Loaded live PR #${prs[0].number}`),
          'purple'
        );
      }
    }
    navigate('pr-review');
  };

  const handleImportRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = repoSlugInput
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/+$/, '');
    const parts = cleaned.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      showToast(
        t('فرمت صحیح: owner/repo (مثلاً gase99/github-agent)', 'Enter owner/repo format'),
        'error'
      );
      return;
    }

    setAddingRepo(true);
    try {
      const fetched = await fetchSingleGithubRepo(parts[0], parts[1], settings.githubToken);
      setRepositories((prev) => [
        fetched,
        ...prev.filter((r) => r.fullName.toLowerCase() !== fetched.fullName.toLowerCase()),
      ]);
      if (!settings.githubUsername) {
        updateSettings({ githubUsername: parts[0] });
      }
      setShowAddModal(false);
      setRepoSlugInput('');
      showToast(
        t(`مخزن ${fetched.fullName} با موفقیت اضافه شد ✓`, `Added ${fetched.fullName} ✓`),
        'cyan'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Not found';
      showToast(t(`عدم دسترسی به مخزن: ${msg}`, `Could not fetch repo: ${msg}`), 'error');
    } finally {
      setAddingRepo(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-10 gap-3.5">
      {/* Sync Status Banner */}
      <div className="w-full rounded-2xl bg-surface-container p-3.5 shadow-md cyber-border-subtle flex items-center justify-between gap-2 relative overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-on-surface truncate" dir="ltr">
                @{settings.githubUsername || 'developer_pro'}
              </span>
              <span className="font-mono text-[9px] text-primary-fixed-dim bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                {settings.githubToken.trim() ? 'PAT ACTIVE' : 'PUBLIC / DEMO'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              {t(
                'برای دریافت مخازن واقعی از GitHub روی دکمه همگام‌سازی بزنید',
                'Tap Sync to fetch real repositories from GitHub API'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncGithub}
          disabled={syncing}
          className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright active:scale-95 transition-all flex items-center gap-1.5 text-primary-container font-mono text-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{t('همگام‌سازی', 'Sync')}</span>
        </button>
      </div>

      {/* Search & Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-outline absolute top-3 start-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              'جستجوی مخزن، زبان برنامه‌نویسی یا توضیح...',
              'Search repositories, language, description...'
            )}
            className="w-full ps-10 pe-9 py-2.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs outline-none focus:bg-surface-container-high cyber-border-subtle transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-2.5 end-2.5 p-1 text-outline hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', fa: `همه (${repositories.length})`, en: `All (${repositories.length})` },
            { id: 'public', fa: 'عمومی (Public)', en: 'Public' },
            { id: 'private', fa: 'خصوصی (Private)', en: 'Private' },
            { id: 'starred', fa: 'نشان‌شده ★', en: 'Starred ★' },
            { id: 'review', fa: 'نیازمند بررسی', en: 'Needs Review' },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all active:scale-95 ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t(tab.fa, tab.en)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gemini Code Sentinel Banner */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container p-3 flex items-center justify-between shadow-md cyber-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display text-xs font-bold text-on-surface">Gemini Code Sentinel</p>
            <p className="text-[11px] text-on-surface-variant">
              {t(
                `${repositories.length} مخزن آماده کاوش فایل و تحلیل هوشمند کد`,
                `${repositories.length} repositories ready for deep file inspection`
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('security')}
          className="font-mono text-[10px] text-primary-container bg-surface-container-lowest px-2.5 py-1.5 rounded-lg hover:bg-surface-bright transition-colors"
        >
          {t('ممیزی امنیتی', 'Security Audit')}
        </button>
      </div>

      {/* Repository Cards Stream */}
      <div className="flex flex-col gap-3">
        {filteredRepos.map((repo) => (
          <article
            key={repo.id}
            className="w-full rounded-2xl bg-surface-container p-4 shadow-md cyber-border-subtle flex flex-col gap-3 hover:bg-surface-container-high/80 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-start gap-2.5 min-w-0 cursor-pointer flex-1"
                onClick={() => selectRepo(repo, true)}
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center shrink-0 mt-0.5 ${
                    repo.private ? 'text-secondary' : 'text-primary-fixed-dim'
                  }`}
                >
                  {repo.private ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <FolderGit2 className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2
                      className="font-display text-sm font-bold text-on-surface truncate"
                      dir="ltr"
                    >
                      {repo.fullName}
                    </h2>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase ${
                        repo.private
                          ? 'bg-secondary-container/60 text-secondary-fixed'
                          : 'bg-surface-container-highest text-primary-fixed-dim'
                      }`}
                    >
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                    {repo.isRemoteGithub && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container">
                        GitHub Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5 leading-relaxed">
                    {t(repo.descriptionFa, repo.descriptionEn)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleRepoStar(repo.id)}
                className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                  repo.starred ? 'text-yellow-400' : 'text-outline hover:text-on-surface'
                }`}
                title={t('نشان کردن مخزن', 'Bookmark Repository')}
              >
                <Star className={`w-4 h-4 ${repo.starred ? 'fill-yellow-400' : ''}`} />
              </button>
            </div>

            {/* Tech Stack & Metrics */}
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono text-on-surface-variant" dir="ltr">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                {repo.language}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest">
                <GitBranch className="w-3 h-3 text-secondary" />
                {repo.defaultBranch}
              </span>
              <span className="flex items-center gap-1 text-on-surface">
                <Star className="w-3.5 h-3.5 text-primary-fixed-dim" />
                {repo.stars}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" />
                {repo.forks}
              </span>
              <span className="ms-auto text-outline text-[10px]" dir="auto">
                {t(repo.updatedLabelFa, repo.updatedLabelEn)}
              </span>
            </div>

            {/* Actions Footer */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectRepo(repo, true)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-medium flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span>{t('مرور فایل‌ها و کد', 'Browse Files')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary-container" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrReview(repo)}
                  className="px-2.5 py-1.5 rounded-xl bg-secondary-container/40 hover:bg-secondary-container/60 text-secondary text-xs font-medium flex items-center gap-1 active:scale-95 transition-all"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>{repo.prNumber ? `PR #${repo.prNumber}` : 'PR Review'}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={analyzingRepoId === repo.id}
                onClick={() => handleAnalyzeRepo(repo)}
                className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    analyzingRepoId === repo.id ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {analyzingRepoId === repo.id
                    ? t('در حال تحلیل...', 'Analyzing...')
                    : t('تحلیل با Gemini', 'Analyze AI')}
                </span>
              </button>
            </div>
          </article>
        ))}

        {filteredRepos.length === 0 && (
          <div className="rounded-2xl bg-surface-container p-8 text-center text-on-surface-variant text-sm">
            {t('مخزنی مطابق فیلتر انتخاب‌شده یافت نشد.', 'No repositories match the current filter.')}
          </div>
        )}
      </div>

      {/* Floating Add Repo Button */}
      <div className="sticky bottom-20 z-20 flex justify-end pointer-events-none">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="pointer-events-auto h-11 px-4 rounded-full bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,245,212,0.35)] active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('+ افزودن مخزن GitHub', '+ Connect GitHub Repo')}</span>
        </button>
      </div>

      {/* Connect GitHub Repository Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleImportRepo}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-low p-5 shadow-2xl cyber-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-container" />
                <h3 className="font-display text-sm font-bold text-on-surface">
                  {t('افزودن مخزن مستقیم از GitHub', 'Import GitHub Repository')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-on-surface-variant">
                {t('نام مخزن (owner/repo) یا لینک GitHub:', 'Repository slug (owner/repo) or URL:')}
              </label>
              <input
                type="text"
                dir="ltr"
                required
                value={repoSlugInput}
                onChange={(e) => setRepoSlugInput(e.target.value)}
                placeholder="gase99/github-agent"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-mono text-xs outline-none cyber-border"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-xl bg-surface-container text-xs text-on-surface-variant"
              >
                {t('انصراف', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={addingRepo}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {addingRepo
                    ? t('در حال دریافت...', 'Fetching...')
                    : t('اتصال و بارگذاری', 'Import Repo')}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
