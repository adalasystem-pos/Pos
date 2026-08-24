export type NetworkConnectionStatus = 'online' | 'offline' | 'reconnecting';

export interface NetworkState {
  status: NetworkConnectionStatus;
  isOnline: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  lastOnlineAt: Date | null;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isPromptDismissed: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
}

export interface PWAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  dismissUpdate: () => void;
}
