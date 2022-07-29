# Zustand Fetching Helpers

Here are some helper functions for working with **zustand**.
The creators of **zustand** did a great job and we really enjoy using this state manager.

> What is this library for? We always have standard requests to the backend, so we offer several methods to simplify the
> work with requests using **zustand**

Problem: All asynchronous requests are actually very similar, but we are constantly faced with our own
implementation from different developers for each request. This makes it difficult to understanding and easy to miss
something. We present you a way to remove the burden of request's infrastructure and leave only control over fetching.

## Request

Here's what the simplest queries might look like. All examples are made using TypeScript

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
}))
```

When you read the _zustand_ documentation, you see that it recommends using [
slice-pattern](https://github.com/pmndrs/zustand/blob/main/docs/typescript.md#slices-pattern).
We have made a special helper for these purposes.

Let's imagine that you have a request that you want to execute. **_createSlice_** is a special method that will
automatically create all the necessary environment for working according to our description. For example, a request for
information about a user.

Describe our store.

```ts
interface IUserState {
  userRequest: ICreateRequest<string, IUser>
}
```

_**ICreateRequest**_ - interface that shows other developers and you that here used a helper to create a request.<br>

```ts
export type ICreateRequest<Payload, Result> = {
  action: (params: Payload) => void;
  atom: ContentLoading<Result, Payload>;
  clear: () => void;
  abort: () => void;
  setAtom: (value: Partial<Result>, rewrite?: boolean) => void;
};
```

_**action**_ - function to call our request.<br>
_**atom**_ - request store. _ContentLoading_ indicates that this is loading data<br>
_**clear**_ - function to clear the _atom_ field.<br>
_**abort**_ - function to abort the request. Useful in case we leave the page where the request was called before the
end of the request.<br>
_**setAtom**_ - set content field in our _atom_. You can use _setAtom_ in the same way like _zustand_ _set_.

The _atom_ field from **_ICreateRequest_** is the _**ContentLoading**_ interface.

```ts
export interface ContentLoading<Content, Payload = undefined> {
  content: Content | null;
  status: ILoadingStatus;
  payload?: Payload | null;
  error?: any;
  lastFetchTime: Date | null;
}
```

> Thanks to _ContentLoading_, we do not need to declare the request status separately, create a field to store the
> request execution error, etc. We can always get the content of the request and display it inside the component,
> show the process or the error.

_**content**_ - the data returned by request. _null_ - when we haven't received anything yet<br>
_**status**_ - the status of our request. Possible values: "init", "loading", "loaded", "waiting", "progress", "
error"<br>
_**payload**_ - our payload with which we called the request<br>
_**error**_ - the error returned by the request<br>
_**lastFetchTime**_ - Date of last fulfilled request<br>

Congratulations, we have reviewed the interface of our _**createSlice**_.

Let's create a simple store with request to get information about the user.
**Please note** that the name passed to _**createSlice**_ must match what you defined in _IUserState_.

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
}))
```

Thus, we created a request for get user data. **getUserById** is your data request, which should return the type _
IUser_. This also means that you can add any data processing to your request, use your own _baseFetch_ handlers or
some solutions. The main thing is that the returned result must match the type you declared
in ```userRequest: ICreateRequest<string, IUser>```.<br>
For example, let's process the result of a query

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    const result = await getUserById(id);
    return { ...result.data, role: "artist" }
  }),
}))
```

**That's all.** 3 lines to describe our request. What can we do with it now? let's see. We used a small _StatusSwitcher_
component to keep the example component code cleaner.

```tsx
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useUser((state) => state.userRequest);

  useEffect(() => {
    action(id); // call request using id param
  }, [action, id])

  return (
    <div>
      <StatusSwitcher status={atom.status} error={atom.error.message}>
        User name: <b>{atom.content?.name}</b> // we will see it when loading will be done
      </StatusSwitcher>
    </div>
  );
};

interface ISwitcherProps {
  status: ILoadingStatus;
  children: ReactNode;
  error: string
}

