import type {
  AppSettings,
  CacheArtifact,
  ChatMessage,
  CodeSnippet,
  PullRequestItem,
  RepoItem,
  TokenEventLog,
  VulnerabilityItem,
} from '../types/app';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'fa',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  githubToken: '',
  githubUsername: 'gase99',
  autoCopyCode: false,
  tokenStreaming: true,
  webhooksEnabled: true,
  autoSyncBranches: true,
  monthlyBudgetCap: 25,
  hardStopBudget: true,
  alertManagerEnabled: true,
  alertThresholds: [75, 90, 100],
  telegramRecipients: [
    {
      id: 'tg-1',
      labelFa: 'توسعه‌دهنده اصلی (Primary)',
      labelEn: 'Primary Developer',
      chatId: '948271049',
      badge: '@MyAssistantAlertBot',
      isPrimary: true,
    },
    {
      id: 'tg-2',
      labelFa: 'گروه عملیات دِواپس (DevOps Group)',
      labelEn: 'DevOps Operations Channel',
      chatId: '-10018928374',
      badge: 'Channel',
    },
  ],
  smsRecipients: [
    {
      id: 'sms-1',
      labelFa: 'شماره اصلی مدیر (Primary)',
      labelEn: 'Primary Engineering Lead',
      phone: '+98 912 *** 4820',
      isPrimary: true,
    },
    {
      id: 'sms-2',
      labelFa: 'شماره پشتیبان تیم (On-Call)',
      labelEn: 'Team Backup On-Call',
      phone: '+98 935 *** 1104',
    },
  ],
  discordWebhookUrl: '',
  defaultCacheTtl: '6h',
  autoRenewCacheOnPush: true,
};

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content:
      'چطور می‌تونم با Retrofit در کاتلین به API گیت‌هاب ریکوئست بفرستم و لیست مخازن رو بگیرم؟',
    translatedHint: 'How to fetch GitHub repos using Retrofit in Kotlin?',
    timestamp: '14:02',
    repoContext: 'kotlin-ai-agent',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `سلام! برای اتصال به API گیت‌هاب با استفاده از \`Retrofit 2\` و کاتلین، بهترین الگو استفاده از \`Coroutines\` و مبدل \`Kotlinx Serialization\` یا Moshi است.

در نمونه پیاده‌سازی زیر، مدل داده، اینترفیس API و سرویس فراخوانی اندپوینت \`/users/{username}/repos\` را آماده کرده‌ام:

\`\`\`kotlin:GitHubService.kt
// Data model for GitHub repository entity
data class GitHubRepo(
    val id: Long,
    val name: String,
    val full_name: String,
    val stargazers_count: Int = 0
)

interface GitHubApiService {
    @GET("users/{username}/repos")
    suspend fun getUserRepositories(
        @Path("username") user: String
    ): Response<List<GitHubRepo>>
}
\`\`\`

نکته معماری: برای احراز هویت امن در اندروید، توکن را از \`EncryptedSharedPreferences\` خوانده و از طریق یک \`OkHttp Interceptor\` در هدر \`Authorization: Bearer <token>\` تزریق کنید.`,
    timestamp: '14:02',
    modelBadge: 'Gemini Code Assistant',
    latencyMs: 420,
    tokensUsed: 318,
    isLiveApi: false,
    liked: null,
  },
];

