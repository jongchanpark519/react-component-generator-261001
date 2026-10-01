import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { useLocalStorageState } from './useLocalStorageState';
import { reviveComponents, reviveHistory } from '../utils/revive';
import { addPrompt } from '../utils/promptHistory';
import { readNdjson } from '../utils/ndjson';
import { cleanStreamingCode } from '../utils/streamingCode';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  /** 생성 중인 컴포넌트. 첫 코드 조각이 도착하면 나타나고, 완료되면 null로 돌아간다. */
  streaming: GeneratedComponent | null;
  history: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useLocalStorageState<GeneratedComponent[]>(
    'rcg:components',
    [],
    reviveComponents,
  );
  const [history, setHistory] = useLocalStorageState<string[]>('rcg:history', [], reviveHistory);
  const [streaming, setStreaming] = useState<GeneratedComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    // 스트리밍 카드와 완료 카드가 같은 id를 써서 React가 카드를 유지한다(탭 전환 연출).
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate component');
      }

      let raw = '';
      let finalCode: string | null = null;

      for await (const event of readNdjson(res.body)) {
        if (event.type === 'delta') {
          raw += event.text;
          setStreaming({ id, prompt, code: cleanStreamingCode(raw), createdAt });
        } else if (event.type === 'error') {
          throw new Error(event.error);
        } else {
          finalCode = event.code;
        }
      }

      if (finalCode === null) {
        throw new Error('응답이 중간에 끊겼습니다. 다시 시도해주세요.');
      }

      const newComponent: GeneratedComponent = { id, prompt, code: finalCode, createdAt };
      setComponents((prev) => [newComponent, ...prev]);
      setHistory((prev) => addPrompt(prev, prompt));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setStreaming(null);
      setIsLoading(false);
    }
  }, [setComponents, setHistory]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, streaming, history, isLoading, error, generate, removeComponent, clearAll };
}
