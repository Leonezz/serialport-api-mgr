import { ReactNode } from "react";
import { CustomHandler } from "./custom_handle";

type OutputHandleProps = {
  id: string;
  connectionLimit?: number;
};

export const OutputHandle = (
  props: OutputHandleProps & Readonly<{ children: ReactNode }>
) => {
  return (
    <div className="relative w-full flex flex-row justify-between">
      <CustomHandler
        id={props.id}
        connectionLimit={props.connectionLimit}
        type="source"
      />
      {props.children}
    </div>
  );
};
