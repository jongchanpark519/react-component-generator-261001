// localStorage 접근은 비공개 모드·용량 초과 등으로 실패할 수 있어 항상 예외를 삼킨다.
export function readStorage<T>(
  key: string,
  fallback: T,
  revive: (raw: unknown) => T = (raw) => raw as T,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return revive(JSON.parse(stored));
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다 (메모리 상태는 유지됨)
  }
}
