// Define the store
import { createContextStore } from "../../helpers/contextStore";
import { leitenPrimitive } from "../../helpers/controllers";

export const [useCounterStore, CounterStoreProvider, useControllers] =
  createContextStore(
    () => ({
      count: 0,
    }),
    (store) => ({ store, countController: leitenPrimitive(store, "count") })
  );

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
  const count = useCounterStore(({ count }) => count);
  return <h1>Count: {count}</h1>;
};

const CounterControls = () => {
  const increment = useControllers(({ countController, store }) => () => {
    countController.set(store.getState().count + 1);
  });
  const decrement = useControllers(({ countController, store }) => () => {
    countController.set(store.getState().count - 1);
  });

  return (
    <div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};
