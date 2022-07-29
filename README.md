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

Let's imagine that you have a request that you want to execute. For example, a request for information about a user.
Describe our store.

```ts
interface IUserState {
  userRequest: ICreateRequest<string, IUser>
}
```

_**ICreateRequest**_ - interface that shows other developers and you that here used a helper to create a request.<br>

```ts
export type ICreateRequest<Payload, Result> = {
  abort: () => void;
  clear: () => void;
  action: (params: Payload) => void;
  atom: ContentLoading<Result, Payload>;
  setAtom: (value: Partial<Result>, rewrite?: boolean) => void;
};
```

_**action**_ - function to call our request.<br>
_**atom**_ - request store. _ContentLoading_ indicates that this is loading data<br>
_**clear**_ - function to clear the _atom_ field.<br>
_**abort**_ - function to abort the request. Useful in case we leave the page where the request was called before the
end of the request.<br>
_**setAtom**_ - set content field in our _atom_. You can use _setAtom_ in the same way like _zustand_ _set_.

The _atom_ field from **_ICreateRequest_** is the _ContentLoading_ interface.

```ts
export interface ContentLoading<T, P = undefined> {
  content: T | null;
  status: ILoadingStatus;
  error?: string | null;
  payload?: P | null;
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

Congratulations, we have reviewed the interface of our _**createSlice**_. We have a **_createSlice_** method to help
create a slice in your store.
**_createSlice_** is a special method that will automatically create all the necessary environment for working according
to our description

Let's create a simple store with request to get information about the user. Note that the name passed to _**
createSlice**_ must match what you defined in _IUserState_.

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

**That's all!**. 3 lines to describe our request. What can we do with it now? let's see.
We used a small _StatusSwitcher_ component to keep the example component code cleaner.

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
- _**name**_ - the name of our request. Please note that it must match the one you defined in the type
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

- fulfilledReaction - successful completion of the request <br>
- rejectedReaction - request was rejected <br>
- resolvedReaction - the reaction that will be called after the request is executed, regardless of the result <br>
- actionReaction - the reaction that will be called before the start of the request <br>
- abortReaction - the reaction that will be called when the request was aborted <br>

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }, {
    fulfilledReaction: (result: IUser, id: string) => {
      scheduleRequest.action(id) //выполнить запрос на получение расписания для выбранного пользователя
    },
    rejectedReaction: () => {
      notification.error("Не получилось запросить данные пользователя")
    },
    actionReaction: (id: string) => {
      log("Был запрошен пользователь", id)
    }
  }),
}))
```

И последнее поле - это _contentReducers_.

- _**contentReducers**_ - с его помощью мы можем полностью управлять данными которые мы помещаем в _content_.
  Всего есть 4 поля _pending_, _fulfilled_, _rejected_, _aborted_. Каждая из этих функций будет вызвана на своем этапе
  выполнения запроса. Для чего это нужно? Например, мы хотим заменить данные запросе. Это очень
  полезно так как нам не неужно писать много логики в теле запроса слайса.

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

Ранее я упомянул про выполнение запроса на получение расписания для пользователя. Давайте напишем стор который будет
выполнять запрос на получение информации о пользователе и его расписании.

```ts
interface IUserState {
  userRequest: ICreateRequest<string, IUser>
  scheduleRequest: ICreateRequest<string, ISchedule>
}
```

и наш стор будет выглядеть следующим образом

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
  ...createSlice(set, get, "scheduleRequest", async (id: string) => {
    return getScheduleById(id);
  }),
}))
```

Таким образом мы описали еще один запрос. Расписание полльзователя будет вызвано в том случае если мы получим данные
самого пользователя. Но вы можете использовать и вызывать запросы в любом интересующем вас порядке

Но что если мы хотим не только запрашивать пользователя и его расписание? Что если мы хотим обновлять данные
пользователя, создавать нового, удалять расписание для пользователя и тд. То есть нам надо много запросов. Тогда стоит
разделить наш стор на несколько частей, в нашем случае пользователь и расписания. Можно сделать несколько независимых
зустанд сторов, а можно сделать несколько слайсов

```ts
interface IUserSlice {
  userRequest: ICreateRequest<string, IUser>;
  updateUserRequest: ICreateRequest<string, IUser>;
  ...
}

export const userSlice = <T extends IUserSlice>(
  set: SetState<T>,
  get: GetState<T>,
): IUserSlice => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
  ...createSlice(set, get, "updateUserRequest", async (user: IUser) => {
    return updateUser(user);
  }, {
    fulfilledReaction: (result: IUser, payload: IUser) => {
      get().scheduleRequest.setAtom(result);
      // мы обновили информацию о пользователе в нашем атоме пользователя м можем работать только с userRequest 
      // для вывода информации
    },
  }),
  ...
});
```

и наши расписания

```ts
interface IScheduleSlice {
  scheduleRequest: ICreateRequest<string, ISchedule>;
  updateScheduleRequest: ICreateRequest<string, ISchedule>;
  ...
}

