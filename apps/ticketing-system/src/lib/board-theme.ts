export const BOARD_THEME_PRESETS = [
  {
    id: "graphite",
    label: "Graphite",
    description: "Charcoal brushed metal",
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Northern lights sky",
  },
  {
    id: "mist",
    label: "Mist",
    description: "Foggy blue haze",
  },
  {
    id: "ember",
    label: "Ember",
    description: "Warm glowing embers",
  },
  {
    id: "tide",
    label: "Tide",
    description: "Coastal ocean water",
  },
  {
    id: "lattice",
    label: "Lattice",
    description: "Architectural lattice",
  },
  {
    id: "circuit",
    label: "Circuit",
    description: "PCB circuit board",
  },
  {
    id: "origami",
    label: "Origami",
    description: "Folded paper forms",
  },
  {
    id: "dune",
    label: "Dune",
    description: "Desert sand dunes",
  },
  {
    id: "prism",
    label: "Prism",
    description: "Spectral light refraction",
  },
  {
    id: "harbor",
    label: "Harbor",
    description: "Boats at the quay",
  },
  {
    id: "horizon",
    label: "Horizon",
    description: "Distant dusk skyline",
  },
] as const;

export type BoardThemePresetId = (typeof BOARD_THEME_PRESETS)[number]["id"];

export const DEFAULT_THEME_PRESET: BoardThemePresetId = "graphite";

export function normalizeThemePreset(
  value: string | null | undefined,
): BoardThemePresetId {
  const match = BOARD_THEME_PRESETS.find((preset) => preset.id === value);
  return match?.id ?? DEFAULT_THEME_PRESET;
}

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

export function normalizeAccentColor(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_COLOR.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/** Derive readable foreground for a solid hex accent. */
export function accentForeground(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0f172a" : "#f8fafc";
}
