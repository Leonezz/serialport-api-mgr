import { emitToRustBus } from "@/bridge/call_rust";
import { useState } from "react";
import { debounce } from "es-toolkit";
import usePortStatus from "./store/usePortStatus";
import { DEBUG } from "@/bridge/logging";
import { SerialPortInfo } from "@/bridge/types";

const useAvaliablePorts = () => {
  const [portList, setPortList] = useState<SerialPortInfo[]>([]);
  const { updateAvaliablePorts } = usePortStatus();
  const reloadPortList = () => {
    emitToRustBus("get_all_port_info", undefined)
      .then((values) => {
        console.log(values);
        setPortList(values);
        updateAvaliablePorts({ ports: values });
      })
      .catch((err) => console.error(`error get all port names: ${err}`));
  };

  const debouncedReloadPortList = debounce(reloadPortList, 300);

  // useEffect(() => {
  //   const handler = setInterval(debouncedReloadPortList, 10000);
  //   return () => clearInterval(handler);
  // }, []);

  return { portList, debouncedReloadPortList };
};

export default useAvaliablePorts;
