import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, INITIAL_PULL_REQUEST } from '../data/demoData';
import {
  createLiveGeminiContextCache,
  generateAssistantReply,
  pingGeminiApi,
  runLiveGeminiPrAudit,
  sanitizeGeminiKey,
} from '../services/geminiApi';
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

  it('sanitizes pasted Gemini keys by stripping Bearer prefix, quotes, and spaces', () => {
    expect(sanitizeGeminiKey('  "Bearer mock-test-key-123" \n')).toBe('mock-test-key-123');
    expect(sanitizeGeminiKey('')).toBe('');
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

  it('verifies key via real model discovery + generateContent handshake with x-goog-api-key', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-2.5-flash',
                displayName: 'Gemini 2.5 Flash',
                inputTokenLimit: 1048576,
                supportedGenerationMethods: ['generateContent'],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'OK' }] } }],
            usageMetadata: { totalTokenCount: 8 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const res = await pingGeminiApi('mock-runtime-key', 'gemini-2.5-flash');
    expect(res.ok).toBe(true);
    expect(res.resolvedModel).toBe('gemini-2.5-flash');
    expect(res.sampleReply).toBe('OK');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const headers = fetchSpy.mock.calls[1][1]?.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('mock-runtime-key');
  });

  it('calls official Google Gemini generateContent endpoint and falls back on 404 model', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: 'Model retired' } }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
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
        geminiModel: 'gemini-1.5-flash-retired',
        geminiApiKey: 'test-runtime-user-key',
        tokenStreaming: false,
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[1][0])).toContain(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(reply.isLiveApi).toBe(true);
    expect(reply.modelUsed).toBe('gemini-2.5-flash');
    expect(reply.text).toBe('Live Gemini verified response');
    expect(reply.tokensUsed).toBe(215);
  });

  it('executes live structured PR audit and graceful context cache pinning', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        securityScore: 98,
                        architectureGrade: 'A+',
                        verdictFa: 'آماده ادغام',
                        verdictEn: 'Ready to Merge',
                        findings: [
                          {
                            icon: 'security',
                            title: 'Zero Secret Leaks',
                            descFa: 'بدون نشت کلید',
                            descEn: 'Clean diff',
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 310 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { message: 'Cached content is too small. Minimum token count is 32768.' },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const audit = await runLiveGeminiPrAudit({
      pr: INITIAL_PULL_REQUEST,
      settings: { ...DEFAULT_SETTINGS, geminiApiKey: 'test-runtime-user-key' },
    });
    expect(audit.securityScore).toBe(98);
    expect(audit.architectureGrade).toBe('A+');

    const cacheRes = await createLiveGeminiContextCache({
      apiKey: 'test-runtime-user-key',
      model: 'gemini-2.5-flash',
      displayName: 'repo-test',
      contextText: 'small repo context',
      ttlPreset: '6h',
    });
    expect(cacheRes.ok).toBe(true);
    expect(cacheRes.mode).toBe('context_pinned');
  });
});
