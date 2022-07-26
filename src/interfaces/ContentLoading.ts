import { IFetchError } from "./FetchError";

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
  error?: string | null;
  fetchError?: IFetchError<T>;
  payload?: P | null;
}

export const initialContentLoading = <T, P>(
  value: T | null,
  initialStatus?: ILoadingStatus
): ContentLoading<T, P> => ({
  content: value,
  status: initialStatus || "loading",
  error: undefined,
  fetchError: undefined,
  payload: undefined,
});
