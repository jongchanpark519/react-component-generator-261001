import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readStorage, writeStorage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('저장된 JSON을 파싱해 반환한다', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(readStorage('k', {})).toEqual({ a: 1 });
  });

  it('JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('revive 함수로 파싱 결과를 검증·변환한다', () => {
    localStorage.setItem('k', JSON.stringify(3));
    expect(readStorage('k', 0, (raw) => (raw as number) * 2)).toBe(6);
  });

  it('localStorage 접근이 실패하면 fallback을 반환한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('값을 JSON으로 저장한다', () => {
    writeStorage('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('저장이 실패해도 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => writeStorage('k', 1)).not.toThrow();
  });
});
