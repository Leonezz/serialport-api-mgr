export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const OK = <T>(data: T): Result<T> => ({ ok: true, value: data });
export const ERR = (err: Error): Result<any> => ({
  ok: false,
  error: err,
});

export interface Matchers<T, E extends Error, R1, R2> {
  ok(value: T): R1;
  err(error: E): R2;
}

export const match =
  <T, E extends Error, R1, R2>(matchers: Matchers<T, E, R1, R2>) =>
  (result: Result<T, E>) =>
    result.ok === true ? matchers.ok(result.value) : matchers.err(result.error);
