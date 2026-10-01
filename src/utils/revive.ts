import type { GeneratedComponent, Provider } from '../types';

export const PROVIDERS: readonly Provider[] = ['anthropic', 'google'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export function reviveComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): GeneratedComponent[] => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.prompt !== 'string' ||
      typeof item.code !== 'string' ||
      typeof item.createdAt !== 'string'
    ) {
      return [];
    }
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) return [];
    return [{ id: item.id, prompt: item.prompt, code: item.code, createdAt }];
  });
}

export function reviveProvider(raw: unknown): Provider {
  return PROVIDERS.find((p) => p === raw) ?? 'google';
}

export function reviveApiKeys(raw: unknown): Record<Provider, string> {
  const source = isRecord(raw) ? raw : {};
  const pick = (p: Provider) => (typeof source[p] === 'string' ? source[p] : '');
  return { anthropic: pick('anthropic'), google: pick('google') };
}

export function reviveHistory(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string') : [];
}
