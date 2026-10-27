import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEMO_REPOSITORIES,
  DEFAULT_SETTINGS,
  INITIAL_CACHE_ARTIFACTS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_PULL_REQUEST,
  INITIAL_SNIPPETS,
  INITIAL_TOKEN_EVENTS,
  INITIAL_VULNERABILITIES,
} from '../data/demoData';
import { hapticTap, initNativeAndroid, storageGet, storageSet } from '../services/nativeBridge';
import { pathToScreen, SCREEN_TO_PATH } from '../utils/routes';
import type {
  AppScreen,
  AppSettings,
  CacheArtifact,
  ChatMessage,
  CodeSnippet,
  PullRequestItem,
  RepoItem,
  TokenEventLog,
  VulnerabilityItem,
} from '../types/app';

interface ToastState {
  id: number;
  message: string;
  tone: 'cyan' | 'purple' | 'error';
}

interface AppContextValue {
  currentScreen: AppScreen;
  canGoBack: boolean;
  navigate: (screen: AppScreen) => void;
  goBack: () => boolean;
  isLauncherOpen: boolean;
  setLauncherOpen: (open: boolean) => void;

  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleLanguage: () => void;
  isRtl: boolean;
  t: (fa: string, en: string) => string;

  toast: ToastState | null;
  showToast: (message: string, tone?: 'cyan' | 'purple' | 'error') => void;

  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearChat: () => void;

  repositories: RepoItem[];
  setRepositories: React.Dispatch<React.SetStateAction<RepoItem[]>>;
  selectedRepo: RepoItem;
  selectRepo: (repo: RepoItem, openDetails?: boolean) => void;
  toggleRepoStar: (repoId: string) => void;

  activePr: PullRequestItem;
  setActivePr: React.Dispatch<React.SetStateAction<PullRequestItem>>;

  vulnerabilities: VulnerabilityItem[];
  setVulnerabilities: React.Dispatch<React.SetStateAction<VulnerabilityItem[]>>;

  snippets: CodeSnippet[];
  setSnippets: React.Dispatch<React.SetStateAction<CodeSnippet[]>>;
  addSnippet: (snippet: Omit<CodeSnippet, 'id'>) => void;

  tokenEvents: TokenEventLog[];
  recordTokenUsage: (title: string, modelBadge: string, tokens: number, latencyMs: number) => void;
  totalTokensUsed: number;

  cacheEnabled: boolean;
  setCacheEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  cacheRemainingMinutes: number;
  extendCacheMinutes: (addMinutes: number) => void;
  purgeCache: () => void;
  cacheArtifacts: CacheArtifact[];
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  settings: 'gh_agent_settings_v1',
  snippets: 'gh_agent_snippets_v1',
  messages: 'gh_agent_chat_v1',
  tokens: 'gh_agent_tokens_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const currentScreen = useMemo(() => pathToScreen(location.pathname), [location.pathname]);

