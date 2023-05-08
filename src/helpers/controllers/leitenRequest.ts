import { produce } from "immer";
import { get, isEqual, set } from "lodash-es";
import { nanoid } from "nanoid";
import { StoreApi } from "zustand";
import { shallow } from "zustand/shallow";

import { DotNestedKeys, DotNestedValue } from "../../interfaces/dotNestedKeys";
import {
  ILeitenLoading,
  ILoadingStatus,
  initialLeitenLoading,
} from "../../interfaces/IContentLoading";
import { createAsyncActions, IExtraArgument } from "../slices";
import { useLeitenRequests } from "./hooks/useLeitenRequest";

type UseRequestType<Payload, Result> = <U = ILeitenLoading<Result, Payload>>(
  selector?: (state: ILeitenLoading<Result, Payload>) => U,
  equals?: (a: U, b: U) => boolean
) => U;

export interface ILeitenRequest<Payload, Result>
  extends UseRequestType<Payload, Result> {
  abort: () => void;
  clear: () => void;
  action: (
    params: Payload,
    extraParams?: { status?: ILoadingStatus; requestId?: string }
  ) => void;
  set: (value: Partial<Result> | void, rewrite?: boolean) => void;
  key: string;
}

export interface ILeitenRequestOptions<Payload, Result> {
  fulfilled?: (result: Result, params: Payload, requestId?: string) => void;
  rejected?: (params: Payload, error: any) => void;
  abort?: (params: Payload) => void;
  resolved?: (params: Payload) => void;
  action?: (
    params: Payload,
    extraParams?: { status?: ILoadingStatus; requestId?: string }
  ) => void;
  initialStatus?: ILoadingStatus;
  optimisticUpdate?: (params: Payload) => Result;
}

export const leitenRequest = <
  Store extends object,
  P extends DotNestedKeys<Store>,
  Payload,
  Result
>(
  store: StoreApi<Store>,
  path: P extends string
    ? Result extends void
      ? P
      : DotNestedValue<Store, P> extends Result | null
      ? P
      : never
    : never,
  payloadCreator: (
    params: Payload,
    extraArgument?: IExtraArgument
  ) => Promise<Result>,
  options?: ILeitenRequestOptions<Payload, Result>
): ILeitenRequest<Payload, Result> => {
  const key = nanoid(12);
  const initialContent: Result = get(store.getState(), path, null) as Result;
  const initialState = initialLeitenLoading<Payload, Result>(
    options?.initialStatus
  );

  const setState = (state: ILeitenLoading<Payload, Result>) => {
    useLeitenRequests.setState({ [key]: state });
  };
  setState(initialState); //init request

  const setContent = (content: Result) => {
    const nextState = produce(store.getState(), (draft) => {
      set(draft, path, content);
    });
    store.setState(nextState);
  };

  const getState = (): ILeitenLoading<Payload, Result> => {
    return useLeitenRequests.getState()[key] || initialState;
  };

  const getContent = (): Result => {
    const result = get(store.getState(), path, "_empty") as Result | "_empty";
    if (result !== "_empty") {
      return result || initialContent;
    } else {
      return initialContent;
    }
  };

  const _set = (value: Partial<Result> | void, rewrite = false) => {
    if (typeof value === "object") {
      const state = getContent();
      const objectContent = rewrite
        ? ({ ...value } as Result)
        : ({ ...state, ...value } as Result);
      const content = typeof value === "object" ? objectContent : value;
      setContent(content);
    }
  };

  let prevContent: Result = getContent();

  const reactions = {
    actionReaction: (
      params: Payload,
      extraParams?: { status?: ILoadingStatus; requestId?: string }
    ) => {
      setState({
        status: extraParams?.status ?? "loading",
        payload: params,
        error: undefined,
        requestId: extraParams?.requestId,
      });
      options?.action?.(params);
      prevContent = getContent();

      if (options?.optimisticUpdate) {
        setContent(options.optimisticUpdate(params));
      }
    },
    fulfilledReaction: (
      content: Result,
      params: Payload,
      requestId?: string
    ) => {
      const state = getState();
      if (requestId === state.requestId) {
        // unstable_batchedUpdates(() => {
        setState({ ...state, status: "loaded" });
        if (
          content !== undefined &&
          (!options?.optimisticUpdate || !isEqual(prevContent, content))
        ) {
          setContent(content);
        }
        // });
        options?.fulfilled?.(content, params);
      }
    },
    rejectedReaction: (params: Payload, error: any) => {
      const state = getState();
      setState({ ...state, status: "error", error });
      options?.rejected?.(params, error);
      if (options?.optimisticUpdate) {
        setContent(prevContent);
      }
    },
    abortReaction: (params: Payload) => {
      setState(initialState);
      options?.abort?.(params);
      if (options?.optimisticUpdate) {
        setContent(prevContent);
      }
    },
    resolvedReaction: (params: Payload) => {
      options?.resolved?.(params);
    },
  };

  const { action, abort } = createAsyncActions(payloadCreator, reactions);

  const _abort = () => {
    abort();
  };

  const clear = () => {
    // unstable_batchedUpdates(() => {
    setState(initialState);
    setContent(initialContent);
    // })
  };

  const useRequest: UseRequestType<Payload, Result> = (selector, equals) => {
    return useLeitenRequests(
      (state) => (selector || nonTypedReturn)(state[key] || initialState),
      shallow || equals
    );
  };

  const resettable =
    (store.getState() as any)["_resettableLifeCycle"] !== undefined;
  if (resettable) {
    store.subscribe((next) => {
      if ((next as any)["_resettableLifeCycle"] === false) clear();
    });
  }

  return Object.assign(useRequest, {
    abort: _abort,
    action,
    clear,
    set: _set,
    key,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nonTypedReturn = (value: any) => value;
