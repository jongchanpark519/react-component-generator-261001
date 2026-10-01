import { describe, it, expect } from 'vitest';
import { addPrompt, HISTORY_MAX } from './promptHistory';

describe('addPrompt', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPrompt(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복이면 기존 항목을 제거하고 맨 앞으로 올린다', () => {
    expect(addPrompt(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it(`최대 ${HISTORY_MAX}개까지만 유지한다`, () => {
    const full = Array.from({ length: HISTORY_MAX }, (_, i) => `p${i}`);
    const result = addPrompt(full, 'new');
    expect(result).toHaveLength(HISTORY_MAX);
    expect(result[0]).toBe('new');
  });
});
