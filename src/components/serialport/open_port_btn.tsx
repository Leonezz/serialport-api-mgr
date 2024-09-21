import useClosePort from "@/hooks/commands/useClosePort";
import useOpenPort from "@/hooks/commands/useOpenPort";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { Button } from "@nextui-org/react";

type OpenPortBtnProps = {
  serialportConfig: SerialportConfig;
};
const OpenPortBtn = ({
  serialportConfig: serialport_config,
}: OpenPortBtnProps) => {
  const { getPortOpened } = useSerialportStatus();
  const portOpened = getPortOpened({ port_name: serialport_config.port_name });
  const { portClosing, closePort } = useClosePort();
  const { portOpening, openPort } = useOpenPort();

  return (
    <Button
      color="danger"
      onClick={() => {
        const fn = portOpened ? closePort : openPort;
        fn(serialport_config);
      }}
      isLoading={portOpening || portClosing}
      isDisabled={serialport_config.port_name.length === 0}
    >
      {portOpened ? "Close" : "Open"}
    </Button>
  );
};

export default OpenPortBtn;
