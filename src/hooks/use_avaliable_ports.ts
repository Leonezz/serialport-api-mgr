// import { emitToRustBus } from "@/bridge/call_rust";
// import { useState } from "react";
// import { debounce } from "es-toolkit";
// import useSerialportStatus from "./store/usePortStatus";
// import { SerialPortStatus } from "@/types/serialport/serialport_status";

// const useAvaliablePorts = () => {
//   const [portList, setPortList] = useState<SerialPortStatus[]>([]);
//   const { updateAvaliablePorts } = useSerialportStatus();
//   const reloadPortList = () => {
//     emitToRustBus("get_all_port_info", undefined)
//       .then((values) => {
//         console.log(values);
//         setPortList(values);
//         updateAvaliablePorts({ ports: values });
//       })
//       .catch((err) => console.error(`error get all port names: ${err}`));
//   };

//   const debouncedReloadPortList = debounce(reloadPortList, 300);

//   // useEffect(() => {
//   //   const handler = setInterval(debouncedReloadPortList, 10000);
//   //   return () => clearInterval(handler);
//   // }, []);

//   return { portList, debouncedReloadPortList };
// };

// export default useAvaliablePorts;
