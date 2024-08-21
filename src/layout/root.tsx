import { Providers } from "../providers";
import { Nav, NavProps } from "@/components/shadcn/nav";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/shadcn/resizable";
import "@/index.css";
import { useState } from "react";
import { LucideSatelliteDish, LucideScale } from "lucide-react";
import { Toaster } from "@/components/shadcn/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setCollapsed] = useState(false);
  const panelMinWidth = 15;
  const links: NavProps["links"] = [
    {
      title: "nav1",
      label: "nav1",
      icon: LucideSatelliteDish,
      variant: "default",
    },
    {
      title: "nav2",
      label: "nav2",
      icon: LucideScale,
      variant: "ghost",
    },
  ];
  return (
    <html lang="en">
      <Providers>
        <body className="h-screen min-h-96 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="p-2 h-full">
            <ResizablePanel
              collapsible
              collapsedSize={5}
              defaultSize={5}
              minSize={panelMinWidth}
              maxSize={15}
              className="p-2"
              onCollapse={() => setCollapsed(true)}
              onExpand={() => setCollapsed(false)}
            >
              <Nav isCollapsed={isCollapsed} links={links} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={panelMinWidth} className="p-2">
              {children}
            </ResizablePanel>
          </ResizablePanelGroup>
          <Toaster />
        </body>
      </Providers>
    </html>
  );
}
