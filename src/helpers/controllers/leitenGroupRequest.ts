import { produce } from "immer";
import { set } from "lodash-es";
import { StoreApi } from "zustand/esm";
import { shallow } from "zustand/shallow";

import { DotNestedKeys, DotNestedValue } from "../../interfaces/dotNestedKeys";
import {
  ILeitenLoading,
  ILoadingStatus,
  initialLeitenLoading,
} from "../../interfaces/IContentLoading";
import { useLeitenRequests } from "./hooks/useLeitenRequest";
import {
  ILeitenRequest,
  ILeitenRequestOptions,
  leitenRequest,
} from "./leitenRequest";

export interface ILeitenGroupRequestParams<Params> {
  key: string;
  params: Params;
}

interface ICallOptions {
  status?: ILoadingStatus;
  requestId?: string;
}

type LeitenState<Payload, Result> = ILeitenLoading<
  ILeitenGroupRequestParams<Payload>,
  Result
>;

type UseRequestType<Payload, Result> = <U = LeitenState<Payload, Result>>(
  key: string,
  selector?: (state: LeitenState<Payload, Result>) => U,
  equals?: (a: U, b: U) => boolean
) => U;

type UseGroupRequestType<Payload, Result> = <U = LeitenState<Payload, Result>>(
  selector?: (state: Record<string, LeitenState<Payload, Result>>) => U,
  equals?: (a: U, b: U) => boolean
) => U;

export type ILeitenGroupRequest<Payload, Result> = {
  clear: (key?: string) => void;
  call: (
    params: ILeitenGroupRequestParams<Payload>[],
    options?: ICallOptions
  ) => void;
  requests: Record<
    string,
    ILeitenRequest<ILeitenGroupRequestParams<Payload>, Result>
  >;
} & UseRequestType<Payload, Result> &
  UseGroupRequestType<Payload, Result>;

interface ILeitenGroupRequestOption<Payload, Result>
  extends ILeitenRequestOptions<ILeitenGroupRequestParams<Payload>, Result> {
  initialContent?: Result;
}

export const leitenGroupRequest = <
  Store extends object,
  P extends DotNestedKeys<Store>,
  Payload,
  Result
>(
  store: StoreApi<Store>,
  path: P extends string
    ? DotNestedValue<Store, P> extends Record<string, Result> | null
      ? P
      : never
    : never,
  payloadCreator: (
    params: ILeitenGroupRequestParams<Payload>
  ) => Promise<Result>,
  options?: ILeitenGroupRequestOption<Payload, Result>
): ILeitenGroupRequest<Payload, Result> => {
  const initialRequestState = initialLeitenLoading<
    ILeitenGroupRequestParams<Payload>,
    Result
  >(options?.initialStatus);
  let requests: Record<
    string,
    ILeitenRequest<ILeitenGroupRequestParams<Payload>, Result>
  > = {};

  const add = (key: string) => {
    const state = requests[key];
    if (!state) {
      const pathWithKey = (path + `.["${key}"]`) as DotNestedKeys<Store>;
      const nextState = produce(store.getState(), (draft) => {
        set(draft, pathWithKey, options?.initialContent ?? null);
      });
      store.setState(nextState);
      requests[key] = leitenRequest(
        store,
        pathWithKey,
        payloadCreator,
        options
      );
    } else {
      requests[key].clear();
    }
  };

  const call = (
    params: ILeitenGroupRequestParams<Payload>[],
    options?: ICallOptions
  ) => {
    params.forEach(({ key, params }) => {
      const request = requests[key];
      const payload = { key, params };

      if (request) {
        request.action(payload, options);
      } else {
        add(key);
        requests[key].action(payload);
      }
    });
  };

  const clear = (key?: string) => {
    if (key) {
      requests[key].clear();
      delete requests[key];
    } else {
      set(store, path, {});
      requests = {};
    }
  };

  const useRequest: UseRequestType<Payload, Result> = (
    key,
    selector,
    equals
  ) => {
    return useLeitenRequests((state) => {
      const id = requests[key]?.key;
      return (selector || nonTypedReturn)(
        (id && state[id]) || initialRequestState
      );
    }, shallow || equals);
  };

  const useGroupRequest: UseGroupRequestType<Payload, Result> = (
    selector,
    equals
  ) => {
    return useLeitenRequests(
      (state: Record<string, LeitenState<Payload, Result>>) => {
        const keys = Object.entries(requests).map(([id, value]) => ({
          id,
          key: value.key,
        }));
        const requestsStore: typeof state = keys.reduce((acc, { id, key }) => {
          return Object.assign(acc, { [id]: state[key] });
        }, {} as typeof state);

        return (selector || nonTypedReturn)(requestsStore);
      },
      shallow || equals
    );
  };

  function hook<Payload, Result, U = LeitenState<Payload, Result>>(
    key: string,
    selector?: (state: LeitenState<Payload, Result>) => U,
    equals?: (a: U, b: U) => boolean
  ): U;
  function hook<Payload, Result, U = LeitenState<Payload, Result>>(
    selector?: (state: Record<string, LeitenState<Payload, Result>>) => U,
    equals?: (a: U, b: U) => boolean
  ): U;
  function hook<Payload, Result, U = LeitenState<Payload, Result>>(
    first?:
      | string
      | ((state: Record<string, LeitenState<Payload, Result>>) => U),
    second?:
      | ((state: LeitenState<Payload, Result>) => U)
      | ((a: U, b: U) => boolean),
    third?: (a: U, b: U) => boolean
  ): U {
    if (first !== undefined && typeof first === "string") {
      return useRequest(first, second as any, third);
    } else {
      return useGroupRequest(first as any, second as any) as any;
    }
  }

  const resettable =
    (store.getState() as any)["_resettableLifeCycle"] !== undefined;
  if (resettable) {
    store.subscribe((next) => {
      if ((next as any)["_resettableLifeCycle"] === false) clear();
    });
  }

  return Object.assign(hook, { clear, call, requests });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nonTypedReturn = (value: any) => value;
