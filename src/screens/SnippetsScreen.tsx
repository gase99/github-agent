import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BrainCircuit,
  Code2,
  Copy,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
  Wand2,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { runSpecializedAiTask } from '../services/geminiApi';
import { copyText, shareText } from '../services/nativeBridge';
import type { CodeSnippet, SnippetCategory } from '../types/app';

export const SnippetsScreen: React.FC = () => {
  const {
    snippets,
    setSnippets,
    addSnippet,
    settings,
    recordTokenUsage,
    showToast,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<'all' | SnippetCategory | 'favorites'>('all');
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newLang, setNewLang] = useState<CodeSnippet['language']>('kotlin');
  const [newCode, setNewCode] = useState('');

  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      if (langFilter !== 'all' && s.language !== langFilter) return false;
      if (catFilter === 'favorites' && !s.favorite) return false;
      if (catFilter !== 'all' && catFilter !== 'favorites' && s.category !== catFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.subtitleFa.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.tags.some((tg) => tg.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [snippets, langFilter, catFilter, search]);

  const toggleFavorite = (id: string) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s))
    );
  };

  const deleteSnippet = (id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    showToast(t('اسنیپت حذف شد', 'Snippet removed'), 'purple');
  };

  const handleOptimize = async (snip: CodeSnippet) => {
    setOptimizingId(snip.id);
    try {
      const res = await runSpecializedAiTask({
        task: 'optimize-snippet',
        targetName: snip.title,
        codeOrContext: snip.code,
        settings,
      });
      const extracted =
        /```[a-zA-Z0-9_+-]*\n([\s\S]*?)```/.exec(res.summary)?.[1]?.trim() ||
        res.summary.trim();
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snip.id
            ? { ...s, code: extracted, badgeText: 'Gemini Optimized ✨' }
            : s
        )
      );
      recordTokenUsage(`Optimize: ${snip.title}`, settings.geminiModel, res.tokensUsed, 380);
      showToast(t('کد توسط Gemini بهینه‌سازی شد ✨', 'Snippet optimized by Gemini ✨'), 'cyan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Optimization error';
      showToast(msg, 'error');
    } finally {
      setOptimizingId(null);
    }
  };

  const handleCreateSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;
    const shortMap: Record<CodeSnippet['language'], string> = {
      kotlin: 'KT',
      python: 'PY',
      javascript: 'JS',
      bash: 'SH',
      sql: 'SQL',
    };
    addSnippet({
      title: newTitle.trim(),
      subtitleFa: newSubtitle.trim() || newTitle.trim(),
      language: newLang,
      langShort: shortMap[newLang],
      category: 'saved',
      tags: [`#${newLang}`, '#Custom'],
      badgeText: 'User Saved',
      code: newCode,
      favorite: true,
    });
    setNewTitle('');
    setNewSubtitle('');
    setNewCode('');
    setShowModal(false);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-12 gap-3.5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-surface-container-high text-primary-container flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-on-surface">
              {t('کتابخانه تکه‌کدها (Snippets)', 'Code Snippets Library')}
            </h1>
            <p className="text-[11px] text-on-surface-variant">
              {t('ذخیره‌شده در حافظه محلی دستگاه', 'Persisted locally on device')}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary-fixed-dim font-mono text-xs">
          {snippets.length} {t('اسنیپت', 'active')}
        </span>
      </div>

      {/* Search + Language Select */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-outline absolute top-3 start-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('جستجو در کدها و تگ‌ها...', 'Search code & tags...')}
            className="w-full ps-9 pe-8 py-2.5 rounded-xl bg-surface-container-high text-xs text-on-surface placeholder:text-outline outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-2.5 end-2.5 text-outline hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          dir="ltr"
          className="h-[38px] px-3 rounded-xl bg-surface-container-high text-xs font-mono text-on-surface outline-none cyber-border-subtle"
        >
          <option value="all">All Langs</option>
          <option value="kotlin">Kotlin (KT)</option>
          <option value="python">Python (PY)</option>
          <option value="javascript">JS / TS</option>
          <option value="bash">Bash (SH)</option>
          <option value="sql">SQL</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', icon: Bookmark, fa: 'همه', en: 'All' },
          { id: 'saved', icon: Bookmark, fa: 'ذخیره‌شده‌ها', en: 'Saved' },
          { id: 'ai', icon: BrainCircuit, fa: 'تولید هوش مصنوعی', en: 'AI Generated' },
          { id: 'utilities', icon: Wrench, fa: 'ابزارها', en: 'Utilities' },
          { id: 'favorites', icon: Star, fa: 'ستاره‌دار ★', en: 'Favorites ★' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = catFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCatFilter(tab.id as typeof catFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                active
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(tab.fa, tab.en)}</span>
            </button>
          );
        })}
      </div>

      {/* Snippet Cards */}
      <div className="flex flex-col gap-3.5">
        {filteredSnippets.map((snip) => (
          <div
            key={snip.id}
            className="bg-surface-container rounded-2xl overflow-hidden shadow-lg cyber-border-subtle"
          >
            {/* Card Header */}
            <div className="p-3.5 bg-surface-container-high flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-mono text-[10px] font-bold shrink-0">
                    {snip.langShort}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-on-surface truncate" dir="ltr">
                      {snip.title}
                    </h3>
                    <p className="text-xs text-outline truncate">{snip.subtitleFa}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(snip.id)}
                    className={`p-1.5 rounded-lg bg-surface-container ${
                      snip.favorite ? 'text-yellow-400' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${snip.favorite ? 'fill-yellow-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSnippet(snip.id)}
                    className="p-1.5 rounded-lg bg-surface-container text-outline hover:text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap" dir="ltr">
                  {snip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-surface-container text-primary-fixed-dim font-mono text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container/50 text-secondary font-mono text-[10px]" dir="ltr">
                  {snip.badgeText}
                </span>
              </div>
            </div>

            {/* Strictly LTR Code Box */}
            <div className="bg-surface-container-lowest p-3.5 overflow-x-auto text-left" dir="ltr">
              <pre className="font-mono text-xs leading-relaxed text-on-surface whitespace-pre">
                {snip.code}
              </pre>
            </div>

            {/* Action Bar */}
            <div className="p-3 bg-surface-container-low flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    await copyText(snip.code);
                    showToast(t('کد اسنیپت کپی شد ✓', 'Snippet copied ✓'), 'cyan');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface flex items-center gap-1.5 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5 text-primary-fixed-dim" />
                  <span>{t('کپی کد', 'Copy')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => shareText(snip.title, snip.code)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface flex items-center gap-1.5 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-secondary" />
                  <span>{t('اشتراک‌گذاری', 'Share')}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={optimizingId === snip.id}
                onClick={() => handleOptimize(snip)}
                className="px-3 py-1.5 rounded-xl bg-secondary-container text-on-secondary-container font-mono text-xs flex items-center gap-1.5 active:scale-95"
              >
                <Wand2
                  className={`w-3.5 h-3.5 ${optimizingId === snip.id ? 'animate-spin' : ''}`}
                />
                <span>
                  {optimizingId === snip.id
                    ? t('در حال بهینه‌سازی...', 'Optimizing...')
                    : t('بهینه‌سازی AI', 'AI Optimize')}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Snippet FAB */}
      <div className="sticky bottom-20 z-20 flex justify-end pointer-events-none">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="pointer-events-auto h-11 px-4 rounded-full bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center gap-1.5 shadow-[0_0_24px_rgba(0,245,212,0.4)] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('+ اسنیپت جدید', '+ New Snippet')}</span>
        </button>
      </div>

      {/* Add Snippet Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleCreateSnippet}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-low p-5 shadow-2xl cyber-border space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-on-surface">
                {t('ایجاد تکه‌کد جدید', 'Create New Code Snippet')}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('عنوان (مثلاً RetrofitRetry.kt)', 'Snippet title')}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-xs text-on-surface outline-none cyber-border-subtle"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder={t('توضیح کوتاه فارسی', 'Short description')}
                className="px-3 py-2 rounded-xl bg-surface-container-lowest text-xs text-on-surface outline-none cyber-border-subtle"
              />
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value as CodeSnippet['language'])}
                dir="ltr"
                className="px-3 py-2 rounded-xl bg-surface-container-lowest text-xs font-mono text-on-surface outline-none cyber-border-subtle"
              >
                <option value="kotlin">Kotlin</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript / TS</option>
                <option value="bash">Bash</option>
                <option value="sql">SQL</option>
              </select>
            </div>

            <textarea
              rows={6}
              dir="ltr"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="// Paste or write your code here..."
              className="w-full p-3 rounded-xl bg-surface-container-lowest font-mono text-xs text-on-surface outline-none cyber-border-subtle"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 rounded-xl bg-surface-container text-xs text-on-surface-variant"
              >
                {t('انصراف', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold"
              >
                {t('ذخیره اسنیپت', 'Save Snippet')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
