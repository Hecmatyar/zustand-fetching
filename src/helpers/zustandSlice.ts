/* eslint-disable @typescript-eslint/no-explicit-any */

import { StoreApi } from "zustand";

import {
  ContentLoading,
  ILoadingStatus,
  initialContentLoading,
} from "../interfaces/ContentLoading";

export type ICreateRequest<Payload, Result> = {
  abort: () => void;
  clear: () => void;
  action: (params: Payload) => void;
  atom: ContentLoading<Result, Payload>;
  setAtom: (value: Partial<Result>, replace?: boolean) => void;
};

export const createRequest = <Payload, Result>(
  payloadCreator: (
    params: Payload,
    extraArgument?: IExtraArgument
  ) => Promise<Result>,
  set: (value: ContentLoading<Result, Payload>) => void,
  get: () => ContentLoading<Result, Payload>,
  extra?: IExtraReaction<Payload, Result>
): ICreateRequest<Payload, Result> => {
  const initialState = initialContentLoading<Result, Payload>(
    extra?.initialContent || null,
    extra?.initialStatus
  );

  const reactions = {
    actionReaction: (params: Payload) => {
      const state = get();
      set({
        ...state,
        content: extra?.contentReducers?.pending
          ? extra.contentReducers.pending(params)
          : state.content,
        status: "loading",
        payload: params,
      });
    },
    fulfilledReaction: (content: Result, params: Payload) => {
      const state = get();
      set({
        ...state,
        content: extra?.contentReducers?.fulfilled
          ? extra.contentReducers.fulfilled(content, params)
          : content,
        status: "loaded",
        lastFetchTime: new Date(),
      });
      extra?.fulfilledReaction?.(content, params);
    },
    rejectedReaction: (params: Payload, error?: any) => {
      const state = get();
      set({
        ...state,
        content: extra?.contentReducers?.rejected
          ? extra.contentReducers?.rejected(params, error)
          : state.content,
        status: "error",
        error,
      });
      extra?.rejectedReaction?.(params, error);
    },
    abortReaction: (params: Payload) => {
      const state = get();
      set({
        ...state,
        content: extra?.contentReducers?.aborted
          ? extra.contentReducers.aborted(params)
          : null,
        status: extra?.initialStatus || "loading",
        error: undefined,
      });
      extra?.abortReaction?.(params);
    },
    resolvedReaction: (params: Payload) => {
      extra?.resolvedReaction?.(params);
    },
  };

  const { action, abort } = createAsyncActions(payloadCreator, reactions);

  const abortAction = () => {
    abort();
    set(initialState);
  };

  const clear = () => {
    set(initialState);
  };

  const setAtom = (value: Partial<Result>, replace = true) => {
    const state = get();

    const objectContent = replace
      ? ({ ...value } as Result)
      : ({ ...state.content, ...value } as Result);

    const content = typeof value === "object" ? objectContent : value;
    set({ ...state, content });
  };

  return { abort: abortAction, action, atom: initialState, clear, setAtom };
};

export type IExtraArgument = {
  signal: AbortSignal;
  // requestId: string
};

interface IReaction<Payload, Result> {
  fulfilledReaction?: (result: Result, params: Payload) => void;
  rejectedReaction?: (params: Payload, error?: any) => void;
  abortReaction?: (params: Payload) => void;
  resolvedReaction?: (params: Payload) => void;
  actionReaction?: (params: Payload) => void;
}

export type IExtraReaction<Payload, Result> = {
  initialStatus?: ILoadingStatus;
  initialContent?: Result;
  contentReducers?: {
    pending?: (params: Payload) => Result | null;
    fulfilled?: (content: Result, params: Payload) => Result | null;
    rejected?: (params: Payload, error?: any) => Result | null;
    aborted?: (params: Payload) => Result | null;
  };
} & IReaction<Payload, Result>;

export function createAsyncActions<Payload, Result>(
  payloadCreator: (
    params: Payload,
    extraArgument?: IExtraArgument
  ) => Promise<Result>,
  extra?: IReaction<Payload, Result>
) {
  let controller = new AbortController();
  let signal = controller.signal;

  const abort = () => {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
  };

  const action = (params: Payload) => {
    extra?.actionReaction?.(params);
    payloadCreator(params, { signal })
      .then((result) => {
        extra?.fulfilledReaction?.(result, params);
      })
      .catch((error) => {
        if (error.message === "The user aborted a request.") {
          extra?.abortReaction?.(params);
        } else if (error instanceof Error) {
          extra?.rejectedReaction?.(params, error);
        } else {
          extra?.rejectedReaction?.(params, "Unknown Failure");
        }
      })
      .finally(() => {
        if (extra?.resolvedReaction) {
          extra?.resolvedReaction?.(params);
        }
      });
  };
  return { action, abort };
}

export const createSlice = <
  State extends Record<string, any>,
  Payload,
  Result,
  K extends keyof State
>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  payloadCreator: (
    params: Payload,
    extraArgument?: IExtraArgument
  ) => Promise<Result>,
  extra?: IExtraReaction<Payload, Result>
): Record<K, ICreateRequest<Payload, Result>> => {
  return {
    [name]: createRequest(
      payloadCreator,
      (atom) => {
        set((state) => {
          return { [name]: { ...state[name], atom } } as Partial<State>;
        });
      },
      () => get()[name].atom,
      extra
    ),
  } as Record<K, ICreateRequest<Payload, Result>>;
};