const StatusSwitcher = ({ status, children, error }: ISwitcherProps) => {
  return <>
    {status === "loaded" && <>{children}</>}
    {status === "loading" && <>loading...</>}
    {status === "error" && <>{error}</>}
  </>
}
```

What we got:

- we always know the status of the request<br>
- we can get request data or its execution error<br>
- we have a simple way to call a request<br>
- we needed a minimum of type descriptions and fields in our store<br>

But that's not all, _**createSlice**_ has much more powerful functionality. Here is an advanced description of the
parameters of ```createSlice(set, get, name, payloadCreator, extra)```

- _**set and get**_ are methods from our _zustand_ store <br>
- _**name**_ - the name of our request. **Please note** that it must match the one you defined in the type
  your store<br>
- _**payloadCreator**_ is the function inside which we execute our request. Important _payloadCreator_ has an object
  with field ```signal: AbortSignal``` as the second argument. It can be passed to your _**fetch**_ request and
  calling the ```userRequest.abort``` method will cancel the request.<br>

Thus, you can edit the previous example using _abort_

```tsx
const { action, abort } = useUser((state) => state.userRequest);

useEffect(() => {
  action("id"); // call request using id param

  return () => {
    abort() // abort request when we anmout our compoenent
  }
}, [action])
```

Then we pass _signal_ to our request. More about how to use the _signal_
in [fetch](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal)

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }),
}))
```

- **_extra_** is an object that allows you to take full control over the execution of the request and do magic.
  All fields can be conditionally divided into 3 groups: fields of an atom, reactions and a reducer.

- _**initialStatus**_ - the status that can be defined for our request by default. Default value is **"
  loading"**, but you can define some of LoadingStatus. Indeed, a lot depends on the status in our interface and we do
  not
  always need **loading**.
- _**initialContent**_ - content of the _atom_ field. The default is defined as _null_ until a value is returned from
  the request.

Update our userRequest and use these fields

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }, { initialStatus: "init", initialContent: { name: "John Doe" } }),
}))
```

The following fields are reactions that are called for your request lifecycle. Very useful for alerts.

- fulfilledReaction - called when request was successful <br>
- rejectedReaction - called when request was rejected <br>
- resolvedReaction - called after the request is executed, regardless of the result <br>
- actionReaction - called before the start of the request <br>
- abortReaction - called when request was aborted <br>

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }, {
    fulfilledReaction: (result: IUser, id: string) => {
      scheduleRequest.action(id) //example, call request to get schedule for user
    },
    rejectedReaction: () => {
      notification.error("Some error was accured")
    },
    actionReaction: (id: string) => {
      log("Log user", id)
    }
  }),
}))
```

And the last field is _contentReducers_.

- _**contentReducers**_ - with it we can fully manage the data we put in _content_.
  There are 4 fields in total _pending_, _fulfilled_, _rejected_, _aborted_. Each of these functions will be called at
  its own stage of the request execution.

What is it for? For example, we want to replace query data. This is very useful because we don't need to write a lot of
logic in the slice request body.

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }, {
    contentReducers: {
      pending: () => ({}) //todo сережа опиши что тут к чему
    },
  }),
}))
```

We previously made a request to get a _schedule_ for a _user_ as an example. Let's update the _IUserState_ that will
execute the request to get information about the user and his schedule.

```ts
interface IUserState {
  userRequest: ICreateRequest<string, IUser>
  scheduleRequest: ICreateRequest<string, ISchedule>
}

export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
  ...createSlice(set, get, "scheduleRequest", async (id: string) => {
    return getScheduleById(id);
  }),
}))
```

We have described one more request. The user's schedule will be called if we get the user's data. But you can use
and call _request.action_ in any order you want.

## GroupRequest

Sometimes we have a situation where we need to execute a series of single requests asynchronously. For example, we have
a list of users, and we want to request the schedule of each of them only in the case when the user clicks on the
button. To do this, the helper for executing group queries _**createGroupSlice**_ will help us.

Update the store in accordance with the new requirements

```ts
// created slice only for schedules
interface IScheduleSlice {
  schedulesRequest: ICreateGroupRequests<string, ISchedule>;
}

