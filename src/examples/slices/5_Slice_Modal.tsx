import { create } from "zustand";

import { createModal, IModalCreator } from "../../helpers/slices/createModal";

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
      name: {atom.data.name} // this name from action call
      <button onClick={close}>close modal</button>
    </>
  ) : (
    <></>
  );
};

interface IState {
  modal: IModalCreator<{ name: string }>;
}

export const useStore = create<IState>((set, get) => ({
  ...createModal(set, get, "modal", { name: "" }),
}));