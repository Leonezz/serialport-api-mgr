
export const executeUserScript = (code: string, context: Record<string, any>) => {
    try {
        const keys = Object.keys(context);
        const values = Object.values(context);
        const func = new Function(...keys, code);
        return func(...values);
    } catch (e: any) {
        throw new Error(`Script Error: ${e.message}`);
    }
};
