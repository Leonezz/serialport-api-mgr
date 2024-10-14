import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { ERROR } from "./bridge/logging";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement, {
  onRecoverableError: (err, errInfo) => {
    ERROR("main", `${JSON.stringify(err)}, ${JSON.stringify(errInfo)}`);
  },
}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
