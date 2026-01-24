/**
 * Application Routes
 *
 * Defines the routing structure for the application:
 * - / : Main workspace (current UI)
 * - /protocols : Protocol library
 * - /protocols/:id/edit : Protocol editor
 * - /protocols/:id/structures : Message structure designer
 * - /protocols/:id/commands : Command editor
 * - /devices : Device library
 * - /sequences/:id/edit : Sequence flow builder
 */

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
} from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "../components/ui/Button";
import ToastContainer from "../components/ui/Toast";
import { useStore } from "../lib/store";

// Lazy load pages for better performance
const MainWorkspace = React.lazy(() => import("../pages/MainWorkspace"));
const ProtocolLibrary = React.lazy(() => import("../pages/ProtocolLibrary"));
const ProtocolEditor = React.lazy(() => import("../pages/ProtocolEditor"));
const DeviceLibrary = React.lazy(() => import("../pages/DeviceLibrary"));
const CommandLibrary = React.lazy(() => import("../pages/CommandLibrary"));
const SequenceLibrary = React.lazy(() => import("../pages/SequenceLibrary"));
const SequenceEditor = React.lazy(() => import("../pages/SequenceEditor"));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

// Root layout with navigation
const RootLayout: React.FC = () => {
  const { toasts, removeToast } = useStore();

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <React.Suspense fallback={<PageLoader />}>
        <Outlet />
      </React.Suspense>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// Page header component for secondary pages
export const PageHeader: React.FC<{
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}> = ({ title, backTo = "/", backLabel = "Workspace", actions }) => (
  <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="flex items-center gap-3">
      <Link to={backTo}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      </Link>
      <div className="h-4 w-px bg-border" />
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// Home button for quick navigation
export const HomeButton: React.FC = () => (
  <Link to="/">
    <Button variant="ghost" size="icon" title="Back to Workspace">
      <Home className="w-4 h-4" />
    </Button>
  </Link>
);

// Create router with all routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <MainWorkspace />,
      },
      {
        path: "protocols",
        element: <ProtocolLibrary />,
      },
      {
        path: "protocols/:id/edit",
        element: <ProtocolEditor />,
      },
      {
        path: "protocols/:id/structures",
        element: <ProtocolEditor initialTab="structures" />,
      },
      {
        path: "protocols/:id/commands",
        element: <ProtocolEditor initialTab="commands" />,
      },
      {
        path: "devices",
        element: <DeviceLibrary />,
      },
      {
        path: "commands",
        element: <CommandLibrary />,
      },
      {
        path: "sequences",
        element: <SequenceLibrary />,
      },
      {
        path: "sequences/:id/edit",
        element: <SequenceEditor />,
      },
    ],
  },
]);

// App router component
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
