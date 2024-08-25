import { useTauriEvents } from "@/bridge/rust_events";
import RootLayout from "./layout/root";
import { Cable, Combine, Microchip, MonitorCog } from "lucide-react";
import { NavProps } from "./components/shadcn/nav";
import { useState } from "react";
import SerialPortMonitor from "./pages/serial_port_monitor";
import { v7 as uuid } from "uuid";
const links: NavProps["links"] = [
  {
    title: "Monitor",
    description: "Serialport Monitor",
    id: uuid(),
    icon: MonitorCog,
    variant: "default",
    page: SerialPortMonitor,
  },
  {
    title: "APIs",
    id: uuid(),
    description: "Serialport API with specific request and response",
    icon: Cable,
    variant: "ghost",
    page: () => <div>TBD</div>,
  },
  {
    title: "Devices",
    id: uuid(),
    description: "Serialport Device with multiple APIs",
    icon: Microchip,
    variant: "ghost",
    page: () => <div>TBD</div>,
  },
  {
    title: "Applications",
    id: uuid(),
    icon: Combine,
    description: "Application that takes complicated serialport communication",
    variant: "ghost",
    page: () => <div>TBD</div>,
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
      {<activeLink.page />}
    </RootLayout>
  );
};
export default App;
