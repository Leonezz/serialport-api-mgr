import { OpenSerialPortReq } from "@/bridge/call_rust";
import BaudRateInput from "./baud_rate_input";
import DataBitsRadio from "./data_bits_radio";
import FlowControlRadio from "./flow_control_radio";
import ParityRadio from "./parity_radio";
import StopBitsRadio from "./stop_bits_radio";
import React, { SetStateAction } from "react";
import { OpenedPortStatus, SerialPortInfo } from "@/bridge/types";
import { startCase } from "es-toolkit";
import { Input } from "@nextui-org/react";

type ReadWriteTimeoutInputProps = {
  value: number;
  setValue: (value: number) => void;
  portInfo?: SerialPortInfo;
};
const ReadWriteTimeoutInput = <T1 extends "read_timeout" | "write_timeout">(
  inputFor: T1
) => {
  const name = startCase(inputFor);
  return ({ value, setValue, portInfo }: ReadWriteTimeoutInputProps) => {
    const portOpened = !!(
      portInfo?.port_status && portInfo.port_status !== "Closed"
    );
    const defaultValue = (
      portOpened
        ? (portInfo.port_status as OpenedPortStatus).Opened[inputFor]
        : value
    ).toString();
    return (
      <Input
        label={
          <p className="text-medium font-bold text-content1-foreground">
            {name}
          </p>
        }
        labelPlacement="outside"
        size="sm"
        endContent={"ms"}
        type="number"
        isReadOnly={portOpened}
        defaultValue={defaultValue}
        value={defaultValue}
        onValueChange={(v) => setValue(Number(v))}
      />
    );
  };
};
const ReadTimeoutInput = ReadWriteTimeoutInput("read_timeout");
const WriteTimeoutInput = ReadWriteTimeoutInput("write_timeout");

type PortConfigGroupsProps = {
  serialConfig: OpenSerialPortReq;
  setSerialConfig: React.Dispatch<SetStateAction<OpenSerialPortReq>>;
  portDeviceStatus?: SerialPortInfo;
};
const PortConfigGroups = ({
  serialConfig,
  setSerialConfig,
  portDeviceStatus,
}: PortConfigGroupsProps) => {
  return (
    <div className="gap-3 pt-2 w-full">
      <div className="flex flex-row gap-1">
        <BaudRateInput
          value={serialConfig.baudRate}
          portStatus={portDeviceStatus?.port_status}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              baudRate: v,
            }))
          }
        />
        <ReadTimeoutInput
          value={serialConfig.readTimeout}
          portInfo={portDeviceStatus}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              readTimeout: v,
            }))
          }
        />
        <WriteTimeoutInput
          value={serialConfig.writeTimeout}
          portInfo={portDeviceStatus}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              writeTimeout: v,
            }))
          }
        />
      </div>
      <DataBitsRadio
        value={serialConfig.dataBits}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            dataBits: v,
          }))
        }
      />
      <FlowControlRadio
        value={serialConfig.flowControl}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            flowControl: v,
          }))
        }
      />
      <ParityRadio
        value={serialConfig.parity}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            parity: v,
          }))
        }
      />
      <StopBitsRadio
        value={serialConfig.stopBits}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            stopBits: v,
          }))
        }
      />
    </div>
  );
};

export default PortConfigGroups;
