import {
  getQuickJS,
  shouldInterruptAfterDeadline,
  isFail,
} from "quickjs-emscripten";
import type { QuickJSContext, QuickJSHandle } from "quickjs-emscripten";

let quickJSPromise: ReturnType<typeof getQuickJS> | null = null;

async function getQuickJSInstance() {
  if (!quickJSPromise) {
    quickJSPromise = getQuickJS();
  }
  return quickJSPromise;
}

interface ScriptOptions {
  timeout?: number;
  maxStackSize?: number;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_STACK_SIZE = 1024 * 640; // 640KB

/**
 * Convert a JavaScript value to a QuickJS handle
 */
function jsToQuickJS(vm: QuickJSContext, value: unknown): QuickJSHandle {
  if (value === null) {
    return vm.null;
  }
  if (value === undefined) {
    return vm.undefined;
  }
  if (typeof value === "number") {
    return vm.newNumber(value);
  }
  if (typeof value === "string") {
    return vm.newString(value);
  }
  if (typeof value === "boolean") {
    return value ? vm.true : vm.false;
  }
  if (value instanceof Uint8Array) {
    // Convert Uint8Array to array of numbers
    const arr = vm.newArray();
    for (let i = 0; i < value.length; i++) {
      const numHandle = vm.newNumber(value[i]);
      vm.setProp(arr, i, numHandle);
      numHandle.dispose();
    }
    return arr;
  }
  if (Array.isArray(value)) {
    const arr = vm.newArray();
    for (let i = 0; i < value.length; i++) {
      const itemHandle = jsToQuickJS(vm, value[i]);
      vm.setProp(arr, i, itemHandle);
      itemHandle.dispose();
    }
    return arr;
  }
  if (typeof value === "object") {
    const obj = vm.newObject();
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const propHandle = jsToQuickJS(vm, val);
      vm.setProp(obj, key, propHandle);
      propHandle.dispose();
    }
    return obj;
  }
  return vm.undefined;
}

/**
 * Execute user script in a sandboxed QuickJS environment
 *
 * @param code - JavaScript code to execute (should include 'return' for result)
 * @param context - Context object available as 'context' in the script
 * @param options - Execution options (timeout, stack size)
 * @returns The script's return value
 * @throws Error if script fails, times out, or has security violations
 */
export async function executeSandboxedScript(
  code: string,
  context: Record<string, unknown>,
  options: ScriptOptions = {},
): Promise<unknown> {
  const QuickJS = await getQuickJSInstance();
  const vm = QuickJS.newContext();

  try {
    // Set resource limits
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const deadline = Date.now() + timeout;
    vm.runtime.setMaxStackSize(options.maxStackSize ?? DEFAULT_STACK_SIZE);
    vm.runtime.setInterruptHandler(shouldInterruptAfterDeadline(deadline));

    // Expose each context property as a top-level variable (for backward compatibility)
    // The original new Function() implementation did: new Function(...keys, code)(...values)
    // which made each key available as a variable in the script
    for (const [key, value] of Object.entries(context)) {
      const handle = jsToQuickJS(vm, value);
      vm.setProp(vm.global, key, handle);
      handle.dispose();
    }

    // Also expose the full context object for scripts that prefer context.xxx syntax
    const contextHandle = jsToQuickJS(vm, context);
    vm.setProp(vm.global, "context", contextHandle);
    contextHandle.dispose();

    // Wrap code in function to handle return
    const wrappedCode = `(function() { ${code} })()`;

    // Execute script
    const result = vm.evalCode(wrappedCode);

    if (isFail(result)) {
      const errorValue = vm.dump(result.error);
      result.error.dispose();
      throw new Error(
        typeof errorValue === "string"
          ? errorValue
          : (errorValue?.message ?? "Script execution failed"),
      );
    }

    const output = vm.dump(result.value);
    result.value.dispose();
    return output;
  } finally {
    vm.dispose();
  }
}

/**
 * Legacy compatibility wrapper - makes the function sync-looking but still async
 * @deprecated Use executeSandboxedScript directly
 */
export const executeUserScript = async (
  code: string,
  context: Record<string, unknown>,
): Promise<unknown> => {
  return executeSandboxedScript(code, context);
};
