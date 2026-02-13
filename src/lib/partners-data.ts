export interface Partner {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: 'Investiții' | 'Fintech' | 'Crypto';
  url: string;
  logoUrl?: string;
  isPremium: boolean;
  isActive: boolean;
  // Visual: first letter + color used as fallback logo
  color: string;
}

export const partners: Partner[] = [
  {
    id: 'trading212',
    name: 'Trading212',
    description: 'Platformă de investiții cu acțiuni și ETF-uri fără comisioane. Populară în România.',
    shortDescription: 'Investește în acțiuni și ETF-uri fără comisioane',
    category: 'Investiții',
    url: '#',
    isPremium: true,
    isActive: true,
    color: '#1A56DB',
  },
  {
    id: 'xtb',
    name: 'XTB România',
    description: 'Broker reglementat cu acces la acțiuni, ETF-uri, CFD-uri și forex.',
    shortDescription: 'Broker reglementat — acțiuni, ETF-uri, CFD-uri',
    category: 'Investiții',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#E02424',
  },
  {
    id: 'etoro',
    name: 'eToro',
    description: 'Platformă de trading social cu acțiuni, crypto și copy trading.',
    shortDescription: 'Trading social cu copy trading',
    category: 'Investiții',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#069668',
  },
  {
    id: 'interactive-brokers',
    name: 'Interactive Brokers',
    description: 'Broker profesional cu acces la piețe globale și comisioane reduse.',
    shortDescription: 'Acces la piețe globale, comisioane reduse',
    category: 'Investiții',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#D61F1F',
  },
  {
    id: 'revolut',
    name: 'Revolut',
    description: 'Cont financiar complet: banking, investiții, crypto, transferuri internaționale.',
    shortDescription: 'Banking, investiții, crypto — totul într-un loc',
    category: 'Fintech',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#0D0D0D',
  },
  {
    id: 'wise',
    name: 'Wise',
    description: 'Transferuri internaționale cu curs de schimb real, fără comisioane ascunse.',
    shortDescription: 'Transferuri internaționale la curs real',
    category: 'Fintech',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#9FE870',
  },
  {
    id: 'binance',
    name: 'Binance',
    description: 'Cea mai mare exchange crypto din lume, cu suport pentru piața românească.',
    shortDescription: 'Cea mai mare exchange crypto din lume',
    category: 'Crypto',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#F0B90B',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    description: 'Exchange crypto reglementat, simplu de folosit pentru începători.',
    shortDescription: 'Exchange crypto simplu pentru începători',
    category: 'Crypto',
    url: '#',
    isPremium: false,
    isActive: true,
    color: '#0052FF',
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Investiții': 'bg-blue-100 text-blue-700',
  'Fintech': 'bg-green-100 text-green-700',
  'Crypto': 'bg-amber-100 text-amber-700',
};

export function getPremiumPartner(): Partner | undefined {
  return partners.find(p => p.isPremium && p.isActive);
}

export function getStandardPartners(): Partner[] {
  return partners.filter(p => !p.isPremium && p.isActive);
}

export function getAllActivePartners(): Partner[] {
  return partners.filter(p => p.isActive);
}
