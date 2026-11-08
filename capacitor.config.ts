import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'studio.yuki.cine',
  appName: 'YUKI CINE STUDIO',
  webDir: 'www',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
};

export default config;
