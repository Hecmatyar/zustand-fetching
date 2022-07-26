/* eslint-disable @typescript-eslint/no-explicit-any */

export type StateFromFunctions<T extends [...any]> = T extends [
  infer F,
  ...infer R
]
  ? F extends (...args: any) => object
    ? StateFromFunctions<R> & ReturnType<F>
    : unknown
  : unknown;
