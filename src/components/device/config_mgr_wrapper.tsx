import SerialportDeviceConfigDetailView from "./serialport_device_config_detail_view";
import { SerialportDevice } from "@/types/device";

type SerialportDeviceConfigMgrProps = {
  value: SerialportDevice;
  configId: string;
  onValueChange: (v: Partial<SerialportDevice>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const SerialportDeviceConfigMgr = ({
  value,
  configId,
  onValueChange,
}: SerialportDeviceConfigMgrProps) => {
  return (
    <SerialportDeviceConfigDetailView
      value={value}
      configId={configId}
      onValueChange={onValueChange}
      verticalLayout
    />
  );
};

export { SerialportDeviceConfigMgr };
