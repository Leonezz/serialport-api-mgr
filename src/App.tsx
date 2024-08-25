import { useTauriEvents } from "@/bridge/rust_events";
import RootLayout from "./layout/root";
import SerialPortDialog from "./components/dialog/serial_dialog";
import { defaultSerialPortConfig } from "./types/serialport/serialport_config";
const App = () => {
  // initilize tauri events
  useTauriEvents();

  return (
    <RootLayout>
      <SerialPortDialog
        serial_port={defaultSerialPortConfig()}
        message_meta={{
          viewMode: "Text",
          crlf: "CRLF",
          textEncoding: "utf-8",
          checkSum: "None"
        }}
      />
    </RootLayout>
  );
};
export default App;
