import {
  convertPortTypeToString,
  SerialPortStatus,
  USBPortInfo,
} from "@/types/serialport/serialport_status";
import { Checkbox, Snippet } from "@nextui-org/react";
import { startCase } from "es-toolkit";
import { StyledTitle } from "../basics/styled_title";
type OnOffIndicatorProps = {
  value: boolean;
};
const OnOffIndicatorBuilder = <
  T1 extends
    | "carrire_detect"
    | "clear_to_send"
    | "data_set_ready"
    | "ring_indicator"
>(
  indicatorFor: T1
) => {
  const name = startCase(indicatorFor);
  return ({ value }: OnOffIndicatorProps) => {
    return (
      <Checkbox checked={value} isReadOnly className="w-max">
        {name}
      </Checkbox>
    );
  };
};

const CarrireDetectIndicator = OnOffIndicatorBuilder("carrire_detect");
const ClearToSendIndicator = OnOffIndicatorBuilder("clear_to_send");
const DataSetReadyIndicator = OnOffIndicatorBuilder("data_set_ready");
const RingIndicator = OnOffIndicatorBuilder("ring_indicator");

const SerialPortTypeCard = ({
  type,
}: {
  type: SerialPortStatus["port_type"];
}) => {
  const portType = convertPortTypeToString(type);
  const Title = (
    <div className="flex flex-row gap-5 items-center">
      <StyledTitle size="medium">Port Type</StyledTitle>
      <span>{portType}</span>
    </div>
  );
  if (portType !== "USB") {
    return Title;
  }
  const { UsbPort: usbProps } = type as { UsbPort: USBPortInfo };
  // TODO: TBD
  return (
    <div>
      {Title}
      <Snippet>
        <code>{usbProps.product}</code>
      </Snippet>
      <Snippet>
        <code>{usbProps.manufacturer}</code>
      </Snippet>
      <Snippet>
        <code>{usbProps.serial_number}</code>
      </Snippet>
      <Snippet>
        <code>{usbProps.vid.toString(16)}</code>
      </Snippet>
      <Snippet>
        <code>{usbProps.pid.toString(16)}</code>
      </Snippet>
    </div>
  );
};

type SerialPortMiscIndicatorsProps = {
  status?: SerialPortStatus["port_status"];
};
const SerialPortMiscIndicators = ({
  status,
}: SerialPortMiscIndicatorsProps) => {
  if (status === undefined || status === "Closed") {
    return (
      <div className="items-center justify-center flex">
        <p className="w-max text-nowrap text-center text-2xl text-neutral-400 font-mono">
          Port Not Opened
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-row flex-wrap gap-2">
      <StyledTitle size="medium">Port Status</StyledTitle>
      <CarrireDetectIndicator value={!!status?.Opened.carrire_detect} />
      <ClearToSendIndicator value={!!status?.Opened.clear_to_send} />
      <DataSetReadyIndicator value={!!status?.Opened.data_set_ready} />
      <RingIndicator value={!!status?.Opened.ring_indicator} />
    </div>
  );
};
export { SerialPortMiscIndicators, SerialPortTypeCard };
