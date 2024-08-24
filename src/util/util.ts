import { Dispatch } from "react";

// NOTE I am a fucking genies to write this fucking code
const singleKeySetter = <T, Key extends keyof T>(
  setter: Dispatch<React.SetStateAction<T>>,
  key: Key
) => {
  type Value = T[Key];
  return (value: Value) =>
    setter(
      (prev) =>
        ({
          ...prev,
          [key]: value,
        } satisfies T)
    );
};

export default singleKeySetter;
