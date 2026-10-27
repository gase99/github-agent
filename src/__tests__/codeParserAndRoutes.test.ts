import { describe, expect, it } from 'vitest';
import { parseMessageSegments } from '../components/CodeBlockCard';
import { detectTextDirection } from '../utils/direction';
import { pathToScreen, SCREEN_TO_PATH } from '../utils/routes';

describe('parseMessageSegments', () => {
  it('splits bilingual prose and fenced code blocks with filenames', () => {
    const sample = [
      'نمونه کد اتصال امن:',
      '```kotlin:AuthInterceptor.kt',
      'class AuthInterceptor {}',
      '```',
      'توضیحات تکمیلی در انتها.',
    ].join('\n');

    const segments = parseMessageSegments(sample);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', text: 'نمونه کد اتصال امن:' });
    expect(segments[1]).toEqual({
      type: 'code',
      block: {
        language: 'kotlin',
        filename: 'AuthInterceptor.kt',
        code: 'class AuthInterceptor {}',
      },
    });
    expect(segments[2]).toEqual({ type: 'text', text: 'توضیحات تکمیلی در انتها.' });
  });

  it('defaults language to kotlin when fence omits language', () => {
    const segments = parseMessageSegments('```\nval x = 1\n```');
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      type: 'code',
      block: { language: 'kotlin', filename: undefined, code: 'val x = 1' },
    });
  });
});

describe('detectTextDirection', () => {
  it('detects Persian script as rtl even with leading whitespace or numbers', () => {
    expect(detectTextDirection('   ۱۲۳ بررسی مخزن گیت‌هاب')).toBe('rtl');
    expect(detectTextDirection('سلام دنیا')).toBe('rtl');
  });

  it('detects Latin/code input as ltr', () => {
    expect(detectTextDirection('suspend fun fetchRepos()')).toBe('ltr');
    expect(detectTextDirection('  @GET("users/{user}/repos")')).toBe('ltr');
  });

  it('returns fallback direction when input has no strong characters', () => {
    expect(detectTextDirection('12345 !@#', 'rtl')).toBe('rtl');
    expect(detectTextDirection('12345 !@#', 'ltr')).toBe('ltr');
  });
});

describe('route mapping', () => {
  it('maps all 9 AppScreens round-trip accurately', () => {
    const screens = Object.keys(SCREEN_TO_PATH) as Array<keyof typeof SCREEN_TO_PATH>;
    expect(screens).toHaveLength(9);
    for (const screen of screens) {
      const path = SCREEN_TO_PATH[screen];
      expect(pathToScreen(path)).toBe(screen);
    }
  });

  it('normalizes trailing slashes and unknown paths safely to chat', () => {
    expect(pathToScreen('/security/')).toBe('security');
    expect(pathToScreen('/unknown-route')).toBe('chat');
  });
});
