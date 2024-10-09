// https://imhoff.blog/posts/using-results-in-typescript
export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export const OK = <T>(data: T): Result<T> => ({ ok: true, value: data });
export const ERR = (err: Error): Result<any> => ({
  ok: false,
  error: err,
});

export interface Matchers<T, R1, R2> {
  ok(value: T): R1;
  err(error: Error): R2;
}

export const match =
  <T, R1, R2>(matchers: Matchers<T, R1, R2>) =>
  (result: Result<T>) =>
    result.ok === true ? matchers.ok(result.value) : matchers.err(result.error);

export const wrap =
  <T, R>(fn: (value: T) => R) =>
  (result: Result<T>): Result<R> =>
    result.ok === true ? { ok: true, value: fn(result.value) } : result;

export const encase =
  <T, A extends any[]>(fn: (...args: A) => T) =>
  (...args: A): Result<T> => {
    try {
      return { ok: true, value: fn(...args) };
    } catch (e) {
      return { ok: false, error: new Error(`${e}`) };
    }
  };