  const [historyDepth, setHistoryDepth] = useState<number>(0);
  const [isLauncherOpen, setLauncherOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [repositories, setRepositories] = useState<RepoItem[]>(DEMO_REPOSITORIES);
  const [selectedRepoId, setSelectedRepoId] = useState<string>(DEMO_REPOSITORIES[0].id);

  const [activePr, setActivePr] = useState<PullRequestItem>(INITIAL_PULL_REQUEST);
  const [vulnerabilities, setVulnerabilities] =
    useState<VulnerabilityItem[]>(INITIAL_VULNERABILITIES);
  const [snippets, setSnippets] = useState<CodeSnippet[]>(INITIAL_SNIPPETS);

  const [tokenEvents, setTokenEvents] = useState<TokenEventLog[]>(INITIAL_TOKEN_EVENTS);
  const [totalTokensUsed, setTotalTokensUsed] = useState<number>(1420000);

  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true);
  const [cacheRemainingMinutes, setCacheRemainingMinutes] = useState<number>(252);
  const [cacheArtifacts] = useState<CacheArtifact[]>(INITIAL_CACHE_ARTIFACTS);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [savedSettings, savedSnippets, savedMessages, savedTokens] = await Promise.all([
        storageGet<AppSettings | null>(STORAGE_KEYS.settings, null),
        storageGet<CodeSnippet[] | null>(STORAGE_KEYS.snippets, null),
        storageGet<ChatMessage[] | null>(STORAGE_KEYS.messages, null),
        storageGet<number | null>(STORAGE_KEYS.tokens, null),
      ]);
      if (!active) return;
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      }
      if (savedSnippets && Array.isArray(savedSnippets) && savedSnippets.length > 0) {
        setSnippets(savedSnippets);
      }
      if (savedMessages && Array.isArray(savedMessages) && savedMessages.length > 0) {
        setMessages(savedMessages);
      }
      if (typeof savedTokens === 'number' && savedTokens > 0) {
        setTotalTokensUsed(savedTokens);
      }
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.settings, settings);
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.snippets, snippets);
  }, [snippets, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.messages, messages.slice(-30));
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storageSet(STORAGE_KEYS.tokens, totalTokensUsed);
  }, [totalTokensUsed, hydrated]);

  useEffect(() => {
    const dir = settings.language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', settings.language);
  }, [settings.language]);

  const showToast = useCallback(
    (message: string, tone: 'cyan' | 'purple' | 'error' = 'cyan') => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  const navigate = useCallback(
    (screen: AppScreen) => {
      hapticTap();
      setLauncherOpen(false);
      if (screen === currentScreen) return;
      setHistoryDepth((d) => d + 1);
      routerNavigate(SCREEN_TO_PATH[screen]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentScreen, routerNavigate]
  );

  const goBack = useCallback((): boolean => {
    if (isLauncherOpen) {
      setLauncherOpen(false);
      return true;
    }
    if (historyDepth > 0) {
      setHistoryDepth((d) => Math.max(0, d - 1));
      routerNavigate(-1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    if (currentScreen !== 'chat') {
      routerNavigate('/');
      return true;
    }
    return false;
  }, [currentScreen, historyDepth, isLauncherOpen, routerNavigate]);

  // Bind Android hardware Back button via @capacitor/app
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initNativeAndroid(() => goBackRef.current()).then((fn) => {
      cleanup = fn;
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const t = useCallback(
    (fa: string, en: string) => (settings.language === 'fa' ? fa : en),
    [settings.language]
  );

  const toggleLanguage = useCallback(() => {
    hapticTap();
    setSettings((prev) => {
      const nextLang = prev.language === 'fa' ? 'en' : 'fa';
      showToast(
        nextLang === 'fa'
          ? 'زبان برنامه به فارسی (RTL) تغییر کرد'
          : 'Switched interface to English (LTR)',
        'cyan'
      );
      return { ...prev, language: nextLang };
    });
  }, [showToast]);

  const selectedRepo = useMemo(() => {
    return (
      repositories.find((r) => r.id === selectedRepoId) ||
      repositories[0] ||
      DEMO_REPOSITORIES[0]
    );
  }, [repositories, selectedRepoId]);

  const selectRepo = useCallback(
    (repo: RepoItem, openDetails = true) => {
      setRepositories((prev) => {
        const exists = prev.some((r) => r.id === repo.id);
        return exists ? prev : [repo, ...prev];
      });
      setSelectedRepoId(repo.id);
      if (openDetails) {
        navigate('repo-details');
      }
    },
    [navigate]
  );

  const toggleRepoStar = useCallback((repoId: string) => {
    hapticTap();
    setRepositories((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, starred: !r.starred } : r))
    );
  }, []);

  const addSnippet = useCallback(
    (snippet: Omit<CodeSnippet, 'id'>) => {
      const created: CodeSnippet = {
        ...snippet,
        id: `snip-${Date.now()}`,
      };
      setSnippets((prev) => [created, ...prev]);
      showToast(
        settings.language === 'fa'
          ? 'در کتابخانه تکه‌کدها ذخیره شد ✓'
          : 'Saved to Code Snippets ✓',
        'cyan'
      );
    },
    [settings.language, showToast]
  );

  const recordTokenUsage = useCallback(
    (title: string, modelBadge: string, tokens: number, latencyMs: number) => {
      if (tokens <= 0) return;
      setTotalTokensUsed((prev) => prev + tokens);
      const costUsd = Number(((tokens / 1000) * 0.003).toFixed(4));
      const newEvt: TokenEventLog = {
        id: `evt-${Date.now()}`,
        title,
        modelBadge,
        timeAgo: 'Just now',
        latencyLabel: `${latencyMs}ms`,
        tokens,
        costUsd,
        accent: 'cyan',
      };
      setTokenEvents((prev) => [newEvt, ...prev.slice(0, 12)]);
    },
    []
  );

  const extendCacheMinutes = useCallback((addMinutes: number) => {
    setCacheEnabled(true);
    setCacheRemainingMinutes((prev) => Math.min(1440, prev + addMinutes));
  }, []);

  const purgeCache = useCallback(() => {
    setCacheEnabled(false);
    setCacheRemainingMinutes(0);
  }, []);

  const clearChat = useCallback(() => {
    setMessages(INITIAL_CHAT_MESSAGES);
    showToast(
      settings.language === 'fa' ? 'تاریخچه گفتگو بازنشانی شد' : 'Chat conversation reset',
      'purple'
    );
  }, [settings.language, showToast]);

  const value: AppContextValue = {
    currentScreen,
    canGoBack: historyDepth > 0 || currentScreen !== 'chat',
    navigate,
    goBack,
    isLauncherOpen,
    setLauncherOpen,
    settings,
    updateSettings,
    toggleLanguage,
    isRtl: settings.language === 'fa',
    t,
    toast,
    showToast,
    messages,
    setMessages,
    clearChat,
    repositories,
    setRepositories,
    selectedRepo,
    selectRepo,
    toggleRepoStar,
    activePr,
    setActivePr,
    vulnerabilities,
    setVulnerabilities,
    snippets,
    setSnippets,
    addSnippet,
    tokenEvents,
    recordTokenUsage,
    totalTokensUsed,
    cacheEnabled,
    setCacheEnabled,
    cacheRemainingMinutes,
    extendCacheMinutes,
    purgeCache,
    cacheArtifacts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
