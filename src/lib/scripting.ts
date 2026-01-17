export const executeUserScript = (
  code: string,
  context: Record<string, unknown>,
) => {
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    const func = new Function(...keys, code);
    return func(...values);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Script Error: ${message}`);
  }
};
