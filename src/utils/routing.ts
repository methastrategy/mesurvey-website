export type MesurvRoute = {
  tab: 'knowledge' | 'calculator' | 'map';
  subTab?: 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area';
  topicId?: string;
};

export function parseRouteHash(rawHash: string): MesurvRoute {
  const hash = rawHash.replace(/^#\/?/, '').trim();
  const parts = hash.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'calculator') {
    const validSubs = ['scientific', 'coord', 'traverse', 'leveling', 'area'] as const;
    const sub = validSubs.includes(parts[1] as any) ? (parts[1] as 'scientific' | 'coord' | 'traverse' | 'leveling' | 'area') : undefined;
    return {
      tab: 'calculator',
      subTab: sub,
      topicId: undefined
    };
  }
  if (first === 'map' || first === 'map-redesign' || first === 'map-templates' || first === 'redesign') {
    return {
      tab: 'map',
      subTab: undefined,
      topicId: undefined
    };
  }
  return {
    tab: 'knowledge',
    subTab: undefined,
    topicId: first === 'knowledge' ? parts[1] : undefined
  };
}
