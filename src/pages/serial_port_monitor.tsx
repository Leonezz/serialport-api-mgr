import SerialPortDialog from "@/components/dialog/serial_dialog";
import { DEFAULTMessageConfig } from "@/types/message/message_meta";
import { DEFAULTSerialPortConfig } from "@/types/serialport/serialport_config";

const SerialPortMonitor = () => {
  return (
    <SerialPortDialog
      serial_port={DEFAULTSerialPortConfig}
      message_meta={DEFAULTMessageConfig}
    />
  );
};

export default SerialPortMonitor;
