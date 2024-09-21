import { PortConfigGroups } from "../port_config_groups";
import { SerialportConfig } from "@/types/serialport/serialport_config";

type SerialportConfigMgrDetailProps = {
  value: SerialportConfig;
  onValueChange: (v: Partial<SerialportConfig>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const SerialportConfigMgrDetail = ({
  value,
  onValueChange,
}: // onValueSave,
// onValueDelete,
SerialportConfigMgrDetailProps) => {
  return (
    <PortConfigGroups
      value={value}
      onValueChange={onValueChange}
      verticalLayout
    />
  );
};

export default SerialportConfigMgrDetail;
