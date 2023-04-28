/**
 * Creates a React context store using the Zustand library.
 *
 * @template STATE The type of the state that will be managed by the store.
 * @param {StateCreator<STATE>} state A function that creates and returns the initial state of the store.
 * @returns {[useZustandStore, StoreProvider]} An array containing the `useZustandStore` hook and the `StoreProvider` component.
 *
 * @example
 */
import { createContextStore } from "../../helpers/contextStore";

// Define the store
export const [useCounterStore, CounterStoreProvider] =
  createContextStore<number>(() => 0);

// Wrap a component with the store provider
const CounterComponent = () => {
  return (
    <CounterStoreProvider>
      <CounterDisplay />
      <CounterControls />
    </CounterStoreProvider>
  );
};

// Consume the store
const CounterDisplay = () => {
  const count = useCounterStore((state) => state);
  return <h1>Count: {count}</h1>;
};

const CounterControls = () => {
  const increment = useCounterStore((state) => () => state + 1);
  const decrement = useCounterStore((state) => () => state - 1);

  return (
    <div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};
