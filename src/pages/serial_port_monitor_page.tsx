import SerialPortMonitorDialog from "@/components/serialport_monitor";
import { DEFAULTMessageConfig } from "@/types/message/message_meta";
import { DEFAULTSerialportConfig } from "@/types/serialport/serialport_config";

const SerialPortMonitorPage = () => {
  return (
    <SerialPortMonitorDialog
      serial_port={DEFAULTSerialportConfig}
      message_meta={DEFAULTMessageConfig}
    />
  );
};

export default SerialPortMonitorPage;
