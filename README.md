# دستیار من | GitHub Agent (Android & Web Hybrid App)

اپلیکیشن هوشمند اندروید و وب **GitHub Agent** بر پایه سیستم طراحی **Cybernetic Developer Assistant (`DESIGN.md`)** و یکپارچه‌سازی کامل ۱۲ صفحه پروتوتایپ مخزن ساخته شده است. این پروژه با استفاده از **React 19 + TypeScript + Tailwind CSS v4 + Capacitor 8 Android** هم به‌صورت **فایل نصبی اندروید (`.apk`)** و هم به‌عنوان **وب‌اپلیکیشن تعاملی (PWA / GitHub Pages)** اجرا می‌شود.

---

## قابلیت‌ها و ماژول‌های برنامه (۹ ماژول یکپارچه)

1. **دستیار هوشمند کدنویسی (`ChatScreen`)**: چت دوزبانه (فارسی RTL / انگلیسی LTR) با اتصال واقعی به **Google Gemini REST & SSE Streaming**، بلوک‌های کد LTR با قابلیت کپی، اشتراک‌گذاری بومی و ذخیره مستقیم در کتابخانه تکه‌کدها.
2. **مدیریت مخازن گیت‌هاب (`RepositoriesScreen`)**: همگام‌سازی زنده مخازن واقعی از **GitHub REST API** (با نام کاربری یا PAT)، افزودن مخزن جدید (`owner/repo`)، جستجو، فیلتر و تحلیل سریع معماری با هوش مصنوعی.
3. **مرورگر کد و جزئیات مخزن (`RepoDetailsScreen`)**: پیمایش درختی پوشه‌ها و فایل‌های مخزن گیت‌هاب، نمایش کد با شماره‌گذاری خطوط، تاریخچه کامیت‌ها و ابزارهای هوشمند توضیح کد، اسکن امنیتی فایل و تولید تست واحد (Unit Test).
4. **بازبینی Pull Request و Diff Viewer (`PrReviewScreen`)**: نمایش تفاوت خطوط کد (`+` / `-`)، پیشنهاد اصلاح درجای کد توسط Gemini با دکمه **Apply Patch**، چک‌لیست CI/CD و انتشار نظر روی GitHub PR.
5. **ممیزی امنیتی SAST و آسیب‌پذیری‌ها (`SecurityAuditScreen`)**: سنجش امتیاز سلامت امنیتی، دسته‌بندی یافته‌های `Secrets`، `Dependencies (CVE)` و `SAST`، اصلاح خودکار آسیب‌پذیری‌ها (**Auto-Fix with AI**) و خروجی استاندارد `SARIF JSON`.
6. **کتابخانه تکه‌کدها (`SnippetsScreen`)**: ذخیره ماندگار تکه‌کدها روی حافظه دستگاه، دسته‌بندی بر اساس زبان (`Kotlin`, `Python`, `JS/TS`, `Bash`, `SQL`)، بهینه‌سازی کد با Gemini و اشتراک‌گذاری بومی اندروید.
7. **تحلیل مصرف توکن و سهمیه (`TokenAnalyticsScreen`)**: نمودار هفتگی توکن‌های ورودی/خروجی، گیج مصرف بودجه دلاری، و استعلام زنده سهمیه **GitHub Rate Limit**.
8. **کش هوشمند کانتکست (`ContextCacheScreen`)**: مدیریت حافظه کش زمینه پروژه، تمدید طول عمر (`+1h` / `+24h`)، پیش‌نمایش بسته‌های کش‌شده و شبیه‌ساز تعاملی کاهش هزینه ماهانه.
9. **تنظیمات API، بودجه و هشدارهای چندکاناله (`SettingsScreen`)**: ثبت امن کلیدهای **Google Gemini API** و **GitHub PAT** در حافظه محلی دستگاه (`@capacitor/preferences`)، تست زنده اتصال (Ping)، تعیین سقف بودجه، TTL کش و مدیریت گیرنده‌های هشدار **تلگرام، پیامک اضطراری و وب‌هوک Discord/Slack**.

> **حالت دوگانه (Real API + Smart Demo Mode):** بدون وارد کردن کلید API، تمام بخش‌های برنامه با داده‌های نمایشی واقع‌گرایانه کار می‌کنند؛ به محض ثبت کلید Gemini یا توکن GitHub در بخش **تنظیمات**، برنامه مستقیماً به سرورهای واقعی متصل می‌شود و هیچ کلیدی در سورس‌کد ذخیره نمی‌شود.

---

## دریافت و ساخت فایل نصبی اندروید (`.apk`)

### روش اول: ساخت خودکار با GitHub Actions (پیشنهادی)
فایل گردش‌کار [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) با هر Push یا اجرای دستی (`Run workflow` در تب **Actions** گیت‌هاب)، به‌صورت خودکار با **Node 22 + JDK 21 + Android SDK 36 + Gradle 8.14** هر دو نسخه زیر را کامپایل و در بخش **Artifacts** (`github-agent-android-apk`) منتشر می‌کند:
- `github-agent-v2.4.0-debug.apk` (نسخه دیباگ آماده نصب)
- `github-agent-v2.4.0-release-signed.apk` (نسخه Release امضاشده و آماده نصب مستقیم روی گوشی اندروید)

### روش دوم: ساخت محلی با Android Studio / Gradle
پیش‌نیازها: **Node.js 22+**، **JDK 21** و **Android SDK (API 36)**.

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. بیلد نسخه وب و همگام‌سازی پروژه بومی اندروید
npm run android:sync

# ۳. کامپایل فایل APK با Gradle
cd android
./gradlew assembleDebug
# مسیر خروجی: android/app/build/outputs/apk/debug/app-debug.apk
```

برای باز کردن مستقیم پروژه در **Android Studio**:
```bash
npx cap open android
```

---

## اجرای نسخه وب در محیط توسعه

```bash
npm install
npm run dev
```

---

## ساختار پروژه

- `src/` — کدهای اپلیکیشن React + TypeScript + Tailwind v4 و بریج بومی Capacitor
  - `src/screens/` — ۹ صفحه کامل و تعاملی اپلیکیشن
  - `src/services/` — کلاینت‌های زنده `geminiApi.ts`، `githubApi.ts` و پل بومی اندروید `nativeBridge.ts`
  - `src/context/AppContext.tsx` — مدیریت وضعیت سراسری، ذخیره‌سازی ماندگار، تاریخچه صفحات و دکمه Back سخت‌افزاری اندروید
- `android/` — پروژه بومی اندروید (Gradle + Capacitor 8، شناسه بسته `io.github.gase99.githubagent`)
- `.github/workflows/android-apk.yml` — خط لوله CI برای کامپایل و انتشار خودکار `.apk`
- `stitch_myassistant_ai_coding_companion/` — آرشیو ۱۲ طرح اولیه رابط کاربری و سند سیستم طراحی `DESIGN.md`
