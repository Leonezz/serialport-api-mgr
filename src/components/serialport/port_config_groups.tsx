import BaudRateInput from "./baud_rate_input";
import DataBitsRadio from "./data_bits_radio";
import FlowControlRadio from "./flow_control_radio";
import ParityRadio from "./parity_radio";
import StopBitsRadio from "./stop_bits_radio";
import React, { SetStateAction, useState } from "react";
import { startCase } from "es-toolkit";
import { Input } from "@nextui-org/react";
import { OpenedPortStatus, SerialPortStatus } from "@/types/serialport/serialport_status";
import { SerialPortConfig } from "@/types/serialport/serialport_config";

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
  portInfo?: SerialPortStatus;
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
  serialConfig: SerialPortConfig;
  setSerialConfig: React.Dispatch<SetStateAction<SerialPortConfig>>;
  portDeviceStatus?: SerialPortStatus;
};
const PortConfigGroups = ({
  serialConfig,
  setSerialConfig,
  portDeviceStatus,
}: PortConfigGroupsProps) => {
  return (
    <div className=" space-y-2 pt-2 w-full">
      <div className="flex flex-row gap-1">
        <BaudRateInput
          value={serialConfig.baud_rate}
          portStatus={portDeviceStatus?.port_status}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              baud_rate: v,
            } satisfies SerialPortConfig))
          }
        />
        <ReadTimeoutInput
          value={serialConfig.read_timeout}
          portInfo={portDeviceStatus}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              read_timeout: v,
            } satisfies SerialPortConfig))
          }
        />
        <WriteTimeoutInput
          value={serialConfig.write_timeout}
          portInfo={portDeviceStatus}
          setValue={(v) =>
            setSerialConfig((prev) => ({
              ...prev,
              write_timeout: v,
            } satisfies SerialPortConfig))
          }
        />
      </div>
      <DataBitsRadio
        value={serialConfig.data_bits}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            data_bits: v,
          } satisfies SerialPortConfig))
        }
      />
      <FlowControlRadio
        value={serialConfig.flow_control}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            flow_control: v,
          } satisfies SerialPortConfig))
        }
      />
      <ParityRadio
        value={serialConfig.parity}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            parity: v,
          } satisfies SerialPortConfig))
        }
      />
      <StopBitsRadio
        value={serialConfig.stop_bits}
        portStatus={portDeviceStatus?.port_status}
        setValue={(v) =>
          setSerialConfig((prev) => ({
            ...prev,
            stop_bits: v,
          } satisfies SerialPortConfig))
        }
      />
    </div>
  );
};

export default PortConfigGroups;
