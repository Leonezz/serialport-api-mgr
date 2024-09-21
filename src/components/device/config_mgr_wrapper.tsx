import SerialportDeviceConfigDetailView from "./serialport_device_config_detail_view";
import { SerialportDevice } from "@/types/device";

type SerialportDeviceConfigMgrProps = {
  value: SerialportDevice;
  onValueChange: (v: Partial<SerialportDevice>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const SerialportDeviceConfigMgr = ({
  value,
  onValueChange,
}: SerialportDeviceConfigMgrProps) => {
  return (
    <SerialportDeviceConfigDetailView
      value={value}
      onValueChange={onValueChange}
      verticalLayout
    />
  );
};

export { SerialportDeviceConfigMgr };
