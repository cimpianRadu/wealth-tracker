import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function anthropic(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY lipsește.');
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/** Modelele se pot schimba din env fără deploy de cod. */
export const EXTRACT_MODEL = process.env.EXTRACT_MODEL || 'claude-sonnet-5-5';
export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || 'claude-sonnet-5-5';
