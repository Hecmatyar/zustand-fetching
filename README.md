# Zustand Fetching Helpers

Представляем несколько вспомогательных функций для работы с **зустандом**.
Ребята проделали отличную работу и нам очень нравится использовать этот стейт менеджер.


> Для чего нужна эта библиотека? У нас всегда есть типовые запросы к бэкенду, потому предлагаем несколько методов чтобы
> упростить работу с запросами и
> зустандом

## Request

Вот то как могут выглядеть ваши запросы

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
}))
```

Представим что у вас есть запрос, который вы хотите выполнить. Например, запрос на получение информации о пользователе.
Опишим наш стор следующим обазом.

```ts
interface IUserState {
  userRequest: ICreateRequest<string, IUser>
}
```

_**ICreateRequest**_ - это интерфейс который показывает другим разработчикам и вам что мы выполняем клиент серверный
запрос.<br>Что из себя представляет _**ICreateRequest**_

```ts
export type ICreateRequest<Payload, Result> = {
  abort: () => void;
  clear: () => void;
  action: (params: Payload) => void;
  atom: ContentLoading<Result, Payload>;
  setAtom: (value: Partial<Result>, rewrite?: boolean) => void;
};
```

_**action**_ - означает что мы хотим вызываем наш запрос на выполнение. <br>
_**atom**_ - место хранения нашего результата.<br>
_**abort**_ - функция по прекращению выполннения запроса. Полезно в случаях когда мы должны выполнить новый запрос не
дожидаясь выполнения предыдущего или мы уходим со страницы на которой был вызван запрос.<br>
_**clear**_ - очищаем хранилище нашего запроса.<br>
_**setAtom**_ - записываем какой то контент в атом нашего запроса. Так как в зустанде мы можем использовать _set()_ и
передавать туда _Partial_ о нашего _State_, то тут можем поступить аналогичным образом.
Например у нас есть ```content: { name: "John Doe", id: "1" }``` и мы хотим переименовать нашего пользователя на _"John
Smith"_,
тогда мы можем вызвать просто ```setAtom({ name: "John Smith"})``` и значение в будет ```content: { name: "John Smith",
id: "1"}```.
Параметр _rewrite_ нужен для того чтобы передать объект который заменит собой полностью значение внутри _content_.

В свою очередь _content_ из **ICreateRequest** представляет из себя следующую структуру _ContentLoading_

```ts
export interface ContentLoading<T, P = undefined> {
  content: T | null;
  status: ILoadingStatus;
  error?: string | null;
  fetchError?: IFetchError<T>;
  payload?: P | null;
}
```

> Благодаря такому описанию нам не нужно объвлять статус запроса отдельно, создавать поле для хранения ошибки выполнения
> запроса и прочее. Мы всегда можем получить контент запроса и вывести его внутри компонента или показать ошибку.

_**content**_ - данные которые ввернул наш запрос. null - когда мы еще ничего не получили<br>
_**status**_ - статус выполнения нашего запроса. Возможные значения: "init", "loading", "loaded", "waiting", "progress"
, "
error"<br>
_**payload**_ - наш payload с которым мы вызвали запрос<br>
_**error**_ - ошибка которую вернул запрос<br>

Теперь у нас есть описание запроса. У нас есть метод createSlice чтобы помочь создать слайс в вашем сторе.
createSlice - это специальный метод который позволит автоматически создать все необходимое окружение для работы по
нашему описанию

Создадим простой стор, в котором будем выполнять запрос на получение информации о пользователе

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    return getUserById(id);
  }),
}))
```

Таким образом мы создали запрос на получение данных пользователя. _**getUserById**_ - это ваш запрос на получение
данных, который должен вернуть тип _IUser_. Это так же значит что вы вожете дописать любую обработку данных вашего
запроса, главное возвращаемый результат должен совпадать с тем, который вы объявили
в ```userRequest: ICreateRequest<string, IUser>```. Например,

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string) => {
    const result = await getUserById(id);
    return { ...result.data, role: "artist" }
  }),
}))
```

Это все. Нам понадобилось три строчки чтобы описать наш запрос. Что мы тперь можем с ним сделать? Давайте посмотрим.
Мы использовали небольшой компонент StatusSwitcher чтобы код компонента пользователя оставался более чистым.

```tsx
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useUser((state) => state.userRequest);

  useEffect(() => {
    action(id); // выполняем запрос один раз на данные пользователя по идентификатору "id"
  }, [action, id])

  return (
    <div>
      <StatusSwitcher status={atom.status} error={atom.error}>
        User name: <b>{atom.content?.name}</b> // когда данные будут загружены, то мы увидим имя пользователя здесь
      </StatusSwitcher>
    </div>
  );
};

