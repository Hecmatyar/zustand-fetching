import { useEffect, useState } from "react";
import { create } from "zustand";

import {
  createGroupSlice,
  ICreateGroupRequests,
  IGroupRequestParams,
} from "../../helpers/slices/createGroupSlice";
import { StatusSwitcher } from "../common";
import { useUserStore } from "./1_Slice_Request";

const User = () => {
  const content = useUserStore((state) => state.infoRequest.atom.content);

  return (
    <div>
      User name: <b>{content?.name}</b>
      {content?.schedules.map((schedule) => (
        <Schedule id={schedule} />
      ))}
    </div>
  );
};

const Schedule = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const call = useScheduleStore((state) => state.infoRequest.call);
  const atom = useScheduleStore((state) => state.infoRequest.get(id)?.atom); // you can create better selector from your store

  useEffect(() => {
    call([{ key: id, payload: id }]); // call request for user's schedule
  }, [id]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>get schedule info</button>
      {isOpen && atom ? (
        <StatusSwitcher status={atom.status} error={atom.error}>
          Name: {atom.content?.name}
          Date: {atom.content?.date}
        </StatusSwitcher>
      ) : (
        <></>
      )}
    </>
  );
};

interface IScheduleStore {
  infoRequest: ICreateGroupRequests<string, ISchedule>;
}

export const useScheduleStore = create<IScheduleStore>((set, get) => ({
  ...createGroupSlice(
    set,
    get,
    "infoRequest",
    async ({ payload, key }: IGroupRequestParams<string>) => {
      return getScheduleById(payload);
    }
  ),
}));

interface ISchedule {
  id: string;
  name: string;
  date: string;
}

const getScheduleById = async (id: string): Promise<ISchedule> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: id, name: "Name", date: new Date().toString() });
    }, 300);
  });
};