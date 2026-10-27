# دستیار من | GitHub Agent (v2.4.0 — Hybrid Android & Web)

اپلیکیشن هیبریدی اندروید و وب **GitHub Agent** بر پایه سیستم طراحی **Cybernetic Developer Assistant (`DESIGN.md`)** و یکپارچه‌سازی ۱۲ صفحه پروتوتایپ اولیه مخزن ساخته شده است. این پروژه هم به‌صورت **اپلیکیشن بومی اندروید (`.apk`)** با **Capacitor 8** و هم به‌عنوان **وب‌اپلیکیشن تعاملی (PWA / GitHub Pages)** اجرا می‌شود.

---

## پشته فناوری (Tech Stack)

- **Frontend:** React 18 + TypeScript (Strict Mode) + Vite 8 + Tailwind CSS v4 + `lucide-react`
- **Routing & State:** `react-router-dom` (`HashRouter`) + React Context با ماندگاری محلی
- **Self-Hosted Typography:** فونت‌های `Vazirmatn` (فارسی RTL)، `JetBrains Mono` و `Space Grotesk` به‌صورت کاملاً آفلاین و باندل‌شده بدون وابستگی به CDN خارجی
- **Android Platform:** Capacitor 8 (`io.github.gase99.githubagent`، `versionName: 2.4.0`، `versionCode: 20400`، `minSdk 24`، `targetSdk 36`، `compileSdk 36`، `JDK 21`، `Gradle 8.14`)
- **Native Plugins:** `@capacitor/preferences`، `@capacitor/app`، `@capacitor/status-bar`، `@capacitor/haptics`، `@capacitor/clipboard`، `@capacitor/share`
- **AI & GitHub APIs:** Google Gemini Official `generateContent` / `streamGenerateContent?alt=sse` + GitHub REST API v3 (`2022-11-28`)
- **Testing:** `vitest` + `@testing-library/react` (`jsdom`)

---

## ۹ ماژول عملیاتی برنامه

1. **`ChatScreen` (`/`)**: چت دوزبانه با استریم زنده SSE از **Google Gemini API**، تشخیص خودکار جهت متن (RTL/LTR) و کارت‌های کد LTR با قابلیت کپی، اشتراک‌گذاری و ذخیره اسنیپت.
2. **`RepositoriesScreen` (`/repos`)**: همگام‌سازی زنده مخازن از **GitHub REST API**، افزودن مخزن جدید (`owner/repo`)، جستجو، فیلتر و تحلیل سریع معماری با هوش مصنوعی.
3. **`RepoDetailsScreen` (`/repo-details`)**: پیمایش درختی پوشه‌ها و فایل‌های مخزن، نمایش کد شماره‌گذاری‌شده، تاریخچه کامیت‌ها، توضیح کد با AI، اسکن امنیتی فایل و تولید Unit Test.
4. **`PrReviewScreen` (`/pr-review`)**: نمایشگر تعاملی Diff (`+` / `-`)، اعمال پیشنهاد اصلاح کد توسط هوش مصنوعی (**Apply Patch**) و ثبت نظر روی PR در گیت‌هاب.
5. **`SecurityAuditScreen` (`/security`)**: ممیزی امنیتی SAST، اسکن نشت کلید (`Secrets`) و آسیب‌پذیری‌های وابستگی (`CVE`)، اصلاح خودکار (**Auto-Fix**) و خروجی استاندارد `SARIF JSON`.
6. **`SnippetsScreen` (`/snippets`)**: ذخیره ماندگار، جستجو و فیلتر تکه‌کدها بر اساس زبان و بهینه‌سازی کد با Gemini.
7. **`TokenAnalyticsScreen` (`/analytics`)**: نمودار هفتگی مصرف توکن‌های ورودی/خروجی، بودجه مصرفی و استعلام زنده **GitHub Rate Limit**.
8. **`ContextCacheScreen` (`/cache-details`)**: مدیریت TTL کش کانتکست (`+1h` / `+24h`)، پاک‌سازی کش و شبیه‌ساز تعاملی هزینه ماهانه.
9. **`SettingsScreen` (`/settings`)**: ثبت امن کلیدهای **Gemini API** و **GitHub PAT** در `@capacitor/preferences` همراه با دکمه تست اتصال زنده، تنظیم سقف بودجه، TTL و گیرنده‌های هشدار (**Telegram / SMS / Discord Webhook**).

> **حالت دوگانه (Dual Mode):** بدون ثبت کلید API، برنامه در **Demo Mode** با داده‌های نمونه کار می‌کند؛ با وارد کردن کلید در بخش **Settings**، اتصال زنده به سرورهای واقعی برقرار می‌شود. هیچ کلیدی در سورس‌کد ذخیره نشده است.

---

## ساخت و دریافت فایل نصبی اندروید (`.apk`)

### ۱. ساخت خودکار در GitHub Actions
گردش‌کار [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) پس از اجرای تست‌های واحد، فایل APK را با **JDK 21 + Android SDK 36 + Gradle 8.14** کامپایل و در بخش **Artifacts (`github-agent-android-apk`)** منتشر می‌کند:
- `github-agent-v2.4.0-debug.apk`
- `github-agent-v2.4.0-release-signed.apk` (در صورت تنظیم سکرت‌های امضا در GitHub Secrets: `KEYSTORE_BASE64`، `KEYSTORE_PASSWORD`، `KEY_ALIAS` و `KEY_PASSWORD`)

### ۲. ساخت محلی
```bash
npm install
npm test
npm run android:sync
cd android && ./gradlew assembleDebug
```

---

## دستورات توسعه و تست

```bash
# اجرای سرور توسعه وب
npm run dev

# اجرای تست‌های واحد با Vitest
npm test

# بررسی سخت‌گیرانه تایپ‌اسکریپت
npm run typecheck

# بیلد نسخه وب (GitHub Pages با base=/github-agent/)
npm run build
```

---

## آرشیو طرح‌های اولیه
تمامی ۱۲ فایل پروتوتایپ HTML اولیه به همراه سند سیستم طراحی `DESIGN.md` بدون هیچ‌گونه حذفی در مسیر [`stitch_myassistant_ai_coding_companion/`](stitch_myassistant_ai_coding_companion/) حفظ و آرشیو شده‌اند.