const StatusSwitcher = ({
                          status,
                          children,
                          error
                        }: { status: ILoadingStatus, children: ReactNode, error: string }) => {
  return <>
    {status === "loaded" && <>{children}</>}
    {status === "loading" && <>loading...</>}
    {status === "error" && <>{error}</>}
  </>
}
```

Что мы получили:

- всегда знаем статус выполняемого запроса<br>
- можем получить данные запроса или ошибку его выполнения<br>
- имеем простой способ вызова запроса<br>
- нам потребовалось минимум описаний типов TypeScript и полей в нашем сторе<br>

Но это еще не, _**createSlice**_ имеет гораздо более мощный функционал. Вот полное описание параметров _**createSlice**_

```createSlice(set, get, name, payloadCreator, extra)```

- _**set и get**_ - это методы из нашего zustand стора <br>
- _**name**_ - название нашего запроса. Обратите внимание что оно должно совпадать с тем которое вы определили в _
  IUserState_ <br>
- _**payloadCreator**_ - это функция внутри которой мы выполняем наш запрос. Важно _payloadCreator_ имеет вторым
  аргументом
  объект внутри которого есть ```signal: AbortSignal```. Он может быть передан в ваш _**fetch**_ запрос и при вызове
  метода
  ```userRequest.abort``` запрос будет отменен.<br>

Таким образом можно отредактировать предыдущим пример с использованием _abort_

```tsx
const { action, abort } = useUser((state) => state.userRequest);

useEffect(() => {
  action("id"); // выполняем запрос один раз на данные пользователя по идентификатору "id"

  return () => {
    abort()
  }
}, [action])
```

и передает _signal_ в наш запрос. Подробнее о том как использовать сигнал в fetch //todo

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }),
}))
```

- **_extra_** - это объект который позволяет вам получить полный контроль над выполнением запроса и творить магию.
  все поля можно условно поделить на три группы: поля атома, реакции и редюсер.

Разберем все по порядку

- _**initialStatus**_ - статус который можно определить для нашего запроса по умолчанию. Сейчас он определен как **"
  loading"**, но
  можно поставить ему любой, на ва вкус. Ведь от статуса многое зависит в нашем интерфейсе и не всегда нам нужен
  **loading**.
- _**initialContent**_ - контент поля _atom_. По умолчанию опеределен как _null_ пока не будет возвращено значение из
  запроса.

Например с использованием этих полей код нашего useUser убдет выглядеть следующим образом

```ts
export const useUser = create<IUserState>((set, get) => ({
  ...createSlice(set, get, "userRequest", async (id: string, { signal }) => {
    return getUserById(id, signal);
  }, { initialStatus: "init", initialContent: { name: "JOgn Doe" } }),
}))
```

Следующие поля - это реакции, которые вызываются по завершению вашего запроса. Очень удобно использовать для вывода
оповещний

- fulfilledReaction - реакция на успешное завершение запроса <br>
- rejectedReaction - реакция на завершение запроса с ошибкой <br>
- resolvedReaction - реакция которая вызовется после выполнения запроса вне зависимости от результата <br>
- actionReaction - реакция которая вызовется до начала запрос <br>
- abortReaction - реакция которая вызовется в случае когда запрос был прерван <br>

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
      pending: () => ({})
    },
  }),
}))
```

Ранее я упомянул про выполнение запроса на получение расписаниядля пользователя. Давайте напишем стор который будет
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
разделить наш стор на несколько частей, в нашем случае пользователь и расписания.

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
групповых запросов _**createGroupRequestSlice**_

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
  ...createGroupRequestSlice(set, get, "schedulesRequest", async (id: string) => {
    return getScheduleById(id);
  }),
});
```

//описание полей группового запроса

Тогда наш компонент пользователя будет выглядеть следубщим образом

```tsx
export const User = ({ id }: { id: string }) => {
  const { atom, action } = useCommon((state) => state.userRequest);
  const { call } = useCommon((state) => state.schedulesRequest);
  const [open, setOpen] = useState(false)

  useEffect(() => {
    action(id);
  }, [action, id])

  return (
    <div>
      User name: <b>{atom.content?.name}</b>
      <button onClick={() => setOpen(true)}>get schedule</button>
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

## Modal window