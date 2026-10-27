import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  CornerLeftUp,
  Download,
  FileCode2,
  FlaskConical,
  Folder,
  FolderOpen,
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CodeBlockCard } from '../components/CodeBlockCard';
import {
  fetchGithubFileContent,
  fetchGithubRepoCommits,
  fetchGithubRepoContents,
} from '../services/githubApi';
import { runSpecializedAiTask } from '../services/geminiApi';
import { copyText } from '../services/nativeBridge';
import type { RepoCommitItem, RepoFileNode } from '../types/app';

export const RepoDetailsScreen: React.FC = () => {
  const {
    selectedRepo,
    settings,
    navigate,
    recordTokenUsage,
    showToast,
    t,
  } = useApp();

  const [currentDir, setCurrentDir] = useState<string>('');
  const [treeNodes, setTreeNodes] = useState<RepoFileNode[]>(selectedRepo.files || []);
  const [selectedFile, setSelectedFile] = useState<RepoFileNode | null>(
    selectedRepo.files?.[1] || selectedRepo.files?.[0] || null
  );
  const [fileContent, setFileContent] = useState<string>(
    selectedRepo.files?.[1]?.content || selectedRepo.files?.[0]?.content || ''
  );
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const [commits, setCommits] = useState<RepoCommitItem[]>(
    selectedRepo.latestCommit ? [selectedRepo.latestCommit] : []
  );
  const [showCommits, setShowCommits] = useState(false);

  const [aiResult, setAiResult] = useState<string>(
    t(
      'پیشنهاد هوش مصنوعی: برای بررسی امنیتی، توضیح معماری یا تولید تست واحد روی دکمه‌های زیر کد کلیک کنید.',
      'AI Tip: Use the toolbar below the code viewer to explain, security-scan, or generate unit tests for any file.'
    )
  );
  const [runningAiTask, setRunningAiTask] = useState<string | null>(null);
  const [archSummary, setArchSummary] = useState<string[]>(
    (settings.language === 'fa'
      ? selectedRepo.architectureSummaryFa
      : selectedRepo.architectureSummaryEn) || [
      t(
        'ساختار مخزن آماده تحلیل عمیق توسط Gemini است.',
        'Repository structure is ready for deep Gemini architectural scan.'
      ),
    ]
  );

  // Load real GitHub directory tree if repo is live on GitHub
  useEffect(() => {
    setCurrentDir('');
    setArchSummary(
      (settings.language === 'fa'
        ? selectedRepo.architectureSummaryFa
        : selectedRepo.architectureSummaryEn) || []
    );

    if (!selectedRepo.isRemoteGithub) {
      const demoFiles = selectedRepo.files || [];
      setTreeNodes(demoFiles);
      const firstFile = demoFiles[1] || demoFiles[0] || null;
      setSelectedFile(firstFile);
      setFileContent(firstFile?.content || '');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingTree(true);
      try {
        const [nodes, recentCommits] = await Promise.all([
          fetchGithubRepoContents(
            selectedRepo.owner,
            selectedRepo.name,
            '',
            selectedRepo.defaultBranch,
            settings.githubToken
          ),
          fetchGithubRepoCommits(
            selectedRepo.owner,
            selectedRepo.name,
            selectedRepo.defaultBranch,
            settings.githubToken
          ),
        ]);
        if (cancelled) return;
        setTreeNodes(nodes);
        if (recentCommits.length > 0) setCommits(recentCommits);

        const readmeOrFirst =
          nodes.find((n) => n.type === 'file' && /readme/i.test(n.name)) ||
          nodes.find((n) => n.type === 'file');
        if (readmeOrFirst) {
          handleOpenNode(readmeOrFirst);
        }
      } catch {
        if (!cancelled && selectedRepo.files) {
          setTreeNodes(selectedRepo.files);
        }
      } finally {
        if (!cancelled) setLoadingTree(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo.id]);

  const handleOpenDirectory = async (dirPath: string) => {
    if (!selectedRepo.isRemoteGithub) return;
    setLoadingTree(true);
    try {
      const nodes = await fetchGithubRepoContents(
        selectedRepo.owner,
        selectedRepo.name,
        dirPath,
        selectedRepo.defaultBranch,
        settings.githubToken
      );
      setCurrentDir(dirPath);
      setTreeNodes(nodes);
    } catch (err) {
      showToast(
        t('خطا در باز کردن پوشه از GitHub', 'Failed to open directory from GitHub'),
        'error'
      );
    } finally {
      setLoadingTree(false);
    }
  };

  const handleOpenNode = async (node: RepoFileNode) => {
    if (node.type === 'dir') {
      await handleOpenDirectory(node.path);
      return;
    }
    setSelectedFile(node);
    if (node.content !== undefined) {
      setFileContent(node.content);
      return;
    }
    if (selectedRepo.isRemoteGithub) {
      setLoadingFile(true);
      try {
        const text = await fetchGithubFileContent(
          selectedRepo.owner,
          selectedRepo.name,
          node.path,
          selectedRepo.defaultBranch,
          settings.githubToken
        );
        setFileContent(text);
      } catch {
        setFileContent('// Unable to load file content from GitHub API');
      } finally {
        setLoadingFile(false);
      }
    }
  };

  const handleGoParentDir = () => {
    if (!currentDir) return;
    const parts = currentDir.split('/');
    parts.pop();
    handleOpenDirectory(parts.join('/'));
  };

  const handleRunFullScan = async () => {
    setRunningAiTask('repo-scan');
    try {
      const fileList = treeNodes.map((n) => n.path).join(', ');
      const res = await runSpecializedAiTask({
        task: 'repo-scan',
        targetName: selectedRepo.fullName,
        codeOrContext: `Files: ${fileList}\nSample:\n${fileContent.slice(0, 1200)}`,
        settings,
      });
      setArchSummary(res.summary.split('\n').filter((l) => l.trim().length > 0));
      recordTokenUsage(
        `Full Scan: ${selectedRepo.name}`,
        settings.geminiModel,
        res.tokensUsed,
        440
      );
      showToast(t('تحلیل جامع مخزن تکمیل شد ✓', 'Full repository scan completed ✓'), 'cyan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan error';
      showToast(msg, 'error');
    } finally {
      setRunningAiTask(null);
    }
  };

  const handleFileAiTool = async (
    task: 'explain-file' | 'security-file' | 'unit-tests'
  ) => {
    if (!selectedFile) return;
    setRunningAiTask(task);
    try {
      const res = await runSpecializedAiTask({
        task,
        targetName: selectedFile.path,
        codeOrContext: fileContent.slice(0, 3500),
        settings,
      });
      setAiResult(res.summary);
      recordTokenUsage(
        `${task}: ${selectedFile.name}`,
        settings.geminiModel,
        res.tokensUsed,
        360
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI task error';
      showToast(msg, 'error');
    } finally {
      setRunningAiTask(null);
    }
  };

  const cloneCmd = `git clone https://github.com/${selectedRepo.fullName}.git`;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-10 gap-4">
      {/* Repository Metadata Header Card */}
      <section className="bg-surface-container-low rounded-2xl p-4 shadow-md cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0" dir="ltr">
            <FileCode2 className="w-4 h-4 text-primary-container shrink-0" />
            <span className="font-mono text-xs text-on-surface-variant truncate">
              {selectedRepo.owner}
            </span>
            <span className="text-outline-variant font-mono">/</span>
            <span className="font-display text-sm font-bold text-primary truncate">
              {selectedRepo.name}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary-fixed-dim font-mono text-[10px] shrink-0">
            {selectedRepo.private ? 'Private' : 'Public'}
          </span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          {t(selectedRepo.descriptionFa, selectedRepo.descriptionEn)}
        </p>

        {/* Stat Chips */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs" dir="ltr">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface">
            <GitBranch className="w-3.5 h-3.5 text-primary-container" />
            {selectedRepo.defaultBranch}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {selectedRepo.stars}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface">
            <GitFork className="w-3.5 h-3.5 text-outline" />
            {selectedRepo.forks}
          </span>
          <button
            type="button"
            onClick={() => navigate('pr-review')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-container/35 text-secondary hover:bg-secondary-container/50 active:scale-95 transition-all"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>PR #{selectedRepo.prNumber || 47}</span>
          </button>
        </div>

        {/* Clone & Commits Quick Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={async () => {
              await copyText(cloneCmd);
              showToast(t('دستور git clone کپی شد ✓', 'Copied git clone command ✓'), 'cyan');
            }}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium"
          >
            <Download className="w-4 h-4 text-primary-container" />
            <span>{t('کپی دستور Clone', 'Copy Clone URL')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCommits((v) => !v)}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-medium"
          >
            <GitCommit className="w-4 h-4 text-secondary" />
            <span>
              {t(`تاریخچه کامیت‌ها (${commits.length})`, `Commits (${commits.length})`)}
            </span>
          </button>
        </div>

        {/* Expandable Commit History */}
        {showCommits && commits.length > 0 && (
          <div className="rounded-xl bg-surface-container-lowest p-3 space-y-2 border border-white/[0.05]">
            {commits.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-mono text-on-surface truncate" dir="ltr">
                    {c.message}
                  </p>
                  <p className="text-[10px] text-outline">
                    {c.author} • {c.dateLabel}
                  </p>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary-fixed-dim shrink-0" dir="ltr">
                  {c.sha}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Full Repository Scan Banner */}
      <section className="bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low rounded-2xl p-4 shadow-lg cyber-border space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center shrink-0 text-surface-container-lowest">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-sm font-bold text-primary">
                {t('تحلیل هوشمند معماری مخزن', 'AI Repository Architecture Insights')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container font-mono text-[10px]">
                {settings.geminiModel}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {archSummary.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-xl bg-surface-container-lowest/60 text-xs text-on-surface"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
                  <span className="leading-relaxed" dir="auto">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={runningAiTask === 'repo-scan'}
          onClick={handleRunFullScan}
          className="w-full py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,245,212,0.3)] active:scale-98 transition-all"
        >
          <Sparkles
            className={`w-4 h-4 ${runningAiTask === 'repo-scan' ? 'animate-spin' : ''}`}
          />
          <span>
            {runningAiTask === 'repo-scan'
              ? t('در حال اسکن فایل‌ها با Gemini...', 'Scanning repository with Gemini...')
              : t('تحلیل عمیق کل کدهای پروژه', 'Run Deep AI Architecture Scan')}
          </span>
        </button>
      </section>

      {/* File Explorer Tree */}
      <section className="bg-surface-container-low rounded-2xl overflow-hidden shadow-md cyber-border-subtle">
        <div className="px-4 py-3 bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary-container" />
            <span className="font-display text-xs font-bold text-on-surface">
              {t('مرورگر ساختار فایل‌ها', 'Repository File Explorer')}
            </span>
          </div>
          <span className="font-mono text-[11px] text-primary-fixed-dim" dir="ltr">
            /{currentDir}
          </span>
        </div>

        <div className="divide-y divide-white/[0.05] max-h-64 overflow-y-auto">
          {currentDir && (
            <button
              type="button"
              onClick={handleGoParentDir}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-surface-container text-xs text-on-surface-variant"
              dir="ltr"
            >
              <span className="flex items-center gap-2 font-mono">
                <CornerLeftUp className="w-4 h-4 text-outline" />
                .. (Parent Directory)
              </span>
              <span className="text-[10px]">Up</span>
            </button>
          )}

          {loadingTree ? (
            <div className="p-6 text-center text-xs font-mono text-on-surface-variant">
              {t('در حال دریافت لیست فایل‌ها از GitHub...', 'Loading repository tree from GitHub...')}
            </div>
          ) : (
            treeNodes.map((node) => {
              const isSelected = selectedFile?.path === node.path;
              return (
                <button
                  key={node.path}
                  type="button"
                  onClick={() => handleOpenNode(node)}
                  className={`w-full px-4 py-2.5 flex items-center justify-between transition-all text-start ${
                    isSelected
                      ? 'bg-primary-container/12 border-s-4 border-primary-container'
                      : 'hover:bg-surface-container/70'
                  }`}
                  dir="ltr"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {node.type === 'dir' ? (
                      <Folder className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <FileCode2 className="w-4 h-4 text-primary-container shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`font-mono text-xs truncate ${
                          isSelected ? 'text-primary font-bold' : 'text-on-surface'
                        }`}
                      >
                        {node.name}
                        {node.type === 'dir' ? '/' : ''}
                      </p>
                      {node.sizeLabel && (
                        <p className="text-[10px] font-mono text-outline">{node.sizeLabel}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-outline shrink-0">
                    {node.type === 'dir' ? 'Open' : 'View'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Selected File Code Viewer + AI File Operations */}
      {selectedFile && (
        <section className="bg-surface-container-low rounded-2xl p-4 shadow-xl cyber-border-subtle space-y-3">
          {loadingFile ? (
            <div className="p-8 text-center font-mono text-xs text-primary-container">
              {t('در حال بارگذاری محتوای فایل...', 'Fetching file content...')}
            </div>
          ) : (
            <CodeBlockCard
              language={selectedFile.language || 'kotlin'}
              filename={selectedFile.path}
              code={fileContent}
            />
          )}

          {/* AI Operations Toolbar on Selected File */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={Boolean(runningAiTask)}
              onClick={() => handleFileAiTool('explain-file')}
              className="py-2 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center gap-1.5 text-xs font-medium text-on-surface active:scale-95 transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-primary-container shrink-0" />
              <span className="truncate">{t('توضیح کد', 'Explain')}</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningAiTask)}
              onClick={() => handleFileAiTool('security-file')}
              className="py-2 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center gap-1.5 text-xs font-medium text-on-surface active:scale-95 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-error shrink-0" />
              <span className="truncate">{t('اسکن امنیت', 'Audit File')}</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningAiTask)}
              onClick={() => handleFileAiTool('unit-tests')}
              className="py-2 px-2.5 rounded-xl bg-secondary-container/35 hover:bg-secondary-container/50 flex items-center justify-center gap-1.5 text-xs font-semibold text-secondary active:scale-95 transition-all"
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('تولید تست', 'Gen Tests')}</span>
            </button>
          </div>

          {/* Dynamic AI File Insight Result */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest/90 cyber-border flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
            <div className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap min-w-0 flex-1" dir="auto">
              {runningAiTask
                ? t('در حال تحلیل فایل توسط هوش مصنوعی...', 'Running AI analysis on file...')
                : aiResult}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