export const scheduleSlice = <T extends IScheduleSlice>(
  set: SetState<T>,
  get: GetState<T>,
): IUserSlice => ({
  ...createSlice(set, get, "scheduleRequest", async (id: string) => {
    return getScheduleById(id);
  }),
  ...createSlice(set, get, "updateScheduleRequest", async (schedule: ISchedule) => {
    return updateSchedule(schedule);
  }),
  ...
});
```

Тогда наш итоговый стор будет выглядеть следущим образом

```ts
type State = StateFromFunctions<[typeof scheduleSlice, typeof userSlice]>;

export const useCommonStore = create<State>((set, get) => ({
  ...scheduleSlice(set, get),
  ...userSlice(set, get),
}));
```

_StateFromFunctions_ - позволяет нам автоматически получить типы наших слайсов без нужды описывать стор целиком

Но что если у нас есть список пользователей и для каждого из них в любой момент нужно запросить его расписание. Мы не
можем запросить все расписания разом и должны делать это по одиночке. Для этого нам поможет хелпер по выполнению
групповых запросов _**createGroupSlice**_

## GroupRequest

Нужен для того чтобы вызывать группу однотипных запросов асинхронно. Например у нас есть список и мы можем открыть
расписание каждого польователя. Но запрос на расписание будем отправлять только тогда когда потребуется. Обновим наш
стор в соответсвии с новыми требованиями

```ts
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

Тогда наш компонент пользователя будет выглядеть следубщим образом

```tsx
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useCommon((state) => state.userRequest);
  const call = useCommon((state) => state.schedulesRequest.call);
  const [open, setOpen] = useState(false)

  useEffect(() => {
    action(id);
  }, [action, id])

  return (
    <div>
      User name: <b>{atom.content?.name}</b>
      <button onClick={() => setOpen(true)}>get schedule</button>
      // написали кнопку которая открывает расписание отдельно взятого пользователя
      {open ? <Schedule id={id} /> : <></>}
    </div>
  );
};

const Schedule = ({ id }: { id: string }) => {
  const { status, content, error } = useCommon((state) => state.schedulesRequest.get(id), shallow);

  useEffect(() => {
    call([{ key: id, payload: id }]) // отправляем запрос на получение одного расписания
  }, [action, id])

  return <StatusSwitcher status={status} error={error}>
    Shedule: {content.days}
  </StatusSwitcher>

}
```

После выполнения запроса расписание продолжает храниться и может быть использовано повторно бех нужды выполнять запрос.

Список полей которые принимает _**createGroupSlice**_ идентичен _**createSlice**_. Отличия в том что создает _**
createGroupSlice**_

- _**requests**_ - объект который содержит все наши запросы. Запросы идентичны тем, что возвращает _**createSlice**_.
  Обычно нам нет нужды взаимодействовать с ним. Ключами в объекте выступают _key_, которые вы передали в _call_ функции.
  Следите внимательно чтобы эти значения были уникальными.
- _**call**_ - функция которая принимает массив объектов типа _IGroupRequestParams_. Это означает что будут вызваны
  запросы с _payload_ который мы передали и уникальным ключом.

```ts
export interface IGroupRequestParams<Payload> {
  key: string;
  payload: Payload;
}
```

- _**get**_ - имеет не обязательный параметр _key_. Она вернет запрос по _key_ или все запросы в случае отсутствия _key_
  .
- _**getContent**_ - вернет контент выбранного запроса по _key_. Нужно в ситуации когда мы работаем только с данными
  запроса.
- _**clear**_ - имеет не обязательный параметр _key_. Очистит или весь стор или только выбранный запрос

Теперь у нас есть возможность создавать динамическое количество однотипных запросов без нужды их описания в нашем сторе.

## Modal window

_**createModal**_ - хелпер по созданию всего необходимого для работы с модальным окном. Бывает часто нам необходимо
вызывать
модальное окно из разных компонентов и передавать данные в него (например, открыть модальное окно для удаления по id).

Напишем стор в котором есть модальное окно

```ts

interface IUserState {
  removeModal: IModalCreator<{ id: string }>;
  userRequest: ICreateRequest<string, IUser>
}

export const useScheduleInfoStore = create<IScheduleInfoState>((set, get) => ({
  ...createModal(set, get, "removeModal", { id: "" }),
}))

```

Первые три аргумента у createModal такие же как и у _**createSlice**_, а последний - это значение хранилища модального
окна. Если оно не нужно, то можно просто написать _undefined_.

```tsx
const Page = () => {
  return <>
    <User id={query.id} />
    <RemoveModal />
  </>
}

export const User = ({ id }: { id: string }) => {
  const { atom, action } = useUser((state) => state.userRequest);
  const { open } = useUser((state) => state.removeModal);

  return (
    <div>
      <button onClick={() => open({ id })}>remove</button>
    </div>
  );
};

export const Modal = () => {
  const { atom, close } = useUser((state) => state.removeModal);
  const { action } = useUser((state) => state.removeRequest); //сделаем вид что у нас есть запрос на удаление пользователя

  const handleRemove = usecallback(() => {
    action(atom.data.id)
  }, [])

  return (
    <Modal isOpen={atom.isOpen}>
      <button onClick={close}>cancel</button>
      <button onClick={handleRemove}>remove</button>
    </Modal>
  );
};
```

Вот так мы можем пользоваться нашим хелпером для модальных окон. Теперь нам не нужно переживать за то чтобы пробросить
необходимые пропсы или объявлять где то состояние модального окна.

//todo сережа закинь описание паарметров и их использования