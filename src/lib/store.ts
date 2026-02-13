'use client';

import { create } from 'zustand';
import type { Asset, Debt, Snapshot, Currency, Transaction } from './db';
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
  transactions: Transaction[];
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
  deleteAsset: (id: number) => Promise<void>;
  buyAsset: (assetId: number, valueRON: number, currency: Currency, originalAmount: number, quantity?: number, notes?: string, date?: string) => Promise<void>;
  sellAsset: (assetId: number, valueRON: number, currency: Currency, originalAmount: number, quantity?: number, notes?: string, date?: string) => Promise<void>;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;
  borrowMore: (debtId: number, amountRON: number, currency: Currency, originalAmount: number, notes?: string, date?: string) => Promise<void>;
  repayDebt: (debtId: number, amountRON: number, currency: Currency, originalAmount: number, notes?: string, date?: string) => Promise<void>;

  // Dev actions
  seedData: () => Promise<void>;

  // Snapshot actions
  createSnapshot: () => Promise<void>;

  // Exchange rate actions
  updateExchangeRates: (eurToRon: number, usdToRon: number) => Promise<void>;

  // Computed
  totalAssets: () => number;
  totalDebts: () => number;
  netWorth: () => number;
  displayValue: (ronValue: number) => number;
  getEntityTransactions: (entityType: 'asset' | 'debt', entityId: number) => Transaction[];
}

