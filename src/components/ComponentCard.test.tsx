import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentCard } from './ComponentCard';
import type { GeneratedComponent } from '../types';

const component: GeneratedComponent = {
  id: 'c1',
  prompt: '버튼',
  code: 'const A = () => <button>hi</button>;\n\nrender(<A />);',
  createdAt: new Date('2026-01-01T09:00:00'),
};

function renderCard(isStreaming: boolean) {
  const props = { component, onRemove: vi.fn(), onRegenerate: vi.fn(), isLoading: isStreaming };
  const view = render(<ComponentCard {...props} isStreaming={isStreaming} />);
  return {
    rerenderWith: (next: boolean) =>
      view.rerender(<ComponentCard {...props} isLoading={next} isStreaming={next} />),
  };
}

describe('ComponentCard 스트리밍', () => {
  it('스트리밍 중에는 코드 탭이 활성화된다', () => {
    renderCard(true);
    expect(screen.getByRole('button', { name: '코드' })).toHaveClass('tab--active');
  });

  it('스트리밍 중에는 미리보기 탭을 누를 수 없다', () => {
    renderCard(true);
    expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();
  });

  it('스트리밍이 끝나면 미리보기 탭으로 전환된다', () => {
    const { rerenderWith } = renderCard(true);
    rerenderWith(false);
    expect(screen.getByRole('button', { name: '미리보기' })).toHaveClass('tab--active');
  });

  it('스트리밍이 아닌 카드는 처음부터 미리보기 탭이다', () => {
    renderCard(false);
    expect(screen.getByRole('button', { name: '미리보기' })).toHaveClass('tab--active');
  });
});