export const DEMO_REPOSITORIES: RepoItem[] = [
  {
    id: 'repo-kotlin-agent',
    owner: 'developer_pro',
    name: 'kotlin-ai-agent',
    fullName: 'developer_pro/kotlin-ai-agent',
    descriptionFa:
      'کلاینت نیتیو اندروید برای ارتباط همگام و استریم چندوجهی با مدل‌های هوش مصنوعی Gemini با معماری تمیز و Jetpack Compose.',
    descriptionEn:
      'Autonomous Android client for real-time multimodal SSE streaming with Gemini models using Clean Architecture & Compose.',
    private: false,
    language: 'Kotlin',
    defaultBranch: 'main',
    stars: 142,
    forks: 28,
    openIssuesCount: 3,
    updatedLabelFa: '۲ دقیقه پیش',
    updatedLabelEn: '2m ago',
    starred: true,
    needsReview: false,
    prNumber: 47,
    securityPassed: true,
    latestCommit: {
      sha: '7f8c2b1',
      message: 'feat: add Gemini streaming SSE client & structured cancellation',
      author: 'developer_pro',
      dateLabel: '۱۲ دقیقه پیش',
    },
    architectureSummaryFa: [
      'الگوی Clean Architecture + MVI با پیاده‌سازی کوروتین‌های غیرمسدودکننده Kotlin Flow.',
      'اتصال استریم مستقیم به Gemini SSE Endpoint به همراه لغو خودکار در چرخه حیات ViewModel.',
      'رابط کاربری ماژولار مبتنی بر Material 3 با پشتیبانی کامل دوجهته (RTL / LTR).',
    ],
    architectureSummaryEn: [
      'Clean Architecture + MVI pattern powered by non-blocking Kotlin Coroutines Flow.',
      'Direct SSE streaming pipeline to Gemini API with automatic lifecycle cancellation.',
      'Modular Material 3 UI design system with native bidirectional RTL/LTR ergonomics.',
    ],
    files: [
      {
        name: 'core/network/RateLimiter.kt',
        path: 'core/network/RateLimiter.kt',
        type: 'file',
        sizeLabel: '2.1 KB',
        updatedAt: '۱ ساعت پیش',
        language: 'kotlin',
        content: `package io.cyberagent.core.network

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class TokenRateLimiter(
    private val maxRequestsPerMinute: Int = 15
) {
    private val mutex = Mutex()
    private val timestamps = ArrayDeque<Long>()

    suspend fun acquirePermit(): Boolean = mutex.withLock {
        val now = System.currentTimeMillis()
        while (timestamps.isNotEmpty() && now - timestamps.first() > 60_000L) {
            timestamps.removeFirst()
        }
        if (timestamps.size >= maxRequestsPerMinute) return false
        timestamps.addLast(now)
        true
    }
}`,
      },
      {
        name: 'core/ai/GeminiClient.kt',
        path: 'core/ai/GeminiClient.kt',
        type: 'file',
        sizeLabel: '3.4 KB',
        updatedAt: '۱۲ دقیقه پیش',
        language: 'kotlin',
        content: `package io.cyberagent.core.ai

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

class GeminiClient(
    private val apiKeyProvider: () -> String,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun streamInference(prompt: String): Flow<String> =
        flow {
            require(prompt.isNotBlank()) { "Prompt must not be blank" }
            // Emit streamed tokens safely via SSE connection
            emit("Streaming initialized for model gemini-2.5-flash...")
        }.flowOn(dispatcher)
}`,
      },
      {
        name: 'core/ai/PromptTemplate.kt',
        path: 'core/ai/PromptTemplate.kt',
        type: 'file',
        sizeLabel: '1.8 KB',
        updatedAt: '۲ ساعت پیش',
        language: 'kotlin',
        content: `package io.cyberagent.core.ai

object PromptTemplate {
    fun codeReviewPrompt(diff: String, locale: String = "fa"): String = """
        You are an expert Android & Security architect.
        Analyze the following Git diff and highlight memory, concurrency, or secret-leak issues.
        Response locale: $locale
        Diff:
        $diff
    """.trimIndent()
}`,
      },
      {
        name: 'app/build.gradle.kts',
        path: 'app/build.gradle.kts',
        type: 'file',
        sizeLabel: '4.1 KB',
        updatedAt: 'دیروز',
        language: 'kotlin',
        content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "io.github.gase99.githubagent"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.gase99.githubagent"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
}`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        sizeLabel: '2.2 KB',
        updatedAt: '۵ روز پیش',
        language: 'markdown',
        content: `# Kotlin AI Agent
Autonomous mobile developer assistant integrating Gemini 2.5 & GitHub REST APIs.
- Clean Architecture + Coroutines Flow
- Bilingual Persian (RTL) & English (LTR)
- Context Caching & SAST Security Sentinel`,
      },
    ],
  },
  {
    id: 'repo-ecommerce-go',
    owner: 'developer_pro',
    name: 'ecommerce-backend-api',
    fullName: 'developer_pro/ecommerce-backend-api',
    descriptionFa: 'سرویس بک‌اند فروشگاهی با فریمورک Gin و کنترل تراکنش‌های بانکی • Core payment API',
    descriptionEn: 'High-throughput payment & order microservice built with Go, Gin, and Redis.',
    private: true,
    language: 'Go / Gin',
    defaultBranch: 'main',
    stars: 12,
    forks: 4,
    openIssuesCount: 2,
    updatedLabelFa: '۱ ساعت پیش',
    updatedLabelEn: '1h ago',
    starred: false,
    needsReview: true,
    prNumber: 47,
    securityPassed: false,
    latestCommit: {
      sha: '9c2a11b',
      message: 'fix(payment): enforce idempotency key on webhook retries',
      author: 'developer_pro',
      dateLabel: '۱ ساعت پیش',
    },
    architectureSummaryFa: [
      'معماری Hexagonal در Go با جداسازی کامل لایه درگاه پرداخت و دیتابیس PostgreSQL.',
      'کنترل همروندی تراکنش‌ها با قفل توزیع‌شده Redis و کلید Idempotency.',
    ],
    architectureSummaryEn: [
      'Hexagonal Go architecture isolating payment gateway adapters from PostgreSQL persistence.',
      'Distributed Redis locking with strict idempotency keys on webhook endpoints.',
    ],
    files: [
      {
        name: 'internal/payment/handler.go',
        path: 'internal/payment/handler.go',
        type: 'file',
        sizeLabel: '2.9 KB',
        updatedAt: '۱ ساعت پیش',
        language: 'go',
        content: `package payment

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.RouterGroup, svc Service) {
    r.POST("/charge", func(c *gin.Context) {
        idemKey := c.GetHeader("Idempotency-Key")
        if idemKey == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "missing idempotency key"})
            return
        }
        c.JSON(http.StatusOK, gin.H{"status": "authorized", "key": idemKey})
    })
}`,
      },
    ],
  },
  {
    id: 'repo-github-agent',
    owner: 'gase99',
    name: 'github-agent',
    fullName: 'gase99/github-agent',
    descriptionFa: 'اپلیکیشن اندروید و وب دستیار هوشمند کدنویسی و مدیریت گیت‌هاب (مخزن فعلی پروژه)',
    descriptionEn: 'Bilingual Cybernetic Android & Web coding companion powered by Capacitor, React & Gemini.',
    private: false,
    language: 'TypeScript',
    defaultBranch: 'main',
    stars: 89,
    forks: 15,
    openIssuesCount: 0,
    updatedLabelFa: 'هم‌اکنون',
    updatedLabelEn: 'Just now',
    starred: true,
    needsReview: false,
    securityPassed: true,
    isRemoteGithub: true,
    htmlUrl: 'https://github.com/gase99/github-agent',
    latestCommit: {
      sha: '9244959',
      message: 'feat(android): build hybrid Capacitor Android app & live API engine',
      author: 'gase99',
      dateLabel: 'هم‌اکنون',
    },
    architectureSummaryFa: [
      'معماری هیبریدی یکپارچه با React 18 + TypeScript + Tailwind v4 و پوسته نیتیو Capacitor 8 Android.',
      'اتصال مستقیم و امن به Gemini API و GitHub REST API با ذخیره‌سازی محلی کلیدها روی دستگاه.',
      'پشتیبانی کامل آفلاین/دمو به همراه بیلد خودکار APK در GitHub Actions.',
    ],
    architectureSummaryEn: [
      'Unified React 18 + TypeScript + Tailwind v4 architecture wrapped with Capacitor 8 Android.',
      'Direct client-side Gemini & GitHub REST integration with on-device Preferences storage.',
      'Zero-config Demo fallback plus automated APK CI pipeline via GitHub Actions.',
    ],
    files: [
      {
        name: 'capacitor.config.ts',
        path: 'capacitor.config.ts',
        type: 'file',
        sizeLabel: '0.6 KB',
        updatedAt: 'هم‌اکنون',
        language: 'typescript',
        content: `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.gase99.githubagent',
  appName: 'GitHub Agent',
  webDir: 'dist',
  backgroundColor: '#11131c',
};

