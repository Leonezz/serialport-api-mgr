import { OpenedPortStatus } from "@/bridge/types";
import { Checkbox } from "@nextui-org/react";
import { startCase } from "es-toolkit";
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
      <Checkbox checked={value} isReadOnly>
        {name}
      </Checkbox>
    );
  };
};

const CarrireDetectIndicator = OnOffIndicatorBuilder("carrire_detect");
const ClearToSendIndicator = OnOffIndicatorBuilder("clear_to_send");
const DataSetReadyIndicator = OnOffIndicatorBuilder("data_set_ready");
const RingIndicator = OnOffIndicatorBuilder("ring_indicator");

type SerialPortMiscIndicatorsProps = {
    value?: OpenedPortStatus | "Closed"
}
const SerialPortMiscIndicators = ({value}: SerialPortMiscIndicatorsProps) => {
    if (value === undefined || value === "Closed") {
        return <div className="w-full items-center justify-center flex">
        <p className="text-nowrap text-center text-2xl text-neutral-400 font-mono">Port Not Opened</p></div>
    }
    return <div className="w-full pt-2 flex flex-col gap-2">
        <p className="text-md font-bold align-top align-text-top">Port Status</p>
        <CarrireDetectIndicator value={!!(value?.Opened.carrire_detect)} />
        <ClearToSendIndicator value={!!(value?.Opened.clear_to_send)} />
        <DataSetReadyIndicator value={!!(value?.Opened.data_set_ready)} />
        <RingIndicator value={!!(value?.Opened.ring_indicator)} />
    </div>
}
export default SerialPortMiscIndicators;