export const useWealthStore = create<WealthStore>((set, get) => ({
  assets: [],
  debts: [],
  snapshots: [],
  transactions: [],
  exchangeRates: DEFAULT_RATES,
  displayCurrency: 'RON',
  isLoading: true,
  isIncognito: false,
  lastBackupDate: null,
  backupHistory: [],

  loadAll: async () => {
    try {
      const [assets, debts, snapshots, rates, transactions] = await Promise.all([
        dbOps.getAllAssets(),
        dbOps.getAllDebts(),
        dbOps.getSnapshots(),
        dbOps.getExchangeRates(),
        dbOps.getAllTransactions(),
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
        transactions,
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
    const newId = await dbOps.addAsset(asset);
    await dbOps.addTransaction({
      entityType: 'asset',
      entityId: newId,
      entityName: asset.name,
      type: 'create',
      amountRON: asset.valueRON,
      currency: asset.currency,
      originalAmount: asset.amount,
      quantity: asset.amount,
      date: new Date().toISOString(),
    });
    const [assets, transactions] = await Promise.all([
      dbOps.getAllAssets(),
      dbOps.getAllTransactions(),
    ]);
    set({ assets, transactions });
  },

  deleteAsset: async (id) => {
    const asset = get().assets.find(a => a.id === id);
    if (asset) {
      await dbOps.addTransaction({
        entityType: 'asset',
        entityId: id,
        entityName: asset.name,
        type: 'delete',
        amountRON: asset.valueRON,
        currency: asset.currency,
        originalAmount: asset.amount,
        date: new Date().toISOString(),
      });
    }
    await dbOps.deleteAsset(id);
    const [assets, transactions] = await Promise.all([
      dbOps.getAllAssets(),
      dbOps.getAllTransactions(),
    ]);
    set({ assets, transactions });
  },

  buyAsset: async (assetId, valueRON, currency, originalAmount, quantity, notes, date) => {
    const asset = get().assets.find(a => a.id === assetId);
    if (!asset) return;

    await dbOps.updateAsset(assetId, {
      valueRON: asset.valueRON + valueRON,
      amount: asset.amount + (quantity || 0),
    });
    await dbOps.addTransaction({
      entityType: 'asset',
      entityId: assetId,
      entityName: asset.name,
      type: 'buy',
      amountRON: valueRON,
      currency,
      originalAmount,
      quantity,
      notes,
      date: date || new Date().toISOString(),
    });
    const [assets, transactions] = await Promise.all([
      dbOps.getAllAssets(),
      dbOps.getAllTransactions(),
    ]);
    set({ assets, transactions });
  },

  sellAsset: async (assetId, valueRON, currency, originalAmount, quantity, notes, date) => {
    const asset = get().assets.find(a => a.id === assetId);
    if (!asset) return;

    await dbOps.addTransaction({
      entityType: 'asset',
      entityId: assetId,
      entityName: asset.name,
      type: 'sell',
      amountRON: valueRON,
      currency,
      originalAmount,
      quantity,
      notes,
      date: date || new Date().toISOString(),
    });

    const newValue = asset.valueRON - valueRON;
    const newAmount = asset.amount - (quantity || 0);

    if (newValue <= 0 || newAmount <= 0) {
      await dbOps.deleteAsset(assetId);
    } else {
      await dbOps.updateAsset(assetId, {
        valueRON: newValue,
        amount: newAmount,
      });
    }

    const [assets, transactions] = await Promise.all([
      dbOps.getAllAssets(),
      dbOps.getAllTransactions(),
    ]);
    set({ assets, transactions });
  },

  addDebt: async (debt) => {
    const newId = await dbOps.addDebt(debt);
    await dbOps.addTransaction({
      entityType: 'debt',
      entityId: newId,
      entityName: debt.name,
      type: 'create',
      amountRON: debt.amountRON,
      currency: debt.currency,
      originalAmount: debt.originalAmount,
      date: new Date().toISOString(),
    });
    const [debts, transactions] = await Promise.all([
      dbOps.getAllDebts(),
      dbOps.getAllTransactions(),
    ]);
    set({ debts, transactions });
  },

  deleteDebt: async (id) => {
    const debt = get().debts.find(d => d.id === id);
    if (debt) {
      await dbOps.addTransaction({
        entityType: 'debt',
        entityId: id,
        entityName: debt.name,
        type: 'delete',
        amountRON: debt.amountRON,
        currency: debt.currency,
        originalAmount: debt.originalAmount,
        date: new Date().toISOString(),
      });
    }
    await dbOps.deleteDebt(id);
    const [debts, transactions] = await Promise.all([
      dbOps.getAllDebts(),
      dbOps.getAllTransactions(),
    ]);
    set({ debts, transactions });
  },

  borrowMore: async (debtId, amountRON, currency, originalAmount, notes, date) => {
    const debt = get().debts.find(d => d.id === debtId);
    if (!debt) return;

    await dbOps.updateDebt(debtId, {
      amountRON: debt.amountRON + amountRON,
      originalAmount: debt.originalAmount + originalAmount,
    });
    await dbOps.addTransaction({
      entityType: 'debt',
      entityId: debtId,
      entityName: debt.name,
      type: 'borrow',
      amountRON,
      currency,
      originalAmount,
      notes,
      date: date || new Date().toISOString(),
    });
    const [debts, transactions] = await Promise.all([
      dbOps.getAllDebts(),
      dbOps.getAllTransactions(),
    ]);
    set({ debts, transactions });
  },

  repayDebt: async (debtId, amountRON, currency, originalAmount, notes, date) => {
    const debt = get().debts.find(d => d.id === debtId);
    if (!debt) return;

    await dbOps.addTransaction({
      entityType: 'debt',
      entityId: debtId,
      entityName: debt.name,
      type: 'repay',
      amountRON,
      currency,
      originalAmount,
      notes,
      date: date || new Date().toISOString(),
    });

    if (amountRON >= debt.amountRON) {
      await dbOps.deleteDebt(debtId);
    } else {
      await dbOps.updateDebt(debtId, {
        amountRON: debt.amountRON - amountRON,
        originalAmount: debt.originalAmount - originalAmount,
      });
    }

    const [debts, transactions] = await Promise.all([
      dbOps.getAllDebts(),
      dbOps.getAllTransactions(),
    ]);
    set({ debts, transactions });
  },

  seedData: async () => {
    await dbOps.seedTestData();
    await get().loadAll();
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

  getEntityTransactions: (entityType, entityId) => {
    return get().transactions
      .filter(t => t.entityType === entityType && t.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
}));