export default config;`,
      },
    ],
  },
];

export const INITIAL_PULL_REQUEST: PullRequestItem = {
  id: 'pr-47',
  number: 47,
  repoFullName: 'developer_pro/kotlin-ai-agent',
  title: 'feat(gemini): Add Streaming SSE & Token Rate Limiter',
  subtitleFa: 'افزودن استریمینگ رویدادهای سرور (SSE) و سیستم کنترل نرخ توکن مصرفی',
  state: 'open',
  sourceBranch: 'feature/sse-stream',
  targetBranch: 'main',
  commitSha: '9c2a11b',
  author: 'developer_pro',
  authorRoleFa: 'توسعه‌دهنده ارشد اندروید',
  authorRoleEn: 'Senior Android Engineer',
  additions: 142,
  deletions: 38,
  changedFilesCount: 3,
  securityScore: 94,
  architectureGrade: 'A+',
  verdictFa: 'تأیید مشروط',
  verdictEn: 'Conditional Approve',
  findings: [
    {
      icon: 'speed',
      title: 'Performance & Memory',
      descFa:
        'نشت حافظه در چرخه حیات استریم رفع شده است. استفاده از CoroutineScope ساختاریافته کاملاً رعایت گردیده است.',
      descEn:
        'Stream lifecycle leak resolved. Structured concurrency via CoroutineScope is properly enforced.',
    },
    {
      icon: 'security',
      title: 'Security & Secrets Leak',
      descFa:
        'توکن‌های احراز هویت مستقیماً در کد ذخیره نشده و از طریق هدرهای امنیتی EncryptedSharedPreferences تزریق می‌شوند.',
      descEn:
        'Credentials are injected via secure headers from EncryptedSharedPreferences with zero hardcoded secrets.',
    },
    {
      icon: 'tip',
      title: 'Optimization Notice',
      descFa:
        'یک مورد احتمال مسدود شدن ترد در خط ۴۱ فایل GeminiClient.kt شناسایی و پیشنهاد تایم‌اوت ثبت شد.',
      descEn:
        'Potential long-lived socket hang on line 41 of GeminiClient.kt; inline timeout wrapper suggested.',
    },
  ],
  files: [
    {
      filename: 'core/network/GeminiClient.kt',
      language: 'Kotlin 2.0',
      additions: 48,
      deletions: 12,
      lines: [
        {
          oldLine: 38,
          newLine: 38,
          type: 'context',
          content: 'suspend fun streamSSE(prompt: String): Flow<SSEvent> {',
        },
        {
          oldLine: 39,
          newLine: null,
          type: 'del',
          content: '    val response = httpClient.get(GEMINI_ENDPOINT)',
        },
        {
          oldLine: null,
          newLine: 39,
          type: 'add',
          content: '    val response = httpClient.prepareRequest(GEMINI_ENDPOINT) {',
        },
        {
          oldLine: null,
          newLine: 40,
          type: 'add',
          content: '        headers.append("x-goog-api-key", credentials.token)',
        },
        {
          oldLine: null,
          newLine: 41,
          type: 'add',
          content: '    }.execute { httpResponse ->',
          aiComment: {
            titleFa: 'پیشنهاد هوش مصنوعی Gemini · تحلیل درجا',
            titleEn: 'Gemini Inline Suggestion',
            bodyFa:
              'برای جلوگیری از مسدود شدن کوروتین در اتصال‌های ناپایدار موبایل، یک تایم‌اوت صریح با withTimeoutOrNull(15_000L) روی دریافت بدنه استریم قرار دهید.',
            bodyEn:
              'Wrap channel consumption with withTimeoutOrNull(15_000L) to guard against stalled mobile connections.',
            suggestedCode: 'withTimeoutOrNull(15_000L) { httpResponse.bodyAsChannel() }',
            applied: false,
          },
        },
        {
          oldLine: 40,
          newLine: 42,
          type: 'context',
          content: '        channel.consumeAsFlow().collect { chunk ->',
        },
        {
          oldLine: 41,
          newLine: 43,
          type: 'context',
          content: '            emit(parseSseChunk(chunk))',
        },
        {
          oldLine: 42,
          newLine: 44,
          type: 'context',
          content: '        }',
        },
      ],
    },
    {
      filename: 'core/network/RateLimiter.kt',
      language: 'Kotlin 2.0',
      additions: 76,
      deletions: 18,
      lines: [
        {
          oldLine: 10,
          newLine: 10,
          type: 'context',
          content: 'class TokenRateLimiter(private val rpmLimit: Int = 15) {',
        },
        {
          oldLine: 11,
          newLine: null,
          type: 'del',
          content: '    private val window = mutableListOf<Long>()',
        },
        {
          oldLine: null,
          newLine: 11,
          type: 'add',
          content: '    private val mutex = Mutex()',
        },
        {
          oldLine: null,
          newLine: 12,
          type: 'add',
          content: '    private val window = ArrayDeque<Long>()',
        },
        {
          oldLine: 13,
          newLine: 14,
          type: 'context',
          content: '    suspend fun tryAcquire(): Boolean = mutex.withLock {',
        },
      ],
    },
    {
      filename: 'app/build.gradle.kts',
      language: 'Kotlin DSL',
      additions: 18,
      deletions: 8,
      lines: [
        {
          oldLine: 44,
          newLine: 44,
          type: 'context',
          content: 'dependencies {',
        },
        {
          oldLine: 45,
          newLine: null,
          type: 'del',
          content: '    implementation("io.ktor:ktor-client-okhttp:2.3.4")',
        },
        {
          oldLine: null,
          newLine: 45,
          type: 'add',
          content: '    implementation("io.ktor:ktor-client-okhttp:3.0.1")',
        },
        {
          oldLine: null,
          newLine: 46,
          type: 'add',
          content: '    implementation("androidx.security:security-crypto:1.1.0-alpha06")',
        },
      ],
    },
  ],
  checklist: [
    {
      id: 'chk-1',
      labelFa: 'تست‌های واحد با موفقیت پاس شدند (Unit Tests 100%)',
      labelEn: 'All unit tests passed (Unit Tests 100%)',
      checked: true,
    },
    {
      id: 'chk-2',
      labelFa: 'عدم نقض قوانین لینت کاتلین (Detekt & Ktlint clean)',
      labelEn: 'Kotlin static analysis clean (Detekt & Ktlint)',
      checked: true,
    },
    {
      id: 'chk-3',
      labelFa: 'امضای دیجیتال و دسترسی‌های مانیفست اندروید تأیید شد',
      labelEn: 'AndroidManifest permissions & signing verified',
      checked: true,
    },
  ],
  reactions: {
    rocket: 4,
    eyes: 2,
    fire: 5,
  },
  comments: [],
};

export const INITIAL_VULNERABILITIES: VulnerabilityItem[] = [
  {
    id: 'vuln-1',
    codeId: '#SEC-01',
    severity: 'critical',
    category: 'secrets',
    cvssOrCve: 'CVSS 9.2',
    cweTag: 'CWE-798',
    title: 'Hardcoded Google API Key detected in BuildConfig',
    descriptionFa:
      'نشت کلید دسترسی: رشته کلید سرویس هوش مصنوعی به صورت مستقیم در تنظیمات بیلد قرار گرفته و در مخزن عمومی قابل استخراج از APK است.',
    descriptionEn:
      'Hardcoded API credential found in Gradle build configuration, exposing key material inside compiled APK.',
    filePath: 'app/build.gradle.kts:24',
    languageLabel: 'Kotlin DSL',
    codeSnippet: `23 | buildConfigField("String", "GEMINI_KEY",
24 |   "\\"<HARDCODED_CREDENTIAL_EXAMPLE>\\"") // <- Leaked!`,
    fixedSnippet: `23 | val geminiKey = providers.gradleProperty("GEMINI_KEY").getOrElse("")
24 | buildConfigField("String", "GEMINI_KEY", "\\"\\$geminiKey\\"") // ✓ Secured`,
    remediationFa:
      'انتقال فوری کلید به local.properties یا ذخیره امن در زمان اجرا توسط کاربر (Capacitor Preferences / EncryptedSharedPreferences).',
    remediationEn:
      'Move key to local.properties via secrets-gradle-plugin or store user-entered keys securely in device storage.',
    fixed: false,
  },
  {
    id: 'vuln-2',
    codeId: '#SEC-02',
    severity: 'high',
    category: 'dependencies',
    cvssOrCve: 'CVE-2024-38108',
    cweTag: 'DoS Vector',
    title: 'OkHttp v4.9.1 Crafted TLS Handshake Denial of Service',
    descriptionFa:
      'نسخه قدیمی کتابخانه ارتباطی OkHttp حاوی نقص امنیتی در پردازش پاسخ‌های خاص بوده که می‌تواند موجب ANR یا توقف رشته شبکه شود.',
    descriptionEn:
      'Outdated OkHttp client vulnerable to resource exhaustion during malformed handshake processing.',
    filePath: 'gradle/libs.versions.toml:14',
    languageLabel: 'TOML / Gradle',
    codeSnippet: `CURRENT VULNERABLE : com.squareup.okhttp3:okhttp:4.9.1
RECOMMENDED TARGET : com.squareup.okhttp3:okhttp:4.12.0`,
    fixedSnippet: `UPDATED DEPENDENCY : com.squareup.okhttp3:okhttp:4.12.0 ✓`,
    remediationFa: 'ارتقای نسخه OkHttp به 4.12.0 و اجرای مجدد تست‌های یکپارچگی شبکه.',
    remediationEn: 'Bump OkHttp dependency to 4.12.0 and re-run network integration suite.',
    fixed: false,
  },
  {
    id: 'vuln-3',
    codeId: '#SEC-03',
    severity: 'medium',
    category: 'sast',
    cvssOrCve: 'CVSS 5.8',
    cweTag: 'CWE-20',
    title: 'Unsanitized Prompt Delimiters in Repo File Analyzer',
    descriptionFa:
      'محتوای فایل‌های مخزن خارجی پیش از الحاق به پرامپت سیستم تفکیک نشده و امکان Prompt Injection غیرمستقیم وجود دارد.',
    descriptionEn:
      'Untrusted repository file contents are interpolated into system instructions without XML/delimiter isolation.',
    filePath: 'core/ai/GeminiClient.kt:58',
    languageLabel: 'Kotlin Coroutine',
    codeSnippet: `57 | suspend fun analyze(rawFileContent: String) =
58 |   model.generateContent(systemRules + rawFileContent) // Missing boundary`,
    fixedSnippet: `57 | suspend fun analyze(rawFileContent: String) =
58 |   model.generateContent(systemRules, sanitizeUntrustedCode(rawFileContent)) // ✓ Isolated`,
    remediationFa:
      'جداسازی دستورالعمل سیستم (systemInstruction) از محتوای کد کاربر و محدودسازی طول ورودی.',
    remediationEn:
      'Separate systemInstruction field from user content blocks and enforce strict delimiter escaping.',
    fixed: false,
  },
];

