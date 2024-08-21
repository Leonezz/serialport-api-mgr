import { emitToRustBus, SerialPortInfo } from "@/bridge/call_rust";
import { useState } from "react";
import { debounce } from "es-toolkit";
import usePortStatus from "./store/usePortStatus";

const useAvaliablePorts = () => {
  const [portList, setPortList] = useState<SerialPortInfo[]>([]);
  const { updateAvaliablePorts } = usePortStatus();
  const reloadPortList = () => {
    emitToRustBus("get_all_port_info", undefined)
      .then((values) => {
        setPortList(values.map((value) => value));
        updateAvaliablePorts({ ports: values });
      })
      .catch((err) => console.error(`error get all port names: ${err}`));
  };

  const debouncedReloadPortList = debounce(reloadPortList, 3000);

  // useEffect(() => {
  //   const handler = setInterval(debouncedReloadPortList, 10000);
  //   return () => clearInterval(handler);
  // }, []);

  return { portList, debouncedReloadPortList };
};

export default useAvaliablePorts;
