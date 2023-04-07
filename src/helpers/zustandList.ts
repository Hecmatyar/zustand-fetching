import type { StoreApi } from "zustand";

export type ICreateList<ITEM> = {
  list: ITEM[];
  set: (items: ITEM[]) => void;
  add: (items: ITEM[]) => void;
  remove: (items: ITEM[]) => void;
  toggle: (item: ITEM) => void;
  update: (item: ITEM) => void;
  clear: () => void;
  filter: (validate: (item: ITEM) => boolean) => void;
};

const defaultCompare = <ITEM>(left: ITEM, right: ITEM): boolean =>
  left === right;

const listStoreCreator = <ITEM>(
  set: (v: ITEM[]) => void,
  get: () => ITEM[],
  initialState: ITEM[],
  params?: {
    processingBeforeSet?: (items: ITEM[]) => ITEM[];
    compare?: (left: ITEM, right: ITEM) => boolean;
  }
): ICreateList<ITEM> => {
  const compare = params?.compare || defaultCompare;

  const _set = (items: ITEM[]) => {
    set(
      params?.processingBeforeSet ? params.processingBeforeSet(items) : items
    );
  };

  const add = (items: ITEM[]) => {
    const values = items.filter((existing) =>
      get().every((item) => !compare(existing, item))
    );
    _set([...get(), ...values]);
  };

  const remove = (remove: ITEM[]) => {
    _set(
      get().filter(
        (item) => !remove.find((removeItem) => compare(item, removeItem))
      )
    );
  };

  const update = (item: ITEM) => {
    _set(get().map((existing) => (compare(existing, item) ? item : existing)));
  };

  const toggle = (item: ITEM) => {
    const exist = !!get().find((_item) => compare(item, _item));

    if (exist) {
      remove([item]);
    } else {
      add([item]);
    }
  };

  const filter = (validate: (item: ITEM) => boolean) => {
    set(get().filter(validate));
  };

  const clear = () => {
    set([]);
  };

  return {
    list: initialState,
    set: _set,
    remove,
    add,
    clear,
    toggle,
    update,
    filter,
  };
};

export const createList = <ITEM, State, K extends keyof State>(
  set: StoreApi<State>["setState"],
  get: StoreApi<State>["getState"],
  name: K,
  initialState: ITEM[],
  params?: {
    processingBeforeSet?: (items: ITEM[]) => ITEM[];
    compare?: (left: ITEM, right: ITEM) => boolean;
    sideEffect?: () => void;
    patchEffect?: (items: ITEM[]) => Partial<State>;
  }
): Record<K, ICreateList<ITEM>> => {
  return {
    [name]: listStoreCreator<ITEM>(
      (list) => {
        set((state) => {
          return {
            ...params?.patchEffect?.(list),
            [name]: { ...state[name], list },
          };
        });
        params?.sideEffect?.();
      },
      () => (get()[name] as ICreateList<ITEM>).list,
      initialState,
      params
    ),
  } as Record<K, ICreateList<ITEM>>;
};