export const INITIAL_SNIPPETS: CodeSnippet[] = [
  {
    id: 'snip-1',
    title: 'GitHub Auth Interceptor',
    subtitleFa: 'کد احراز هویت امن توکن گیت‌هاب در OkHttp',
    language: 'kotlin',
    langShort: 'KT',
    category: 'saved',
    tags: ['#Android', '#Security'],
    badgeText: 'Prompt: Gemini Fix',
    code: `class AuthInterceptor(private val tokenProvider: () -> String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val req = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer \${tokenProvider()}")
            .addHeader("X-GitHub-Api-Version", "2022-11-28")
            .build()
        return chain.proceed(req)
    }
}`,
    favorite: true,
  },
  {
    id: 'snip-2',
    title: 'Async Google Gemini Stream',
    subtitleFa: 'دریافت استریم زنده پاسخ‌ها از جمینای در پایتون',
    language: 'python',
    langShort: 'PY',
    category: 'ai',
    tags: ['#Gemini', '#FastAPI'],
    badgeText: 'Latency: 48ms',
    code: `async def stream_gemini_reply(prompt: str):
    client = genai.Client()
    response = await client.aio.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt
    )
    async for chunk in response:
        if chunk.text:
            yield chunk.text`,
    favorite: false,
  },
  {
    id: 'snip-3',
    title: 'Git Hook Pre-commit Linter',
    subtitleFa: 'بررسی خودکار استایل کد پیش از ثبت کامیت',
    language: 'bash',
    langShort: 'SH',
    category: 'utilities',
    tags: ['#GitHooks', '#Ktlint'],
    badgeText: 'Verified Hook',
    code: `#!/usr/bin/env bash
echo "[!] Running ktlint pre-commit checks..."
./gradlew ktlintCheck --daemon
if [ $? -ne 0 ]; then
    echo "[ERROR] Lint errors found. Aborting commit."
    exit 1
fi`,
    favorite: false,
  },
  {
    id: 'snip-4',
    title: 'Room Token Usage DAO Query',
    subtitleFa: 'کوئری تجمیع مصرف توکن روزانه در دیتابیس محلی',
    language: 'sql',
    langShort: 'SQL',
    category: 'utilities',
    tags: ['#RoomDB', '#Analytics'],
    badgeText: 'Indexed Query',
    code: `SELECT model_name,
       SUM(prompt_tokens + completion_tokens) AS total_tokens,
       ROUND(SUM(cost_usd), 4) AS total_cost
FROM ai_telemetry_logs
WHERE created_at >= strftime('%s', 'now', '-7 days')
GROUP BY model_name
ORDER BY total_tokens DESC;`,
    favorite: true,
  },
];

