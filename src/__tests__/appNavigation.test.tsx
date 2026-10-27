import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('App react-router-dom module routing', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
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

  it('renders SettingsScreen when navigated to /settings', async () => {
    render(
      <MemoryRouter
        initialEntries={['/settings']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText(/io\.github\.gase99\.githubagent/i)).toBeTruthy();
  });
});
