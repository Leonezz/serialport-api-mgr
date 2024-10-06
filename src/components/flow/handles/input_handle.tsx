import { Node } from "@xyflow/react";
import { ReactNode } from "react";
import { CustomHandler } from "./custom_handle";

type InputHandleProps<DataType> = {
  id: string;
  connectionLimit?: number;
  onValueChange?: (data: DataType | undefined) => void;
};

export const InputHandle = <DataType extends Node["data"]>(
  props: InputHandleProps<DataType> & Readonly<{ children: ReactNode }>
) => {
  return (
    <div className="relative w-full flex flex-row justify-between">
      <CustomHandler
        id={props.id}
        connectionLimit={props.connectionLimit}
        onChange={
          (data) => props.onValueChange && props.onValueChange(data as DataType) // this sucks
        }
        type="target"
      />
      {props.children}
    </div>
  );
};
