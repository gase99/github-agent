import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('App react-router-dom module routing & live Gemini key activation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders SecurityAuditScreen when navigated to /security', async () => {
    render(
      <MemoryRouter
        initialEntries={['/security']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText(/#SEC-01/i)).toBeTruthy();
    expect(screen.getAllByText(/92%/i).length).toBeGreaterThan(0);
  });

  it('activates and verifies a Gemini API Key live inside SettingsScreen', async () => {
    vi.spyOn(globalThis, 'fetch')
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
            usageMetadata: { totalTokenCount: 6 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    render(
      <MemoryRouter
        initialEntries={['/settings']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/io\.github\.gase99\.githubagent/i)).toBeTruthy();

    const input = screen.getByPlaceholderText(/Enter Google Gemini API Key/i);
    fireEvent.change(input, { target: { value: 'mock-live-key-value' } });

    const activateBtn = screen.getByRole('button', {
      name: /ذخیره، فعال‌سازی و اتصال زنده به Gemini|Save, Verify & Activate Live Gemini API/i,
    });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(screen.getByText(/VERIFIED •/i)).toBeTruthy();
      expect(screen.getByText(/Gemini LIVE/i)).toBeTruthy();
    });
  });
});
