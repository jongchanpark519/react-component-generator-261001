import { describe, it, expect } from 'vitest';
import { readNdjson } from './ndjson';
import type { StreamEvent } from './ndjson';

function toStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(body: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const ev of readNdjson(body)) out.push(ev);
  return out;
}

describe('readNdjson', () => {
  it('줄 단위 JSON 이벤트를 순서대로 반환한다', async () => {
    const body = toStream(['{"type":"delta","text":"a"}\n{"type":"done","code":"b"}\n']);
    expect(await collect(body)).toEqual([
      { type: 'delta', text: 'a' },
      { type: 'done', code: 'b' },
    ]);
  });

  it('청크 경계에서 잘린 줄을 이어 붙인다', async () => {
    const body = toStream(['{"type":"del', 'ta","text":"a"}\n']);
    expect(await collect(body)).toEqual([{ type: 'delta', text: 'a' }]);
  });

  it('빈 줄은 무시한다', async () => {
    const body = toStream(['\n{"type":"delta","text":"a"}\n\n']);
    expect(await collect(body)).toEqual([{ type: 'delta', text: 'a' }]);
  });

  it('마지막 줄에 개행이 없어도 반환한다', async () => {
    const body = toStream(['{"type":"done","code":"b"}']);
    expect(await collect(body)).toEqual([{ type: 'done', code: 'b' }]);
  });
});
