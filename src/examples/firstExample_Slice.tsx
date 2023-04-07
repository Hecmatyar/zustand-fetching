import { useEffect } from "react";
import { create } from "zustand";

import { createSlice, ICreateRequest } from "../helpers/zustandSlice";
import { StatusSwitcher } from "./common";

// Main component
export const User = ({ id }: { id: string }) => {
  const { name, status, error } = useUserStore(dataSelector);
  const getData = useUserStore((state) => state.infoRequest.action);

  useEffect(() => {
    getData(id); // call request using id param
  }, [getData, id]);

  return (
    <div>
      <StatusSwitcher status={status} error={error}>
        User name: <b>{name}</b> // we will see it when loading will be done
      </StatusSwitcher>
    </div>
  );
};

interface IUserState {
  infoRequest: ICreateRequest<string, IUser>;
}

export const useUserStore = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "infoRequest", async (id: string) => {
    const result = await getUserById(id);
    return { ...result, role: "artist" }; // you can update your data after request
  }),
}));

const dataSelector = (state: IUserState) => ({
  name: state.infoRequest.atom.content?.name,
  status: state.infoRequest.atom.status,
  error: state.infoRequest.atom.error || "some error",
});

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
