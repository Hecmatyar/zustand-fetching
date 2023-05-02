import { produce } from "immer";
import { create } from "zustand";

export type LeitenModalState = {
  open: boolean;
  hidden: boolean;
};

export interface LeitenModalManagerState {
  modals: Record<string, LeitenModalState>;
  queue: string[];
  readonly action: (key: string, value: boolean, queue?: boolean) => void;
}

export const useLeitenModalManager = create<LeitenModalManagerState>(
  (set, get) => ({
    modals: {},
    queue: [],
    action: (key, value, replace) => {
      const nextState = produce(get(), (draft) => {
        draft.modals[key] = { open: value, hidden: false };
        let queue = draft.queue.filter((modal) => modal !== key);

        if (!replace) {
          queue.forEach((item) => {
            draft.modals[item].hidden = true;
          });
        } else {
          queue.forEach((item) => {
            draft.modals[item].hidden = false;
            draft.modals[item].open = false;
          });
          queue = [];
        }

        if (value) {
          queue.push(key);
        }

        const last = queue[queue.length - 1];
        if (last) {
          draft.modals[last].open = true;
          draft.modals[last].hidden = false;
        }
        draft.queue = queue;
      });
      set(nextState);
    },
  })
);
