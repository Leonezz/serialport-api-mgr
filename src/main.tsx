import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement, {
  onRecoverableError: (err, errInfo) => {
    console.error(err);
    console.error(errInfo);
  },
}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
