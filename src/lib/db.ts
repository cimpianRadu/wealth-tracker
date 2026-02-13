import Dexie, { type EntityTable } from 'dexie';

export type AssetCategory = 'stocks' | 'crypto' | 'cash' | 'real-estate' | 'other';
export type Currency = 'RON' | 'EUR' | 'USD';
export type DebtCategory = 'mortgage' | 'credit-card' | 'personal-loan' | 'car-loan' | 'student-loan' | 'other';
export type TransactionType = 'buy' | 'sell' | 'borrow' | 'repay' | 'create' | 'delete';

export interface Asset {
  id?: number;
  name: string;
  category: AssetCategory;
  amount: number;
  valueRON: number;
  currency: Currency;
  purchaseDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id?: number;
  name: string;
  amountRON: number;
  currency: Currency;
  originalAmount: number;
  interestRate?: number;
  dueDate?: string;
  category: DebtCategory;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id?: number;
  month: string; // YYYY-MM format
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  assetsByCategory: Record<string, number>;
  createdAt: string;
}

export interface ExchangeRate {
  id?: number;
  month: string; // YYYY-MM format
  eurToRon: number;
  usdToRon: number;
  updatedAt: string;
}

export interface Transaction {
  id?: number;
  entityType: 'asset' | 'debt';
  entityId: number;
  entityName: string;
  type: TransactionType;
  amountRON: number;
  currency: Currency;
  originalAmount: number;
  quantity?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface AdConfig {
  id?: number;
  zone: 'sidebar' | 'carousel' | 'popup' | 'recommendations-page' | 'contextual';
  advertiserName: string;
  imageUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPremium: boolean;
  description: string;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdClick {
  id?: number;
  adId: number;
  timestamp: string;
}

class WealthTrackerDB extends Dexie {
  assets!: EntityTable<Asset, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  snapshots!: EntityTable<Snapshot, 'id'>;
  exchangeRates!: EntityTable<ExchangeRate, 'id'>;
  adConfigs!: EntityTable<AdConfig, 'id'>;
  adClicks!: EntityTable<AdClick, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;

  constructor() {
    super('WealthTrackerDB');
    this.version(1).stores({
      assets: '++id, category, currency, isActive, createdAt',
      debts: '++id, category, createdAt',
      snapshots: '++id, &month, createdAt',
      exchangeRates: '++id, &month',
      adConfigs: '++id, zone, isActive, startDate, endDate',
      adClicks: '++id, adId, timestamp',
    });
    this.version(2).stores({
      assets: '++id, category, currency, isActive, createdAt',
      debts: '++id, category, createdAt',
      snapshots: '++id, &month, createdAt',
      exchangeRates: '++id, &month',
      adConfigs: '++id, zone, isActive, isPremium, startDate, endDate',
      adClicks: '++id, adId, timestamp',
    }).upgrade(tx => {
      return tx.table('adConfigs').toCollection().modify(ad => {
        if (ad.isPremium === undefined) ad.isPremium = false;
        if (ad.description === undefined) ad.description = '';
      });
    });
    this.version(3).stores({
      assets: '++id, category, currency, isActive, createdAt',
      debts: '++id, category, createdAt',
      snapshots: '++id, &month, createdAt',
      exchangeRates: '++id, &month',
      adConfigs: '++id, zone, isActive, isPremium, startDate, endDate',
      adClicks: '++id, adId, timestamp',
      transactions: '++id, entityType, entityId, type, date, createdAt',
    });
  }
}

export const db = new WealthTrackerDB();

// Helper functions
export async function getActiveAssets(): Promise<Asset[]> {
  return db.assets.where('isActive').equals(1).toArray();
}

export async function getAllAssets(): Promise<Asset[]> {
  return db.assets.toArray();
}

export async function addAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.assets.add({
    ...asset,
    createdAt: now,
    updatedAt: now,
  }) as Promise<number>;
}

export async function updateAsset(id: number, updates: Partial<Asset>): Promise<void> {
  await db.assets.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAsset(id: number): Promise<void> {
  return db.assets.delete(id);
}

export async function getAllDebts(): Promise<Debt[]> {
  return db.debts.toArray();
}

export async function addDebt(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.debts.add({
    ...debt,
    createdAt: now,
    updatedAt: now,
  }) as Promise<number>;
}

export async function updateDebt(id: number, updates: Partial<Debt>): Promise<void> {
  await db.debts.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteDebt(id: number): Promise<void> {
  return db.debts.delete(id);
}

// Transaction helpers
export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<number> {
  return db.transactions.add({
    ...tx,
    createdAt: new Date().toISOString(),
  }) as Promise<number>;
}

export async function getTransactionsForEntity(entityType: 'asset' | 'debt', entityId: number): Promise<Transaction[]> {
  const txs = await db.transactions
    .where('entityId')
    .equals(entityId)
    .toArray();
  return txs
    .filter(t => t.entityType === entityType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('createdAt').reverse().toArray();
}

export async function getSnapshots(): Promise<Snapshot[]> {
  return db.snapshots.orderBy('month').toArray();
}

export async function createSnapshot(): Promise<void> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const assets = await db.assets.toArray();
  const debts = await db.debts.toArray();

  const totalAssets = assets.reduce((sum, a) => sum + a.valueRON, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.amountRON, 0);

  const assetsByCategory: Record<string, number> = {};
  for (const asset of assets) {
    assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + asset.valueRON;
  }

  // Upsert - delete existing snapshot for this month if it exists
  const existing = await db.snapshots.where('month').equals(month).first();
  if (existing?.id) {
    await db.snapshots.delete(existing.id);
  }

  await db.snapshots.add({
    month,
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts,
    assetsByCategory,
    createdAt: now.toISOString(),
  });
}

export async function getExchangeRates(month?: string): Promise<ExchangeRate | undefined> {
  const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  return db.exchangeRates.where('month').equals(m).first();
}

export async function setExchangeRates(eurToRon: number, usdToRon: number, month?: string): Promise<void> {
  const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const existing = await db.exchangeRates.where('month').equals(m).first();

  if (existing?.id) {
    await db.exchangeRates.update(existing.id, {
      eurToRon,
      usdToRon,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  await db.exchangeRates.add({
    month: m,
    eurToRon,
    usdToRon,
    updatedAt: new Date().toISOString(),
  });
}

export async function getActiveAds(zone?: string): Promise<AdConfig[]> {
  const now = new Date().toISOString();
  let query = db.adConfigs.where('isActive').equals(1);
  const ads = await query.toArray();

  return ads.filter(ad => {
    const inDateRange = ad.startDate <= now && ad.endDate >= now;
    const matchesZone = zone ? ad.zone === zone : true;
    return inDateRange && matchesZone;
  });
}

export async function recordAdClick(adId: number): Promise<void> {
  await db.adClicks.add({ adId, timestamp: new Date().toISOString() });
  await db.adConfigs.where('id').equals(adId).modify(ad => {
    ad.clicks = (ad.clicks || 0) + 1;
  });
}

// Export all data as JSON
export async function exportAllData(): Promise<string> {
  const assets = await db.assets.toArray();
  const debts = await db.debts.toArray();
  const snapshots = await db.snapshots.toArray();
  const exchangeRates = await db.exchangeRates.toArray();
  const transactions = await db.transactions.toArray();

  return JSON.stringify({
    version: 2,
    exportDate: new Date().toISOString(),
    assets,
    debts,
    snapshots,
    exchangeRates,
    transactions,
  }, null, 2);
}

// Import data from JSON
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  await db.transaction('rw', [db.assets, db.debts, db.snapshots, db.exchangeRates, db.transactions], async () => {
    if (data.assets) {
      await db.assets.clear();
      await db.assets.bulkAdd(data.assets.map((a: Asset) => {
        const { id, ...rest } = a;
        return rest;
      }));
    }
    if (data.debts) {
      await db.debts.clear();
      await db.debts.bulkAdd(data.debts.map((d: Debt) => {
        const { id, ...rest } = d;
        return rest;
      }));
    }
    if (data.snapshots) {
      await db.snapshots.clear();
      await db.snapshots.bulkAdd(data.snapshots.map((s: Snapshot) => {
        const { id, ...rest } = s;
        return rest;
      }));
    }
    if (data.exchangeRates) {
      await db.exchangeRates.clear();
      await db.exchangeRates.bulkAdd(data.exchangeRates.map((r: ExchangeRate) => {
        const { id, ...rest } = r;
        return rest;
      }));
    }
    if (data.transactions) {
      await db.transactions.clear();
      await db.transactions.bulkAdd(data.transactions.map((t: Transaction) => {
        const { id, ...rest } = t;
        return rest;
      }));
    }
  });
}

// Seed test data
export async function seedTestData(): Promise<void> {
  // Clear existing data
  await db.transaction('rw', [db.assets, db.debts, db.snapshots, db.transactions], async () => {
    await db.assets.clear();
    await db.debts.clear();
    await db.snapshots.clear();
    await db.transactions.clear();
  });

  const now = new Date();
  const ts = now.toISOString();

  // Assets
  const assetId1 = await db.assets.add({
    name: 'Acțiuni Apple (AAPL)', category: 'stocks', amount: 15, valueRON: 37350,
    currency: 'USD', purchaseDate: '2025-03-15', notes: 'Cumpărate prin Interactive Brokers',
    isActive: true, createdAt: '2025-03-15T10:00:00Z', updatedAt: ts,
  }) as number;

  const assetId2 = await db.assets.add({
    name: 'Bitcoin (BTC)', category: 'crypto', amount: 0.5, valueRON: 22800,
    currency: 'USD', notes: 'Cold wallet Ledger',
    isActive: true, createdAt: '2025-06-01T10:00:00Z', updatedAt: ts,
  }) as number;

  const assetId3 = await db.assets.add({
    name: 'Cont Economii ING', category: 'cash', amount: 1, valueRON: 45000,
    currency: 'RON', notes: 'Fond de urgență',
    isActive: true, createdAt: '2024-09-01T10:00:00Z', updatedAt: ts,
  }) as number;

  const assetId4 = await db.assets.add({
    name: 'Apartament 2 camere Cluj', category: 'real-estate', amount: 1, valueRON: 497000,
    currency: 'EUR', purchaseDate: '2023-05-20',
    isActive: true, createdAt: '2023-05-20T10:00:00Z', updatedAt: ts,
  }) as number;

  const assetId5 = await db.assets.add({
    name: 'ETF Vanguard S&P 500', category: 'stocks', amount: 30, valueRON: 14910,
    currency: 'EUR', purchaseDate: '2025-01-10', notes: 'DCA lunar',
    isActive: true, createdAt: '2025-01-10T10:00:00Z', updatedAt: ts,
  }) as number;

  const assetId6 = await db.assets.add({
    name: 'Ethereum (ETH)', category: 'crypto', amount: 3, valueRON: 6840,
    currency: 'USD',
    isActive: true, createdAt: '2025-08-15T10:00:00Z', updatedAt: ts,
  }) as number;

  // Debts
  const debtId1 = await db.debts.add({
    name: 'Credit ipotecar BCR', amountRON: 350000, currency: 'RON', originalAmount: 350000,
    interestRate: 5.9, dueDate: '2048-06-01', category: 'mortgage',
    notes: 'Rată fixă 5 ani', createdAt: '2023-06-01T10:00:00Z', updatedAt: ts,
  }) as number;

  const debtId2 = await db.debts.add({
    name: 'Card credit Revolut', amountRON: 4500, currency: 'RON', originalAmount: 4500,
    interestRate: 19.9, category: 'credit-card',
    createdAt: '2025-11-01T10:00:00Z', updatedAt: ts,
  }) as number;

  const debtId3 = await db.debts.add({
    name: 'Împrumut de la tata', amountRON: 15000, currency: 'RON', originalAmount: 15000,
    category: 'personal-loan', notes: 'Fără dobândă, de returnat în 2026',
    createdAt: '2025-07-01T10:00:00Z', updatedAt: ts,
  }) as number;

  // Transactions for assets
  const txs: Omit<Transaction, 'id'>[] = [
    // Apple stocks
    { entityType: 'asset', entityId: assetId1, entityName: 'Acțiuni Apple (AAPL)', type: 'create',
      amountRON: 25000, currency: 'USD', originalAmount: 10, quantity: 10,
      date: '2025-03-15', createdAt: '2025-03-15T10:00:00Z' },
    { entityType: 'asset', entityId: assetId1, entityName: 'Acțiuni Apple (AAPL)', type: 'buy',
      amountRON: 12350, currency: 'USD', originalAmount: 5, quantity: 5,
      notes: 'Cumpărat la dip', date: '2025-09-20', createdAt: '2025-09-20T10:00:00Z' },
    // Bitcoin
    { entityType: 'asset', entityId: assetId2, entityName: 'Bitcoin (BTC)', type: 'create',
      amountRON: 18240, currency: 'USD', originalAmount: 0.4, quantity: 0.4,
      date: '2025-06-01', createdAt: '2025-06-01T10:00:00Z' },
    { entityType: 'asset', entityId: assetId2, entityName: 'Bitcoin (BTC)', type: 'buy',
      amountRON: 4560, currency: 'USD', originalAmount: 0.1, quantity: 0.1,
      date: '2025-10-15', createdAt: '2025-10-15T10:00:00Z' },
    // Cont economii
    { entityType: 'asset', entityId: assetId3, entityName: 'Cont Economii ING', type: 'create',
      amountRON: 30000, currency: 'RON', originalAmount: 1, quantity: 1,
      date: '2024-09-01', createdAt: '2024-09-01T10:00:00Z' },
    { entityType: 'asset', entityId: assetId3, entityName: 'Cont Economii ING', type: 'buy',
      amountRON: 5000, currency: 'RON', originalAmount: 5000,
      notes: 'Depunere lunară', date: '2025-10-01', createdAt: '2025-10-01T10:00:00Z' },
    { entityType: 'asset', entityId: assetId3, entityName: 'Cont Economii ING', type: 'buy',
      amountRON: 5000, currency: 'RON', originalAmount: 5000,
      notes: 'Depunere lunară', date: '2025-11-01', createdAt: '2025-11-01T10:00:00Z' },
    { entityType: 'asset', entityId: assetId3, entityName: 'Cont Economii ING', type: 'buy',
      amountRON: 5000, currency: 'RON', originalAmount: 5000,
      notes: 'Depunere lunară', date: '2025-12-01', createdAt: '2025-12-01T10:00:00Z' },
    // Apartament
    { entityType: 'asset', entityId: assetId4, entityName: 'Apartament 2 camere Cluj', type: 'create',
      amountRON: 448500, currency: 'EUR', originalAmount: 1, quantity: 1,
      date: '2023-05-20', createdAt: '2023-05-20T10:00:00Z' },
    // ETF
    { entityType: 'asset', entityId: assetId5, entityName: 'ETF Vanguard S&P 500', type: 'create',
      amountRON: 9940, currency: 'EUR', originalAmount: 20, quantity: 20,
      date: '2025-01-10', createdAt: '2025-01-10T10:00:00Z' },
    { entityType: 'asset', entityId: assetId5, entityName: 'ETF Vanguard S&P 500', type: 'buy',
      amountRON: 4970, currency: 'EUR', originalAmount: 10, quantity: 10,
      notes: 'DCA', date: '2025-07-10', createdAt: '2025-07-10T10:00:00Z' },
    // ETH
    { entityType: 'asset', entityId: assetId6, entityName: 'Ethereum (ETH)', type: 'create',
      amountRON: 6840, currency: 'USD', originalAmount: 3, quantity: 3,
      date: '2025-08-15', createdAt: '2025-08-15T10:00:00Z' },
    // Debt transactions
    { entityType: 'debt', entityId: debtId1, entityName: 'Credit ipotecar BCR', type: 'create',
      amountRON: 380000, currency: 'RON', originalAmount: 380000,
      date: '2023-06-01', createdAt: '2023-06-01T10:00:00Z' },
    { entityType: 'debt', entityId: debtId1, entityName: 'Credit ipotecar BCR', type: 'repay',
      amountRON: 15000, currency: 'RON', originalAmount: 15000,
      notes: 'Rate lunare cumulate', date: '2025-09-01', createdAt: '2025-09-01T10:00:00Z' },
    { entityType: 'debt', entityId: debtId1, entityName: 'Credit ipotecar BCR', type: 'repay',
      amountRON: 15000, currency: 'RON', originalAmount: 15000,
      notes: 'Rate lunare cumulate', date: '2025-12-01', createdAt: '2025-12-01T10:00:00Z' },
    { entityType: 'debt', entityId: debtId2, entityName: 'Card credit Revolut', type: 'create',
      amountRON: 7500, currency: 'RON', originalAmount: 7500,
      date: '2025-11-01', createdAt: '2025-11-01T10:00:00Z' },
    { entityType: 'debt', entityId: debtId2, entityName: 'Card credit Revolut', type: 'repay',
      amountRON: 3000, currency: 'RON', originalAmount: 3000,
      notes: 'Plată parțială', date: '2025-12-15', createdAt: '2025-12-15T10:00:00Z' },
    { entityType: 'debt', entityId: debtId3, entityName: 'Împrumut de la tata', type: 'create',
      amountRON: 20000, currency: 'RON', originalAmount: 20000,
      date: '2025-07-01', createdAt: '2025-07-01T10:00:00Z' },
    { entityType: 'debt', entityId: debtId3, entityName: 'Împrumut de la tata', type: 'repay',
      amountRON: 5000, currency: 'RON', originalAmount: 5000,
      notes: 'Rambursare parțială', date: '2025-11-01', createdAt: '2025-11-01T10:00:00Z' },
  ];

  for (const tx of txs) {
    await db.transactions.add(tx as Transaction);
  }

  // Snapshots - 6 months of history (Sep 2025 - Feb 2026)
  const snapshots: Omit<Snapshot, 'id'>[] = [
    {
      month: '2025-09', totalAssets: 530000, totalDebts: 395000, netWorth: 135000,
      assetsByCategory: { stocks: 35000, crypto: 18000, cash: 35000, 'real-estate': 448500 },
      createdAt: '2025-09-30T10:00:00Z',
    },
    {
      month: '2025-10', totalAssets: 548000, totalDebts: 390000, netWorth: 158000,
      assetsByCategory: { stocks: 38000, crypto: 22000, cash: 40000, 'real-estate': 455000 },
      createdAt: '2025-10-31T10:00:00Z',
    },
    {
      month: '2025-11', totalAssets: 570000, totalDebts: 382000, netWorth: 188000,
      assetsByCategory: { stocks: 42000, crypto: 25000, cash: 45000, 'real-estate': 465000 },
      createdAt: '2025-11-30T10:00:00Z',
    },
    {
      month: '2025-12', totalAssets: 590000, totalDebts: 372000, netWorth: 218000,
      assetsByCategory: { stocks: 48000, crypto: 27000, cash: 50000, 'real-estate': 472000 },
      createdAt: '2025-12-31T10:00:00Z',
    },
    {
      month: '2026-01', totalAssets: 610000, totalDebts: 370000, netWorth: 240000,
      assetsByCategory: { stocks: 50000, crypto: 28000, cash: 42000, 'real-estate': 490000 },
      createdAt: '2026-01-31T10:00:00Z',
    },
    {
      month: '2026-02', totalAssets: 623900, totalDebts: 369500, netWorth: 254400,
      assetsByCategory: { stocks: 52260, crypto: 29640, cash: 45000, 'real-estate': 497000 },
      createdAt: ts,
    },
  ];

  for (const s of snapshots) {
    await db.snapshots.add(s as Snapshot);
  }
}

// Export assets as CSV
export function exportAssetsCSV(assets: Asset[]): string {
  const headers = ['Name', 'Category', 'Amount', 'Value (RON)', 'Currency', 'Purchase Date', 'Notes', 'Active'];
  const rows = assets.map(a => [
    `"${a.name}"`,
    a.category,
    a.amount,
    a.valueRON,
    a.currency,
    a.purchaseDate || '',
    `"${(a.notes || '').replace(/"/g, '""')}"`,
    a.isActive ? 'Yes' : 'No',
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// Export debts as CSV
export function exportDebtsCSV(debts: Debt[]): string {
  const headers = ['Name', 'Amount (RON)', 'Currency', 'Original Amount', 'Interest Rate', 'Due Date', 'Category', 'Notes'];
  const rows = debts.map(d => [
    `"${d.name}"`,
    d.amountRON,
    d.currency,
    d.originalAmount,
    d.interestRate || '',
    d.dueDate || '',
    d.category,
    `"${(d.notes || '').replace(/"/g, '""')}"`,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
