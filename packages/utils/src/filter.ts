const notNullish = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};

const notUndefined = <T>(value: T): value is Exclude<T, undefined> => {
  return value !== undefined;
};

const notFalse = <T>(value: T): value is Exclude<T, false> => {
  return value !== false;
};

export const Filter = {
  notNullish,
  notUndefined,
  notFalse,
};
