/**
 * App Component
 *
 * Root component that sets up the application router.
 * All page rendering is handled by React Router.
 */

import React from "react";
import { AppRouter } from "./routes";

const App: React.FC = () => {
  return <AppRouter />;
};

export default App;
