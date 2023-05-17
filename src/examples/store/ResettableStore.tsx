import React from "react";
import { create } from "zustand";

import { makeResettable } from "../../store/resettableStore";

interface StoreExample {
  products: string[];
  setProducts: (value: string[]) => void;
}

const useStore = create<StoreExample>((set) => ({
  products: [],
  setProducts: (myProducts) =>
    set((state) => ({ ...state, products: myProducts })),
}));

const ResetStoreProvider = makeResettable(useStore);

export const ResettablePage = () => {
  const { products, setProducts } = useStore();

  const handleSet = () => {
    setProducts(["1", "2", "3", "4", "5"]);
  };

  return (
    <ResetStoreProvider>
      <>
        <ul>
          {products.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
        <button onClick={handleSet}>Set Products</button>
      </>
    </ResetStoreProvider>
  );
};
