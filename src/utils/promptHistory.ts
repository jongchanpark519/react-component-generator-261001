export const HISTORY_MAX = 10;

export function addPrompt(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, HISTORY_MAX);
}
