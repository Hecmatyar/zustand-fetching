import type { StoreApi } from "zustand";

type Data<ITEM> = Record<string | number, ITEM>;

export type ICreateNormalizedList<ITEM> = {
  list: Data<ITEM>;
  set: (items: ITEM[]) => void;
  add: (items: ITEM[]) => void;
  addOne: (item: ITEM) => void;
  removeByKeys: (keys: (string | number)[]) => void;
  removeOneByKey: (key: string | number) => void;
  toggleOne: (item: ITEM) => void;
  filter: (validate: (item: ITEM) => boolean) => void;
  clear: () => void;
};

export const normalizedListStoreCreator = <ITEM>(
  set: (v: Data<ITEM>) => void,
  get: () => Data<ITEM>,
  initialState: Data<ITEM>,
  params: {
    getKey: (item: ITEM) => string | number;
  }
): ICreateNormalizedList<ITEM> => {
  const getMap = (items: ITEM[]) => {
    return items.reduce<Data<ITEM>>((acc, val) => {
      const key = params?.getKey(val);

      acc[key] = val;

      return acc;
    }, {});
  };

  const _set = (items: ITEM[]) => {
    set(getMap(items));
  };

  const add = (items: ITEM[]) => {
    set({ ...get(), ...getMap(items) });
  };

  const addOne = (item: ITEM) => {
    set({ ...get(), ...getMap([item]) });
  };

  const removeByKeys = (removeKeys: (string | number)[]) => {
    const acc: Data<ITEM> = {};

    for (const [key, item] of Object.entries(get())) {
      if (!removeKeys.includes(key)) {
        acc[key] = item;
      }
    }

    set(acc);
  };

  const removeOneByKey = (key: string | number) => {
    removeByKeys([key]);
  };

  const toggleOne = (item: ITEM) => {
    const key = params.getKey(item);
    const isChecked = key in get();

    if (isChecked) {
      removeOneByKey(key);
    } else {
      addOne(item);
    }
  };

  const filter = (validate: (item: ITEM) => boolean) => {
    set(
      Object.fromEntries(
        Object.entries(get()).filter(([_, item]) => validate(item))
      )
    );
  };

  const clear = () => {
    set({});
  };

  return {
    list: initialState,
    set: _set,
    removeByKeys: removeByKeys,
    add,
    removeOneByKey: removeOneByKey,
    addOne,
    clear,
    toggleOne: toggleOne,
    filter,
  };
};

export const createNormalizedList = <
  ITEM,
  State extends Record<string, any>,
  K extends keyof State
>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  initialState: Data<ITEM>,
  params: {
    patchEffect?: () => Partial<State>;
    sideEffect?: () => void;
    getKey: (item: ITEM) => string | number;
  }
) => {
  return {
    [name]: normalizedListStoreCreator<ITEM>(
      (list) => {
        set((state) => {
          return {
            ...state,
            ...params.patchEffect?.(),
            [name]: { ...state[name], list },
          };
        });
        params.sideEffect?.();
      },
      () => (get()[name] as ICreateNormalizedList<ITEM>).list,
      initialState,
      params
    ),
  } as Record<K, ICreateNormalizedList<ITEM>>;
};
