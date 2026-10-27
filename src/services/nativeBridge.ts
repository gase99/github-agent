import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getPlatformLabel(): string {
  try {
    const p = Capacitor.getPlatform();
    if (p === 'android') return 'Android Native';
    if (p === 'ios') return 'iOS Native';
    return 'Web / PWA';
  } catch {
    return 'Web / PWA';
  }
}

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  try {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return JSON.parse(value) as T;
      }
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore storage read errors and use fallback
  }
  return fallback;
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    if (isNativePlatform()) {
      await Preferences.set({ key, value: serialized });
      return;
    }
    window.localStorage.setItem(key, serialized);
  } catch {
    // Ignore quota errors
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      await Clipboard.write({ string: text });
      await hapticTap();
      return true;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export async function shareText(title: string, text: string, url?: string): Promise<boolean> {
  try {
    if (isNativePlatform()) {
      await Share.share({ title, text, url, dialogTitle: title });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    return await copyText(`${title}\n\n${text}${url ? `\n${url}` : ''}`);
  } catch {
    return false;
  }
}

export async function hapticTap(): Promise<void> {
  try {
    if (isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    // No-op on unsupported devices
  }
}

export async function initNativeAndroid(onBackPress: () => boolean): Promise<() => void> {
  let removeListener: (() => void) | null = null;
  try {
    if (isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: '#11131c' }).catch(() => {});

      const handle = await CapApp.addListener('backButton', ({ canGoBack }) => {
        const handled = onBackPress();
        if (!handled && !canGoBack) {
          CapApp.exitApp();
        }
      });
      removeListener = () => {
        handle.remove();
      };
    }
  } catch {
    // Safe fallback on web
  }
  return () => {
    if (removeListener) removeListener();
  };
}
