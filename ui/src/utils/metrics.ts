export type Zone = 'pain' | 'useless' | 'ok' | null;

export type ZoneInfo = {
  label: string;
  cls: string;
  desc: string;
};

const zones: Record<string, ZoneInfo> = {
  pain: { label: 'Zone of Pain', cls: 'zone-pain', desc: 'Concrete + stable. Hard to change, everything depends on it.' },
  useless: { label: 'Zone of Uselessness', cls: 'zone-useless', desc: 'Abstract + unstable. Abstractions nobody uses.' },
  ok: { label: 'Main Sequence', cls: 'zone-ok', desc: 'Good balance between stability and abstractness.' },
};

export const getZone = (m: { instability: number; abstractness: number; distance: number }): Zone => {
  if (m.abstractness < 0.2 && m.instability < 0.2) return 'pain';
  if (m.abstractness > 0.8 && m.instability > 0.8) return 'useless';
  if (m.distance < 0.2) return 'ok';
  return null;
};

export const getZoneInfo = (m: { instability: number; abstractness: number; distance: number }): ZoneInfo | null => {
  const zone = getZone(m);
  return zone ? zones[zone] : null;
};

export const zoneFill: Record<string, string> = {
  pain: 'rgba(239, 68, 68, 0.14)',
  useless: 'rgba(168, 85, 247, 0.12)',
  ok: 'rgba(34, 197, 94, 0.08)',
};

export const zoneBar: Record<string, string> = {
  pain: '#ef4444',
  useless: '#a855f7',
  ok: '#22c55e',
};
