import { describe, it, expect } from 'vitest';
import { readSseData, extractAnthropicDelta, extractGoogleDelta } from './stream';

function toStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const item of gen) out.push(item);
  return out;
}

describe('readSseData', () => {
  it('data 줄의 페이로드만 순서대로 반환한다', async () => {
    const body = toStream(['event: a\ndata: {"x":1}\n\n', 'data: {"x":2}\n\n']);
    expect(await collect(readSseData(body))).toEqual(['{"x":1}', '{"x":2}']);
  });

  it('청크 경계에서 줄이 잘려도 이어 붙여 파싱한다', async () => {
    const body = toStream(['data: {"x"', ':1}\n\ndata: {"x":2}', '\n\n']);
    expect(await collect(readSseData(body))).toEqual(['{"x":1}', '{"x":2}']);
  });

  it('CRLF 줄바꿈을 처리한다', async () => {
    const body = toStream(['data: {"x":1}\r\n\r\n']);
    expect(await collect(readSseData(body))).toEqual(['{"x":1}']);
  });

  it('마지막 줄에 개행이 없어도 반환한다', async () => {
    const body = toStream(['data: {"x":1}']);
    expect(await collect(readSseData(body))).toEqual(['{"x":1}']);
  });

  it('멀티바이트 문자가 청크 경계에서 잘려도 깨지지 않는다', async () => {
    const bytes = new TextEncoder().encode('data: 한글\n\n');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 7));
        controller.enqueue(bytes.slice(7));
        controller.close();
      },
    });
    expect(await collect(readSseData(body))).toEqual(['한글']);
  });
});

describe('extractAnthropicDelta', () => {
  it('content_block_delta의 text_delta 텍스트를 반환한다', () => {
    const data = JSON.stringify({
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'const A' },
    });
    expect(extractAnthropicDelta(data)).toBe('const A');
  });

  it('텍스트 델타가 아닌 이벤트는 빈 문자열을 반환한다', () => {
    expect(extractAnthropicDelta(JSON.stringify({ type: 'message_start' }))).toBe('');
  });
});

describe('extractGoogleDelta', () => {
  it('candidates의 parts 텍스트를 이어 붙여 반환한다', () => {
    const data = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'const ' }, { text: 'A' }] } }],
    });
    expect(extractGoogleDelta(data)).toBe('const A');
  });

  it('텍스트가 없는 청크는 빈 문자열을 반환한다', () => {
    expect(extractGoogleDelta(JSON.stringify({ candidates: [{}] }))).toBe('');
  });

  it('finishReason이 MAX_TOKENS이면 에러를 던진다', () => {
    const data = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'MAX_TOKENS' }],
    });
    expect(() => extractGoogleDelta(data)).toThrow('너무 길어');
  });
});
