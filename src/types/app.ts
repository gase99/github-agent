export type AppScreen =
  | 'chat'
  | 'repos'
  | 'repo-details'
  | 'pr-review'
  | 'security'
  | 'snippets'
  | 'analytics'
  | 'cache-details'
  | 'settings';

export type LanguageMode = 'fa' | 'en';

export type GeminiModelId =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export type CacheTtlPreset = '1h' | '6h' | '12h' | '24h';

export interface TelegramRecipient {
  id: string;
  labelFa: string;
  labelEn: string;
  chatId: string;
  badge: string;
  isPrimary?: boolean;
}

export interface SmsRecipient {
  id: string;
  labelFa: string;
  labelEn: string;
  phone: string;
  isPrimary?: boolean;
}

export interface AppSettings {
  language: LanguageMode;
  geminiApiKey: string;
  geminiModel: GeminiModelId;
  githubToken: string;
  githubUsername: string;
  autoCopyCode: boolean;
  tokenStreaming: boolean;
  webhooksEnabled: boolean;
  autoSyncBranches: boolean;
  monthlyBudgetCap: number;
  hardStopBudget: boolean;
  alertManagerEnabled: boolean;
  alertThresholds: number[];
  telegramRecipients: TelegramRecipient[];
  smsRecipients: SmsRecipient[];
  discordWebhookUrl: string;
  defaultCacheTtl: CacheTtlPreset;
  autoRenewCacheOnPush: boolean;
}

export interface ParsedCodeBlock {
  language: string;
  filename?: string;
  code: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translatedHint?: string;
  timestamp: string;
  modelBadge?: string;
  latencyMs?: number;
  tokensUsed?: number;
  isLiveApi?: boolean;
  liked?: 'up' | 'down' | null;
  repoContext?: string;
}

export interface RepoFileNode {
  name: string;
  path: string;
  type: 'dir' | 'file';
  sizeLabel?: string;
  updatedAt?: string;
  language?: string;
  content?: string;
  sha?: string;
}

export interface RepoCommitItem {
  sha: string;
  message: string;
  author: string;
  dateLabel: string;
}

export interface RepoItem {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  descriptionFa: string;
  descriptionEn: string;
  private: boolean;
  language: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  updatedLabelFa: string;
  updatedLabelEn: string;
  starred?: boolean;
  needsReview?: boolean;
  prNumber?: number;
  securityPassed?: boolean;
  isRemoteGithub?: boolean;
  htmlUrl?: string;
  latestCommit?: RepoCommitItem;
  architectureSummaryFa?: string[];
  architectureSummaryEn?: string[];
  files?: RepoFileNode[];
}

export interface DiffLine {
  oldLine: number | null;
  newLine: number | null;
  type: 'context' | 'add' | 'del';
  content: string;
  aiComment?: {
    titleFa: string;
    titleEn: string;
    bodyFa: string;
    bodyEn: string;
    suggestedCode: string;
    applied?: boolean;
  };
}

export interface DiffFileItem {
  filename: string;
  language: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

export interface PullRequestItem {
  id: string;
  number: number;
  repoFullName: string;
  title: string;
  subtitleFa: string;
  state: 'open' | 'merged' | 'closed';
  sourceBranch: string;
  targetBranch: string;
  commitSha: string;
  author: string;
  authorRoleFa: string;
  authorRoleEn: string;
  additions: number;
  deletions: number;
  changedFilesCount: number;
  securityScore: number;
  architectureGrade: string;
  verdictFa: string;
  verdictEn: string;
  findings: {
    icon: 'speed' | 'security' | 'tip';
    title: string;
    descFa: string;
    descEn: string;
  }[];
  files: DiffFileItem[];
  checklist: {
    id: string;
    labelFa: string;
    labelEn: string;
    checked: boolean;
  }[];
  reactions: {
    rocket: number;
    eyes: number;
    fire: number;
  };
  comments: {
    id: string;
    author: string;
    body: string;
    time: string;
  }[];
  isRemoteGithub?: boolean;
}

export type VulnSeverity = 'critical' | 'high' | 'medium' | 'info';
export type VulnCategory = 'secrets' | 'dependencies' | 'sast';

export interface VulnerabilityItem {
  id: string;
  codeId: string;
  severity: VulnSeverity;
  category: VulnCategory;
  cvssOrCve: string;
  cweTag: string;
  title: string;
  descriptionFa: string;
  descriptionEn: string;
  filePath: string;
  languageLabel: string;
  codeSnippet: string;
  fixedSnippet: string;
  remediationFa: string;
  remediationEn: string;
  fixed?: boolean;
  ignored?: boolean;
}

export type SnippetCategory = 'saved' | 'ai' | 'utilities';

export interface CodeSnippet {
  id: string;
  title: string;
  subtitleFa: string;
  language: 'kotlin' | 'python' | 'javascript' | 'bash' | 'sql';
  langShort: string;
  category: SnippetCategory;
  tags: string[];
  badgeText: string;
  code: string;
  favorite: boolean;
}

export interface TokenEventLog {
  id: string;
  title: string;
  modelBadge: string;
  timeAgo: string;
  latencyLabel: string;
  tokens: number;
  costUsd: number;
  accent: 'cyan' | 'error' | 'purple';
}

export interface CacheArtifact {
  id: string;
  code: 'KT' | 'DOC' | 'SEC' | 'GIT';
  titleFa: string;
  titleEn: string;
  metaFiles: string;
  tokensK: number;
  statusFa: string;
  statusEn: string;
  previewContent: string;
}
