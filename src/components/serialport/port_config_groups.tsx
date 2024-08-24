import { OpenSerialPortReq } from "@/bridge/call_rust";
import BaudRateInput from "./baud_rate_input";
import DataBitsRadio from "./data_bits_radio";
import FlowControlRadio from "./flow_control_radio";
import ParityRadio from "./parity_radio";
import StopBitsRadio from "./stop_bits_radio";
import React, { SetStateAction, useState } from "react";
import { OpenedPortStatus, SerialPortInfo } from "@/bridge/types";
import { startCase } from "es-toolkit";
import { Input, TimeInputProps } from "@nextui-org/react";

const TimeUnitsOptions = ["s", "ms", "us", "ns"] as const;
export type TimeUnits = (typeof TimeUnitsOptions)[number];

const convertTimeUnit = (value: number, from: TimeUnits, to: TimeUnits) => {
  const fromIdx = TimeUnitsOptions.indexOf(from);
  const toIdx = TimeUnitsOptions.indexOf(to);
  const diff = toIdx - fromIdx;
  if (diff > 0) {
    return value * Math.pow(1000, diff);
  }
  if (diff < 0) {
    return value / Math.pow(1000, -diff);
  }
  return value;
};

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
    const [timeUnit, setTimeUnit] = useState<TimeUnits>("ms");

    const defaultValue = convertTimeUnit(
      portOpened
        ? (portInfo.port_status as OpenedPortStatus).Opened[inputFor]
        : value,
      "ns",
      timeUnit
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
        endContent={
          <div className="flex items-center">
            <label className="sr-only" htmlFor="timeunit">
              Time Unit
            </label>
            <select
              id="timeunit"
              name="timeunit"
              className="outline-none border-0 bg-transparent w-min text-small font-mono"
              defaultValue={timeUnit}
              onChange={(select) => {
                setTimeUnit(select.target.value as TimeUnits)
              }}
            >
              {TimeUnitsOptions.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          </div>
        }
        type="number"
        isReadOnly={portOpened}
        defaultValue={defaultValue}
        value={defaultValue}
        onValueChange={(v) => {
          setValue(convertTimeUnit(Number(v), timeUnit, "ns"));
        }}
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
