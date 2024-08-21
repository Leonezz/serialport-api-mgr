import { useTauriEvents } from "@/bridge/rust_events";
import RootLayout from "./layout/root";
import SerialDialog from "./components/dialog/serial_dialog";
const App = () => {
  // initilize tauri events
  useTauriEvents();

  return (
    <RootLayout>
      <SerialDialog />
    </RootLayout>
  );
};
export default App;
