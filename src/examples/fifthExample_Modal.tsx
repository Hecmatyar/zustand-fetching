import { create } from "zustand";

import { createModal, IModalCreator } from "../helpers/zustandModal";

interface IState {
  modal: IModalCreator<{ name: string }>;
}

export const useStore = create<IState>((set, get) => ({
  ...createModal(set, get, "modal", { name: "" }),
}));

const Component = () => {
  const open = useStore((state) => state.modal.open);

  return (
    <>
      <button onClick={() => open({ name: "default" })}>open modal</button>
      <Modal />
    </>
  );
};

const Modal = () => {
  const { close, atom } = useStore((state) => state.modal);

  return atom.isOpen ? (
    <>
      name: {atom.data.name}
      <button onClick={close}>close modal</button>
    </>
  ) : (
    <></>
  );
};
