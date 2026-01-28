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
  useRouteError,
  isRouteErrorResponse,
} from "react-router-dom";
import { ArrowLeft, Home, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";
import ToastContainer from "../components/ui/Toast";
import { useStore } from "../lib/store";

// Lazy load pages for better performance
const MainWorkspace = React.lazy(() => import("../pages/MainWorkspace"));
const ProtocolLibrary = React.lazy(() => import("../pages/ProtocolLibrary"));
const ProtocolEditor = React.lazy(() => import("../pages/ProtocolEditor"));
const DeviceLibrary = React.lazy(() => import("../pages/DeviceLibrary"));
const DeviceEditorPage = React.lazy(() => import("../pages/DeviceEditorPage"));
const CommandLibrary = React.lazy(() => import("../pages/CommandLibrary"));
const CommandEditorPage = React.lazy(
  () => import("../pages/CommandEditorPage"),
);
const SequenceLibrary = React.lazy(() => import("../pages/SequenceLibrary"));
const SequenceEditor = React.lazy(() => import("../pages/SequenceEditor"));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

// Error Boundary component for route errors
const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.data?.message || "An error occurred while loading this page.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center max-w-md p-6 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex justify-center gap-3 pt-4">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

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
    errorElement: <RouteErrorBoundary />,
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
        path: "devices/:id/edit",
        element: <DeviceEditorPage />,
      },
      {
        path: "commands",
        element: <CommandLibrary />,
      },
      {
        path: "commands/:id/edit",
        element: <CommandEditorPage />,
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
