// 프로바이더 스트리밍 응답(SSE)을 파싱하는 순수 함수들.

/** SSE 본문에서 `data:` 줄의 페이로드만 순서대로 꺼낸다. 청크 경계에서 잘린 줄은 이어 붙인다. */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const parse = (line: string): string | null => {
    const trimmed = line.endsWith('\r') ? line.slice(0, -1) : line;
    if (!trimmed.startsWith('data:')) return null;
    return trimmed.slice(5).replace(/^ /, '');
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline: number;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const data = parse(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (data !== null) yield data;
    }
  }

  buffer += decoder.decode();
  const last = parse(buffer);
  if (last !== null) yield last;
}

/** Anthropic `content_block_delta` 이벤트의 텍스트 조각. 그 외 이벤트는 빈 문자열. */
export function extractAnthropicDelta(data: string): string {
  const event = JSON.parse(data) as {
    type?: string;
    delta?: { type?: string; text?: string };
  };
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return event.delta.text ?? '';
  }
  return '';
}

/** Gemini 스트림 청크의 텍스트 조각. 잘림(MAX_TOKENS)은 에러로 처리한다. */
export function extractGoogleDelta(data: string): string {
  const chunk = JSON.parse(data) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };
  const candidate = chunk.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
  }
  return candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}
