import { create } from "zustand";
import { shallow } from "zustand/shallow";

import { createList, ICreateList } from "../../helpers/slices/createList";
import { createSlice, ICreateRequest } from "../../helpers/slices/createSlice";

const User = () => {
  const [name, schedules] = useStore(
    (state) => [state.infoRequest.atom.content?.name, state.schedules],
    shallow
  );

  const handleAddSchedule = () => {
    schedules.add([{ name: "New Schedule" }]);
  };

  return (
    <div>
      User name: <b>{name}</b>
      {schedules.list.map((schedule) => (
        <Schedule schedule={schedule} />
      ))}
      <button onClick={handleAddSchedule}>add new</button>
    </div>
  );
};

interface IUserState {
  infoRequest: ICreateRequest<string, IUser>;
  schedules: ICreateList<ISchedule>;
  // or like this
  // schedules: ICreateNormalizedList<ISchedule>;
}

export const useStore = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "infoRequest", async (id: string) => {
    return getUserById(id);
  }),
  ...createList(set, get, "schedules", [] as ISchedule[], {
    compare: (a, b) => a.id === b.id,
  }),
}));

const Schedule = ({ schedule }: { schedule: ISchedule }) => {
  const { remove, update } = useStore((state) => state.schedules);

  const handleInput = (name: string) => {
    update({ ...schedule, name });
  };

  return (
    <>
      <button onClick={() => remove([schedule])}>remove</button>
      <input
        defaultValue={schedule.name}
        onChange={(e) => handleInput(e.target.value)}
      />
      <button onClick={() => remove([schedule])}>change name</button>
    </>
  );
};

interface IUser {
  id: string;
  name: string;
  role?: string;
}

interface ISchedule {
  id?: string;
  name: string;
  date?: string;
}

const getUserById = async (id: string): Promise<IUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: id, name: "First Second" });
    }, 300);
  });
};
