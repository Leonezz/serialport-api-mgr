export type ActionResState<T> = {
  failed: boolean;
  succeed: boolean;
  error?: {
    code: string;
    msg: string;
  };
  data?: T;
};
