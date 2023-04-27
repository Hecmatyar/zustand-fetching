import { StoreApi } from "zustand";

import { createRequest, ICreateRequest, IExtraReaction } from "./createSlice";

export interface IGroupRequestParams<Payload> {
  key: string;
  payload: Payload;
}

export interface ICreateGroupRequests<Payload, Result> {
  requests: Record<
    string,
    ICreateRequest<IGroupRequestParams<Payload>, Result> | undefined
  >;
  call: (params: IGroupRequestParams<Payload>[]) => void;
  get: (
    key: string
  ) => ICreateRequest<IGroupRequestParams<Payload>, Result> | undefined;
  getContent: (key: string) => Result | undefined | null;
  clear: (key?: string) => void;
}

export const createGroupSlice = <
  Payload,
  Result,
  // eslint-disable-next-line
  State extends Record<string, any>,
  K extends keyof State
>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  payloadCreator: (params: IGroupRequestParams<Payload>) => Promise<Result>,
  extraArgument?: IExtraReaction<IGroupRequestParams<Payload>, Result>
): Record<K, ICreateGroupRequests<Payload, Result>> => {
  const clear = (key?: string) =>
    set((state) => {
      if (key) {
        const requests = { ...state[name].requests };
        delete state[name].requests[key];
        return { ...state, [name]: { ...state[name], requests } };
      } else {
        return { ...state, [name]: { ...state[name], requests: {} } };
      }
    });

  const add = (key: string) => {
    const newRequest = createRequest(
      payloadCreator,
      (atom) => {
        set((state) => {
          const currentState = state[name];
          return {
            ...state,
            [name]: {
              ...currentState,
              requests: {
                ...currentState.requests,
                [key]: { ...currentState.requests[key], atom },
              },
            },
          };
        });
      },
      () => get()[name].requests[key].atom,
      {
        initialStatus: "init",
        ...extraArgument,
      }
    );

    set((state) => {
      const currentState = state[name];
      return {
        ...state,
        [name]: {
          ...currentState,
          requests: {
            ...currentState.requests,
            [key]: newRequest,
          },
        },
      };
    });
  };

  const call = (params: IGroupRequestParams<Payload>[]) => {
    params.forEach(({ key, payload }) => {
      const request = get()[name].requests[key];
      const params = { key, payload };

      if (request) {
        request.action(params);
      } else {
        add(key);
        get()[name].requests[key].action(params);
      }
    });
  };

  const getRequest = (key?: string) => {
    return key ? get()[name].requests[key] : get()[name].requests;
  };

  const getContent = (key: string) => {
    return get()[name].requests[key]?.atom.content;
  };

  return {
    [name]: {
      clear,
      call,
      get: getRequest,
      getContent,
      requests: {} as Record<
        string,
        ICreateRequest<IGroupRequestParams<Payload>, Result>
      >,
    },
  } as Record<K, ICreateGroupRequests<Payload, Result>>;
};
