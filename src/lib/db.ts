// Baza Postgres (Neon, Frankfurt). Driverul HTTP face o cerere pe interogare,
// fără conexiuni ținute deschise, deci merge pe orice hosting serverless sau pe
// un server obișnuit. Tabelele vin din `db/migrations/*.sql` (npm run db:migrate).

import 'server-only';
import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless';

// Doar pentru dezvoltare și teste: un endpoint local compatibil cu protocolul
// HTTP de la Neon (ex. un proxy în fața unui Postgres local).
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;

let client: NeonQueryFunction<false, false> | null = null;

export function dbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL lipsește: baza Neon nu e configurată.');
    client = neon(url);
  }
  return client;
}

/** Rânduri cu tipul pus de noi; driverul întoarce Record<string, unknown>. */
export type Row = Record<string, unknown>;

export function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  return 0;
}

export function str(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return v == null ? '' : String(v);
}

/** Data din coloanele `date` vine ca string sau Date, după driver; o vrem YYYY-MM-DD. */
export function isoDate(v: unknown): string {
  // Driverul transformă o coloană `date` într-un Date la miezul nopții în ora
  // locală a serverului; citim tot în ora locală, altfel pe un server cu fus
  // orar estic data sare cu o zi înapoi.
  if (v instanceof Date) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  }
  return String(v).slice(0, 10);
}
