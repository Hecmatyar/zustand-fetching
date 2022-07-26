/* eslint-disable @typescript-eslint/no-explicit-any */

export type ILoadingStatus =
  | "init"
  | "loading"
  | "loaded"
  | "waiting"
  | "progress"
  | "error";

export interface ContentLoading<Content, Payload = undefined> {
  content: Content | null;
  status: ILoadingStatus;
  error?: any;
  lastFetchTime: Date | null;
  payload?: Payload | null;
}

export const initialContentLoading = <Content, Payload>(
  value: Content | null,
  initialStatus?: ILoadingStatus
): ContentLoading<Content, Payload> => ({
  content: value,
  status: initialStatus || "loading",
  error: undefined,
  payload: undefined,
  lastFetchTime: null,
});
