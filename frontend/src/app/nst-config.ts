export interface NstConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  apiUrl: string;
  frontendSha?: string;
  serverSha?: string;
}

declare global {
  interface Window {
    __NST_CONFIG__?: NstConfig;
  }
}

let configCache: NstConfig | null = null;

export function getNstConfig(): Promise<NstConfig> {
  if (configCache) {
    return Promise.resolve(configCache);
  }

  if (window.__NST_CONFIG__) {
    configCache = {
      ...window.__NST_CONFIG__,
      apiUrl: window.__NST_CONFIG__.apiUrl || window.location.origin,
    };
    return Promise.resolve(configCache);
  }

  return fetch('/config')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch config: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((config: NstConfig) => {
      configCache = config;
      return config;
    });
}

let serverShaCache: string | null = null;

export function getServerSha(): Promise<string> {
  if (serverShaCache) {
    return Promise.resolve(serverShaCache);
  }
  if (configCache?.serverSha) {
    serverShaCache = configCache.serverSha;
    return Promise.resolve(serverShaCache);
  }
  return fetch('/health')
    .then((res) => res.json())
    .then((data) => {
      serverShaCache = data.buildSha || '';
      return serverShaCache!;
    })
    .catch(() => '');
}
