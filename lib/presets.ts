export interface PresetConfig {
  model: string;
  detailLevel: string;
  style: string;
}

export interface Preset {
  id: string;
  name: string;
  config: PresetConfig;
  scope: 'session' | 'device' | 'account';
}

const PRESETS_KEY = 'menuMagic.presets';

export const getLocalPresets = (): Preset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse presets from localStorage', e);
    return [];
  }
};

export const saveLocalPreset = (preset: Preset): void => {
  if (typeof window === 'undefined') return;
  try {
    const presets = getLocalPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save preset to localStorage', e);
  }
};

export const getActivePreset = (): Preset | null => {
  const presets = getLocalPresets();
  // Return the most recently saved device preset for simplicity, or a specific one if needed.
  return presets.length > 0 ? presets[presets.length - 1] : null;
};
