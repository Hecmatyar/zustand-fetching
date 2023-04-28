# Zustand Fetching Helpers

> Introducing several functions that simplify working with **zustand** and clean up your store from unnecessary actions
> and states.

The functions described below are _**well-typed**_ and allow working with _**nested**_ objects. Zustand suggests writing
custom [slices](https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md) and dividing the store into
several parts. Here are examples of our helpers
for [slices](https://github.com/Hecmatyar/zustand-fetching/tree/main/src/examples/slices). However, in
most cases, we need to divide the store into several parts because we add a lot of **unnecessary** data to the store and
visually **overload** it.

I propose several helpers that will take on a significant portion of the typical data work in your store. First, it is
easier to see [examples](https://github.com/Hecmatyar/zustand-fetching/tree/main/src/examples/controllers) to understand
what it is and how it can help.

- [leitenRequest](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/1_Controller_Request.tsx)
  help you to handle request (any async function) and catch errors, return **hook** with params of request, and have
  methods:
  action, clear, abort, set
- [leitenGroupRequest](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/6_Controller_GroupRequest.tsx)
  handle a lot of similar requests dynamically, return **hook** with 2 overloads and have methods: call, clear
- [leitenRecord](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/2_Controller_Record.tsx)
  working with objects, have methods: set, patch, clear
- [leitenPrimitive](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/3_Controller_Primitive.tsx)
  working with data like with primitive value, but it can be object, function or primitives. Have methods set and clear
- [leitenList](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/4_Controller_List.tsx)
  working with array. Have methods set, clear, add, update, remove, toggle, filter. If array item is an object then
  set **compare** function in the controller's
  options (third parameter)
- [leitenNormalizedList](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/4_Controller_List.tsx)
  the same as leitenList but working with normalized state
- [leitenModal](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/5_Controller_Modal.tsx)
  help to work with modals, have built in modal manager (if you want to open modal in cascade). Return hooks
  with [openState, hiddenState], have methods open, close and action

> All leitenControllers automatically calculate required type by path and **throw typescript error** if the specified
> path does not satisfy the requirements of the controller or the established types.
> Examples:
>- Argument of type '"info.keywords.1"' is not assignable to parameter of type '"info.keywords"'.
>- Argument of type 'string' is not assignable to parameter of type 'never'.

## Advanced

### Options

**leitenRecord**, **leitenPrimitive**, **leitenList** and **leitenNormalized** list have options with callbacks:
_processingBeforeSet_, _sideEffect_, _patchEffect_. You can use them to extend basic functionality

### Request

All requests working with **useLeitenRequests**. Usually you will never need it, but if you need it, then the record is
stored there with all the query parameters. The request key is returned by each leitenRequest

```tsx
interface IState {
  user: IUser | null;
}

const useExampleStore = create<IState>(() => ({
  user: null,
}));

const useController = leitenRequest(useExampleStore, "user", getUser);

const User = () => {
  const status = useLeitenRequests(state => state[useController.key].status)
  return <>{status}</>
}
```

leitenMap also can be
helpful, [example](https://github.com/Hecmatyar/zustand-fetching/blob/main/src/examples/controllers/6_Controller_GroupRequest.tsx)

### Group Request

leitenGroupRequest return overloaded hook 

```tsx
interface IState {
  cards: Record<string, ICard>;
}

const useExampleStore = create<IState>(() => ({
  cards: {},
}));
export const useGroupController = leitenGroupRequest(
  useExampleStore,
  "cards",
  async (props: ILeitenGroupRequestParams<string>) => {
    return getCard(props.params);
  },
);

const status = useGroupController(id, (state) => state.status); //First param is key, better option
or
const requests = useGroupController((state) => state); // Record with all requests
```