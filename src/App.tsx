import { useTauriEvents } from "@/bridge/rust_events";
import RootLayout from "./layout/root";
import {
  Combine,
  FileSliders,
  Logs,
  Microchip,
  MonitorCog,
} from "lucide-react";
import { NavProps } from "./components/shadcn/nav";
import { useState } from "react";
import SerialPortMonitorPage from "./pages/serial_port_monitor_page";
import { v7 as uuid } from "uuid";
import { ConfigMgrPage } from "./pages/config_mgr_page";
import { DeviceTesterPage } from "./pages/device_tester_page";
import { SerialportLogs } from "./pages/serialport_logs";

const links: NavProps["links"] = [
  {
    title: "Monitor",
    description: "Serialport Monitor",
    id: uuid(),
    icon: MonitorCog,
    variant: "default",
    page: SerialPortMonitorPage,
  },
  {
    title: "Configs",
    description: "Configurations for serialport hardware and messages",
    id: uuid(),
    icon: FileSliders,
    variant: "default",
    page: ConfigMgrPage,
  },
  {
    title: "Devices",
    id: uuid(),
    description: "Serialport Device with configs and conversations",
    icon: Microchip,
    variant: "ghost",
    page: DeviceTesterPage,
  },
  {
    title: "Applications",
    id: uuid(),
    icon: Combine,
    description: "Application that takes complicated serialport communication",
    variant: "ghost",
    page: () => <div>TBD</div>,
  },
  {
    title: "Logs",
    id: uuid(),
    icon: Logs,
    description: "Serialport communication logs",
    variant: "ghost",
    page: SerialportLogs,
  },
];

const App = () => {
  // initilize tauri events
  useTauriEvents();

  const [activeLinkId, setActiveLinkId] = useState(links[0].id);
  const activeLink = links.find((v) => v.id === activeLinkId);

  if (!activeLink) {
    return <div>Oops...</div>;
  }

  return (
    <RootLayout
      links={links}
      activeLink={activeLinkId}
      setActiveLink={setActiveLinkId}
    >
      <activeLink.page />
    </RootLayout>
  );
};
export default App;