export const scheduleSlice = <T extends IScheduleSlice>(
  set: SetState<T>,
  get: GetState<T>,
): IUserSlice => ({
  ...createGroupSlice(set, get, "schedulesRequest", async ({ payload, key }: IGroupRequestParams<string>) => {
    return getScheduleById(payload);
  }),
});
```

Then our user component will look like this

```tsx
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useCommon((state) => state.userRequest);
  const call = useCommon((state) => state.schedulesRequest.call);
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    action(id);
  }, [action, id])

  return (
    <div>
      User name: <b>{atom.content?.name}</b>
      <button onClick={() => setIsOpen(true)}>get schedule</button>
      // написали кнопку которая открывает расписание отдельно взятого пользователя
      {isOpen ? <Schedule id={id} /> : <></>}
    </div>
  );
};

const Schedule = ({ id }: { id: string }) => {
  const { status, content, error } = useCommon((state) => state.schedulesRequest.get(id), shallow);

  useEffect(() => {
    call([{ key: id, payload: id }]) // call request for user's schedule
  }, [action, id])

  return <StatusSwitcher status={status} error={error}> //use StatusSwitcher component again
    Shedule: {content.days} //for example, show some scheduled days
  </StatusSwitcher>

}
```

After the request is fulfilled, the schedule continues to be stored. For example, can be reused without the need to
execute the
request again.

The list of fields that _**createGroupSlice**_ accepts is identical to _**createSlice**_. The difference is what
creates _**createGroupSlice**_

- _**requests**_ - an object that contains all our requests. The queries are identical to those returned by _**
  createSlice**_. Usually we don't need to interact with it. The keys in the object are the _key_ that you passed to
  the _call_ function. Be careful that these values should be unique!
- _**call**_ - a function that accepts an array of objects of the _IGroupRequestParams_ type. This means that requests
  will be called with the _payload_ that we passed in and a unique key.

```ts
export interface IGroupRequestParams<Payload> {
  key: string; // necessarily to store request
  payload: Payload;
}
```

- _**get**_ - function that has an optional _key_ parameter. It will return the request by _key_ or all requests if _
  key_ is undefined.
- _**getContent**_ - will return the content of the selected request by _key_. It is necessary in a situation when we
  work only with request data.
- _**clear**_ - has an optional _key_ parameter. Clears whole store or only the selected query by key.
-

Now we have the ability to create a dynamic number of requests of the same type without the need to describe them in
your store.

## Modal window

_**createModal**_ - a helper for creating everything you need to work with a modal window. It happens often that we need
to call a modal window from different components and pass data to it (for example, open a modal window to delete entity
by id).

```ts

interface IUserState {
  userListRequest: ICreateRequest<void, IUser[]>
  removeModal: IModalCreator<{ id: string }>;
}

export const useUser = create<IUserState>((set, get) => ({
  ...createModal(set, get, "removeModal", { id: "" }),
  ...createSlice(set, get, "userListRequest", async () => {
    return getUserList();
  }),
}))

```

The first three arguments to createModal are the same as those of _**createSlice**_, and the last is the modal's storage
value. If it is not needed, then you can simply write _undefined_.

```tsx
const Page = () => {
  const { content } = useUser((state) => state.userListRequest.content || [])

  return <>
    {content.map(user => <User key={user.id} user={user} />)}
    <RemoveModal /> // we can put our modal in the root of page
  </>
}

export const User = ({ user }: { user: IUser }) => {
  const { open } = useUser((state) => state.removeModal);

  return (
    <div>
      User name: {user.name}
      <button onClick={() => open({ id: user.id })}>remove</button>
    </div>
  );
};

export const Modal = () => {
  const { atom, close } = useUser((state) => state.removeModal);
  const action = useUser((state) => state.removeRequest.action); //сделаем вид что у нас есть запрос на удаление пользователя

  const handleRemove = usecallback(() => {
    action(atom.data.id)
  }, [])

  return (
    <Modal isOpen={atom.isOpen}>
      <button onClick={close}>cancel</button>
      <button onClick={handleRemove}>confirm</button>
    </Modal>
  );
};
```

Now we don't have to worry about forwarding the necessary props or declaring the state of the modal somewhere.

//todo сережа закинь описание паарметров и их использования