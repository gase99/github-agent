import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../data/demoData';
import { generateAssistantReply, pingGeminiApi } from '../services/geminiApi';
import { decodeBase64Utf8, parseUnifiedPatch } from '../services/githubApi';
import { storageGet, storageSet } from '../services/nativeBridge';

describe('githubApi helpers', () => {
  it('decodes base64 UTF-8 Persian & code content accurately', () => {
    const original = 'دستیار هوشمند GitHub Agent ✓';
    const encoded = Buffer.from(original, 'utf-8').toString('base64');
    expect(decodeBase64Utf8(encoded)).toBe(original);
  });

  it('parses unified git diff hunks with accurate line numbers', () => {
    const patch = [
      '@@ -10,3 +10,4 @@',
      ' class Demo {',
      '-  val oldVal = 1',
      '+  val newVal = 2',
      '+  val safe = true',
      ' }',
    ].join('\n');

    const lines = parseUnifiedPatch(patch);
    expect(lines).toHaveLength(5);
    expect(lines[0]).toEqual({ oldLine: 10, newLine: 10, type: 'context', content: 'class Demo {' });
    expect(lines[1]).toEqual({ oldLine: 11, newLine: null, type: 'del', content: '  val oldVal = 1' });
    expect(lines[2]).toEqual({ oldLine: null, newLine: 11, type: 'add', content: '  val newVal = 2' });
    expect(lines[3]).toEqual({ oldLine: null, newLine: 12, type: 'add', content: '  val safe = true' });
    expect(lines[4]).toEqual({ oldLine: 12, newLine: 13, type: 'context', content: '}' });
  });
});

describe('nativeBridge storage fallback', () => {
  it('persists and retrieves typed objects via localStorage in web mode', async () => {
    window.localStorage.clear();
    await storageSet('test_prefs_key', { monthlyBudgetCap: 50, language: 'en' });
    const loaded = await storageGet('test_prefs_key', { monthlyBudgetCap: 10, language: 'fa' });
    expect(loaded).toEqual({ monthlyBudgetCap: 50, language: 'en' });
  });
});

describe('geminiApi Dual Mode (Demo + Live)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('operates in Demo Mode when no Gemini API key is configured', async () => {
    const ping = await pingGeminiApi('', 'gemini-2.5-flash');
    expect(ping.ok).toBe(false);
    expect(ping.error).toBe('DEMO_MODE_NO_KEY');

    const chunks: string[] = [];
    const reply = await generateAssistantReply({
      prompt: 'بررسی باگ شبکه در کاتلین',
      history: [],
      settings: { ...DEFAULT_SETTINGS, geminiApiKey: '', tokenStreaming: true },
      repoContext: 'gase99/github-agent',
      onStreamChunk: (c) => chunks.push(c),
    });

    expect(reply.isLiveApi).toBe(false);
    expect(reply.text).toContain('SafeNetworkCall.kt');
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('calls official Google Gemini generateContent endpoint when API key is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Live Gemini verified response' }] } }],
          usageMetadata: { totalTokenCount: 215 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const reply = await generateAssistantReply({
      prompt: 'Explain architecture',
      history: [],
      settings: {
        ...DEFAULT_SETTINGS,
        geminiApiKey: 'test-runtime-user-key',
        tokenStreaming: false,
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(reply.isLiveApi).toBe(true);
    expect(reply.text).toBe('Live Gemini verified response');
    expect(reply.tokensUsed).toBe(215);
  });
});
