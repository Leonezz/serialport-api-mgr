/**
 * App Component
 *
 * Root component that sets up the application router.
 * All page rendering is handled by React Router.
 */

import React from "react";
import { AppRouter } from "./routes";
import { useProtocolSync } from "./hooks/useProtocolSync";

/**
 * Protocol sync initializer component
 * Runs sync on app load without rendering anything
 */
const ProtocolSyncInitializer: React.FC = () => {
  // This hook handles automatic sync on load and when protocols change
  useProtocolSync();
  return null;
};

const App: React.FC = () => {
  return (
    <>
      <ProtocolSyncInitializer />
      <AppRouter />
    </>
  );
};

export default App;
