import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from './useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 값으로 초기화한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => useLocalStorageState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('저장된 값이 없으면 초기값을 쓴다', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('값이 바뀌면 localStorage에 기록한다', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(localStorage.getItem('k')).toBe('"next"');
  });
});
