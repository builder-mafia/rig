import { BehaviorSubject, type Observable, skip } from 'rxjs';

export class StateSubject<T> {
  private _bs: BehaviorSubject<T>;

  constructor(initial: T) {
    this._bs = new BehaviorSubject(initial);
  }

  getValue(): T {
    return this._bs.getValue();
  }

  next(value: T): void {
    this._bs.next(value);
  }

  asObservable(): Observable<T> {
    return this._bs.pipe(skip(1));
  }
}
