import { describe, it, expect } from 'vitest';
import { reviveComponents, reviveProvider, reviveApiKeys, reviveHistory } from './revive';

describe('reviveComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const [c] = reviveComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
    ]);
    expect(c.createdAt).toBeInstanceOf(Date);
    expect(c.createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('형식이 잘못된 항목은 걸러낸다', () => {
    const result = reviveComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
      { id: 2, prompt: 'p' },
      null,
      { id: '3', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
    ]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveComponents('x')).toEqual([]);
  });
});

describe('reviveProvider', () => {
  it('알려진 provider만 허용하고 나머지는 google로 되돌린다', () => {
    expect(reviveProvider('anthropic')).toBe('anthropic');
    expect(reviveProvider('openai')).toBe('google');
    expect(reviveProvider(null)).toBe('google');
  });
});

describe('reviveApiKeys', () => {
  it('provider별 문자열 키만 복원한다', () => {
    expect(reviveApiKeys({ anthropic: 'sk-ant', google: 1 })).toEqual({
      anthropic: 'sk-ant',
      google: '',
    });
  });

  it('객체가 아니면 빈 키를 반환한다', () => {
    expect(reviveApiKeys(null)).toEqual({ anthropic: '', google: '' });
  });
});

describe('reviveHistory', () => {
  it('문자열만 남긴다', () => {
    expect(reviveHistory(['a', 1, 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveHistory({})).toEqual([]);
  });
});
