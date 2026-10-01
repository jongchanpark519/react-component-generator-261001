// 서버가 보내는 NDJSON 스트림을 읽는 유틸.
export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; error: string };

/** 줄 단위 JSON 이벤트를 순서대로 꺼낸다. 청크 경계에서 잘린 줄은 이어 붙인다. */
export async function* readNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline: number;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as StreamEvent;
    }
  }

  const last = (buffer + decoder.decode()).trim();
  if (last) yield JSON.parse(last) as StreamEvent;
}
