import SerialPortDialog from "@/components/serialport_monitor";
import { DEFAULTMessageConfig } from "@/types/message/message_meta";
import { DEFAULTSerialportConfig } from "@/types/serialport/serialport_config";

const SerialPortMonitor = () => {
  return (
    <SerialPortDialog
      serial_port={DEFAULTSerialportConfig}
      message_meta={DEFAULTMessageConfig}
    />
  );
};

export default SerialPortMonitor;
