export interface IFetchError<R> {
  message: string;
  responseStatus: number;
  result: R | null;
}

export class FetchError<R> extends Error implements IFetchError<R> {
  public message;
  public result;
  public responseStatus;

  constructor(message: string, responseCode: number, result: R | null) {
    super(message);
    this.message = message;
    this.result = result;
    this.responseStatus = responseCode;
  }
}
