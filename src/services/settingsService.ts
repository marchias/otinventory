export interface GlobalSettings {
  client: string;
  site: string;
}

const SETTINGS_KEY = 'otAssetGlobalSettings';

export function getGlobalSettings(): GlobalSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GlobalSettings;
    if (!parsed.client || !parsed.site) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGlobalSettings(settings: GlobalSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
