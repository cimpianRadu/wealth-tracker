'use client';

import { create } from 'zustand';
import type { Asset, Debt, Snapshot, Currency } from './db';
import * as dbOps from './db';
import { DEFAULT_RATES, convertFromRON, type ExchangeRates } from './currency';

interface BackupEntry {
  date: string;
  type: 'json' | 'csv';
}

interface WealthStore {
  // Data
  assets: Asset[];
  debts: Debt[];
  snapshots: Snapshot[];
  exchangeRates: ExchangeRates;
  displayCurrency: Currency;
  isLoading: boolean;
  isIncognito: boolean;
  lastBackupDate: string | null;
  backupHistory: BackupEntry[];

  // Actions
  loadAll: () => Promise<void>;
  setDisplayCurrency: (currency: Currency) => void;
  setIsIncognito: (value: boolean) => void;
  addBackupEntry: (type: 'json' | 'csv') => void;

  // Asset actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAsset: (id: number, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: number, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;

  // Snapshot actions
  createSnapshot: () => Promise<void>;

  // Exchange rate actions
  updateExchangeRates: (eurToRon: number, usdToRon: number) => Promise<void>;

  // Computed
  totalAssets: () => number;
  totalDebts: () => number;
  netWorth: () => number;
  displayValue: (ronValue: number) => number;
}

export const useWealthStore = create<WealthStore>((set, get) => ({
  assets: [],
  debts: [],
  snapshots: [],
  exchangeRates: DEFAULT_RATES,
  displayCurrency: 'RON',
  isLoading: true,
  isIncognito: false,
  lastBackupDate: null,
  backupHistory: [],

  loadAll: async () => {
    try {
      const [assets, debts, snapshots, rates] = await Promise.all([
        dbOps.getAllAssets(),
        dbOps.getAllDebts(),
        dbOps.getSnapshots(),
        dbOps.getExchangeRates(),
      ]);

      // Load backup tracking from localStorage
      let lastBackupDate: string | null = null;
      let backupHistory: BackupEntry[] = [];
      if (typeof window !== 'undefined') {
        lastBackupDate = localStorage.getItem('wealth-tracker-last-backup');
        try {
          backupHistory = JSON.parse(localStorage.getItem('wealth-tracker-backup-history') || '[]');
        } catch { /* ignore */ }
      }

      set({
        assets,
        debts,
        snapshots,
        exchangeRates: rates
          ? { eurToRon: rates.eurToRon, usdToRon: rates.usdToRon }
          : DEFAULT_RATES,
        isLoading: false,
        lastBackupDate,
        backupHistory,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setDisplayCurrency: (currency: Currency) => set({ displayCurrency: currency }),
  setIsIncognito: (value: boolean) => set({ isIncognito: value }),

  addBackupEntry: (type) => {
    const date = new Date().toISOString();
    const entry: BackupEntry = { date, type };
    const history = [...get().backupHistory, entry];
    if (typeof window !== 'undefined') {
      localStorage.setItem('wealth-tracker-last-backup', date);
      localStorage.setItem('wealth-tracker-backup-history', JSON.stringify(history));
    }
    set({ lastBackupDate: date, backupHistory: history });
  },

  addAsset: async (asset) => {
    await dbOps.addAsset(asset);
    const assets = await dbOps.getAllAssets();
    set({ assets });
  },

  updateAsset: async (id, updates) => {
    await dbOps.updateAsset(id, updates);
    const assets = await dbOps.getAllAssets();
    set({ assets });
  },

  deleteAsset: async (id) => {
    await dbOps.deleteAsset(id);
    const assets = await dbOps.getAllAssets();
    set({ assets });
  },

  addDebt: async (debt) => {
    await dbOps.addDebt(debt);
    const debts = await dbOps.getAllDebts();
    set({ debts });
  },

  updateDebt: async (id, updates) => {
    await dbOps.updateDebt(id, updates);
    const debts = await dbOps.getAllDebts();
    set({ debts });
  },

  deleteDebt: async (id) => {
    await dbOps.deleteDebt(id);
    const debts = await dbOps.getAllDebts();
    set({ debts });
  },

  createSnapshot: async () => {
    await dbOps.createSnapshot();
    const snapshots = await dbOps.getSnapshots();
    set({ snapshots });
  },

  updateExchangeRates: async (eurToRon, usdToRon) => {
    await dbOps.setExchangeRates(eurToRon, usdToRon);
    set({ exchangeRates: { eurToRon, usdToRon } });
  },

  totalAssets: () => {
    const { assets } = get();
    return assets.reduce((sum, a) => sum + a.valueRON, 0);
  },

  totalDebts: () => {
    const { debts } = get();
    return debts.reduce((sum, d) => sum + d.amountRON, 0);
  },

  netWorth: () => {
    return get().totalAssets() - get().totalDebts();
  },

  displayValue: (ronValue: number) => {
    const { displayCurrency, exchangeRates } = get();
    return convertFromRON(ronValue, displayCurrency, exchangeRates);
  },
}));
