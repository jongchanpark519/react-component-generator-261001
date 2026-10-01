import { describe, it, expect } from 'vitest';
import { cleanStreamingCode } from './streamingCode';

describe('cleanStreamingCode', () => {
  it('앞쪽 코드펜스 줄을 제거한다', () => {
    expect(cleanStreamingCode('```jsx\nconst A = 1;')).toBe('const A = 1;');
  });

  it('언어 표시 없는 코드펜스도 제거한다', () => {
    expect(cleanStreamingCode('```\nconst A = 1;')).toBe('const A = 1;');
  });

  it('아직 도착하지 않은 펜스 줄(```js)만 있으면 빈 문자열이다', () => {
    expect(cleanStreamingCode('```js')).toBe('');
  });

  it('끝쪽 닫는 코드펜스를 제거한다', () => {
    expect(cleanStreamingCode('const A = 1;\n```')).toBe('const A = 1;');
  });

  it('펜스가 없으면 그대로 둔다', () => {
    expect(cleanStreamingCode('const A = 1;')).toBe('const A = 1;');
  });
});
