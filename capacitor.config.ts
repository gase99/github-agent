import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.gase99.githubagent',
  appName: 'GitHub Agent',
  webDir: 'dist',
  backgroundColor: '#11131c',
  android: {
    backgroundColor: '#11131c',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#11131c',
      overlaysWebView: false,
    },
  },
};

export default config;
