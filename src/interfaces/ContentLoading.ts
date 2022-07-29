/* eslint-disable @typescript-eslint/no-explicit-any */

export type ILoadingStatus =
  | "init"
  | "loading"
  | "loaded"
  | "waiting"
  | "progress"
  | "error";

export interface ContentLoading<T, P = undefined> {
  content: T | null;
  status: ILoadingStatus;
  error?: any;
  lastFetchTime: Date | null;
  payload?: P | null;
}

export const initialContentLoading = <T, P>(
  value: T | null,
  initialStatus?: ILoadingStatus
): ContentLoading<T, P> => ({
  content: value,
  status: initialStatus || "loading",
  error: undefined,
  payload: undefined,
  lastFetchTime: null,
});
