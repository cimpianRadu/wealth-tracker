import Dexie, { type EntityTable } from 'dexie';

export type AssetCategory = 'stocks' | 'crypto' | 'cash' | 'real-estate' | 'other';
export type Currency = 'RON' | 'EUR' | 'USD';
export type DebtCategory = 'mortgage' | 'credit-card' | 'personal-loan' | 'car-loan' | 'student-loan' | 'other';

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

export async function addAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString();
  await db.assets.add({
    ...asset,
    createdAt: now,
    updatedAt: now,
  });
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

export async function addDebt(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString();
  await db.debts.add({
    ...debt,
    createdAt: now,
    updatedAt: now,
  });
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

  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    assets,
    debts,
    snapshots,
    exchangeRates,
  }, null, 2);
}

// Import data from JSON
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);

  await db.transaction('rw', [db.assets, db.debts, db.snapshots, db.exchangeRates], async () => {
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
  });
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
