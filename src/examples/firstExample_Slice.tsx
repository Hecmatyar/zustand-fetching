import { useEffect } from "react";
import { create } from "zustand";

import { createSlice, ICreateRequest } from "../helpers/zustandSlice";
import { StatusSwitcher } from "./common";

interface IUserState {
  infoRequest: ICreateRequest<string, IUser>;
}

export const useUserStore = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "infoRequest", async (id: string) => {
    const result = await getUserById(id);
    return { ...result, role: "artist" };
  }),
}));

// Main component
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useUserStore((state) => state.infoRequest);

  useEffect(() => {
    action(id); // call request using id param
  }, [action, id]);

  return (
    <div>
      <StatusSwitcher status={atom.status} error={atom.error.message}>
        User name: <b>{atom.content?.name}</b> // we will see it when loading
        will be done
      </StatusSwitcher>
    </div>
  );
};

interface IUser {
  id: string;
  name: string;
  role?: string;
  schedules: string[];
}

const getUserById = async (id: string): Promise<IUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: id, name: "First Second", schedules: ["1", "2", "3"] });
    }, 300);
  });
};
