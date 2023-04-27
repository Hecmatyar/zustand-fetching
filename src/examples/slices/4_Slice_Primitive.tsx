import { create } from "zustand";

import { createList, ICreateList } from "../../helpers/slices/createList";
import {
  createPrimitive,
  ICreatePrimitive,
} from "../../helpers/slices/createPrimitive";

const Component = () => {
  const { set, value } = useStore((state) => state.check);

  return (
    <>
      <label>
        <input
          type={"checkbox"}
          onChange={(event) => set({ ...value, first: event.target.checked })}
        />
        first
      </label>
      <label>
        <input
          type={"checkbox"}
          onChange={(event) => set({ ...value, second: event.target.checked })}
        />
        second
      </label>
    </>
  );
};

interface ICheckState {
  check: ICreatePrimitive<CheckList>;
  options: ICreateList<string>;
  name: string;
}

const useStore = create<ICheckState>((set, get) => ({
  ...createPrimitive(set, get, "check", initialState, {
    sideEffect: () => {
      const check = get().check.value;
      if (check.first) {
        get().options.add(["Default"]); // some side effect, call after event
      }
    },
    patchEffect: (check) => {
      // some patch effect, you can update data at the same tick
      if (check.second) return { name: "Second" };
      if (check.third) return { list: { ...get().options, list: ["Third"] } };
      else return {};
    },
  }),
  ...createList(set, get, "options", [] as string[]),
  name: "",
}));

interface CheckList {
  first: boolean;
  second: boolean;
  third: boolean;
}

const initialState: CheckList = {
  first: true,
  second: false,
  third: false,
};
