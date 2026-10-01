// 스트리밍 중 누적된 원문을 화면에 보여줄 코드로 다듬는다.
export function cleanStreamingCode(raw: string): string {
  return raw
    .replace(/^```[a-z]*(?:\n|$)/i, '')
    .replace(/\n?```\s*$/, '');
}