export const INITIAL_TOKEN_EVENTS: TokenEventLog[] = [
  {
    id: 'evt-1',
    title: 'PR #47 Diff Analysis',
    modelBadge: 'Gemini 2.5 Pro',
    timeAgo: '4m ago',
    latencyLabel: '142ms',
    tokens: 42850,
    costUsd: 0.128,
    accent: 'cyan',
  },
  {
    id: 'evt-2',
    title: 'Full Repo Security Audit',
    modelBadge: 'Sentinel',
    timeAgo: '2h ago',
    latencyLabel: '1.8s',
    tokens: 89120,
    costUsd: 0.267,
    accent: 'error',
  },
  {
    id: 'evt-3',
    title: 'Kotlin Unit Test Generation',
    modelBadge: 'Flash',
    timeAgo: '4h ago',
    latencyLabel: '310ms',
    tokens: 12400,
    costUsd: 0.018,
    accent: 'purple',
  },
];

export const INITIAL_CACHE_ARTIFACTS: CacheArtifact[] = [
  {
    id: 'art-kt',
    code: 'KT',
    titleFa: 'سورس کاتلین و تایپ‌اسکریپت پروژه',
    titleEn: 'Project Source Tree (Kotlin & TS)',
    metaFiles: '68 files',
    tokensK: 780,
    statusFa: 'آپدیت ۲ ساعت پیش',
    statusEn: 'Updated 2h ago',
    previewContent: `// Cached AST & Symbol Index (780,000 tokens)
- core/ai/GeminiClient.kt (SSE Stream + Retry Policy)
- core/network/RateLimiter.kt (Mutex Sliding Window)
- ui/screens/* (12 Cybernetic Material3 Views)`,
  },
  {
    id: 'art-doc',
    code: 'DOC',
    titleFa: 'اسناد و معماری Clean Code Spec',
    titleEn: 'Architecture & DESIGN.md Guidelines',
    metaFiles: 'README + DESIGN.md',
    tokensK: 210,
    statusFa: 'پایدار',
    statusEn: 'Pinned',
    previewContent: `# Cybernetic Developer Assistant Spec
- Surface: #11131c | Cyber Cyan: #00f5d4 | Electric Purple: #6d11ad
- Bilingual Persian (RTL) + English (LTR) with strict LTR code panes`,
  },
  {
    id: 'art-sec',
    code: 'SEC',
    titleFa: 'قوانین امنیتی و ممیزی سیستم',
    titleEn: 'OWASP Mobile & Detekt Security Rules',
    metaFiles: 'OWASP Top 10',
    tokensK: 185,
    statusFa: 'نسخه ۲.۴',
    statusEn: 'v2.4 Active',
    previewContent: `[Sentinel Ruleset v2.4]
- CWE-798: Block hardcoded API keys in BuildConfig & static HTML
- CWE-20: Isolate untrusted repo files from system prompts
- Enforce TLS 1.3 & modern OkHttp >= 4.12.0`,
  },
  {
    id: 'art-git',
    code: 'GIT',
    titleFa: 'تغییرات و PRهای اخیر (#40-#47)',
    titleEn: 'Recent Git Diffs & PR Context (#40-#47)',
    metaFiles: '8 recent commits',
    tokensK: 73.5,
    statusFa: 'همگام با HEAD',
    statusEn: 'Synced with HEAD',
    previewContent: `commit 9c2a11b (HEAD -> feature/sse-stream)
Author: developer_pro
+ Added SSE token stream parser
+ Added sliding-window RPM rate limiter`,
  },
];
