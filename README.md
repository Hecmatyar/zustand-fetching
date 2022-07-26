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
export const User = () => {
  const { atom, action } = useUser((state) => state.userRequest);

  useEffect(() => {
    action("id"); // выполняем запрос один раз на данные пользователя по идентификатору "id"
  }, [action])

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

- **_extra_** - это объект который позволяет вам получить полный контроль над выполнением запроса и творить магию. Вот
  полное
  описание полей.

```
initialStatus?: ILoadingStatus;
  initialContent?: Result;
  contentReducers?: {
    pending?: (params: Payload) => Result | null;
    fulfilled?: (content: Result, params: Payload) => Result | null;
    rejected?: (
      params: Payload,
      error: string,
      fetchError?: IFetchError<Result>
    ) => Result | null;
    aborted?: (params: Payload) => Result | null;
  };
  fulfilledReaction?: (result: Result, params: Payload) => void;
  rejectedReaction?: (
    params: Payload,
    error: string,
    fetchError?: IFetchError<Result>
  ) => void;
  abortReaction?: (params: Payload) => void;
  resolvedReaction?: (params: Payload) => void;
  actionReaction?: (params: Payload) => void;
```



## GroupRequest

## Modal window