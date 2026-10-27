import type { AppScreen } from '../types/app';

export const SCREEN_TO_PATH: Record<AppScreen, string> = {
  chat: '/',
  repos: '/repos',
  'repo-details': '/repo-details',
  'pr-review': '/pr-review',
  security: '/security',
  snippets: '/snippets',
  analytics: '/analytics',
  'cache-details': '/cache-details',
  settings: '/settings',
};

const PATH_TO_SCREEN: Record<string, AppScreen> = {
  '/': 'chat',
  '/chat': 'chat',
  '/repos': 'repos',
  '/repo-details': 'repo-details',
  '/pr-review': 'pr-review',
  '/security': 'security',
  '/snippets': 'snippets',
  '/analytics': 'analytics',
  '/cache-details': 'cache-details',
  '/settings': 'settings',
};

export function pathToScreen(pathname: string): AppScreen {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_SCREEN[normalized] ?? 'chat';
}
