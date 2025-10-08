declare module 'vitest' {
  export type MockFn<TArgs extends unknown[] = unknown[], TReturn = unknown> = ((
    ...args: TArgs
  ) => TReturn) & {
    mock: {
      calls: TArgs[];
    };
  };

  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void) => void;
  export const beforeEach: (fn: () => void) => void;
  export const expect: (value: unknown) => any;
  export const vi: {
    fn: <TArgs extends unknown[] = unknown[], TReturn = unknown>(
      implementation?: (...args: TArgs) => TReturn
    ) => MockFn<TArgs, TReturn>;
  };
}
