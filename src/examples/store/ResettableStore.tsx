import React from "react";

import { createResettable } from "../../helpers/resettableStore";

interface StoreExample {
  products: string[];
  setProducts: (value: string[]) => void;
}

const [useStore, StoreProvider] = createResettable<StoreExample>((set) => ({
  products: [],
  setProducts: (myProducts) =>
    set((state) => ({ ...state, products: myProducts })),
}));

const ResettableComponent = () => {
  const { products, setProducts } = useStore();

  const handleSet = () => {
    setProducts(["a", "b", "c", "d", "e"]);
  };

  return (
    <>
      <ul>
        {products.map((product) => (
          <li key={product}>{product}</li>
        ))}
      </ul>
      <button onClick={handleSet}>Set Products</button>
    </>
  );
};

const Page = () => {
  return (
    <StoreProvider>
      <ResettableComponent />
    </StoreProvider>
  );
};
