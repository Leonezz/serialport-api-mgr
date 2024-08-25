import { Providers } from "../providers";
import { Nav, NavProps } from "@/components/shadcn/nav";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/shadcn/resizable";
import "@/index.css";
import { useState } from "react";
import { Toaster } from "@/components/shadcn/toaster";

export default function RootLayout({
  children,
  links,
  activeLink,
  setActiveLink,
}: Readonly<{
  children: React.ReactNode;
}> & {
  links: NavProps["links"];
  activeLink: string;
  setActiveLink: (link: string) => void;
}) {
  const [isCollapsed, setCollapsed] = useState(false);
  const panelMinWidth = 15;

  return (
    <Providers>
      <div className="h-screen min-h-96 overflow-hidden">
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
            <Nav
              isCollapsed={isCollapsed}
              links={links}
              activeLink={activeLink}
              setActiveLink={setActiveLink}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={panelMinWidth} className="p-2">
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
        <Toaster />
      </div>
    </Providers>
  );
}
