import { describe, it, expect } from 'vitest';
import { validatePrompt, PROMPT_MAX_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('500자 이하면 유효하다', () => {
    expect(validatePrompt('a'.repeat(500)).valid).toBe(true);
  });

  it('501자 이상이면 유효하지 않다', () => {
    expect(validatePrompt('a'.repeat(501)).valid).toBe(false);
  });

  it('앞뒤 공백은 길이에 포함하지 않는다 (제출 시 trim과 일치)', () => {
    expect(validatePrompt(`  ${'a'.repeat(500)}  `).valid).toBe(true);
  });

  it('현재 길이를 반환한다', () => {
    expect(validatePrompt('안녕하세요').length).toBe(5);
  });

  it('초과 시 에러 메시지를 반환하고, 유효하면 없다', () => {
    expect(validatePrompt('a'.repeat(501)).error).toBe(
      `프롬프트는 ${PROMPT_MAX_LENGTH}자 이하로 입력해주세요.`,
    );
    expect(validatePrompt('ok').error).toBeUndefined();
  });
});
