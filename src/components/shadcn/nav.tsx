"use client";

import { LucideIcon } from "lucide-react";
import { Tooltip, Button } from "@nextui-org/react";

export interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    id: string;
    description?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
    page: () => JSX.Element;
  }[];
}

export function Nav({
  links,
  isCollapsed,
  activeLink,
  setActiveLink,
}: NavProps & { activeLink: string; setActiveLink: (link: string) => void }) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((l) => {
          const toolTipContent = (
            <span className="ml-auto text-muted-foreground">
              {l.description || l.title}
            </span>
          );
          return isCollapsed ? (
            <Tooltip key={l.id} delay={1000} content={toolTipContent}>
              <Button
                isIconOnly
                onClick={() => {
                  if (activeLink === l.id) {
                    return;
                  }
                  setActiveLink(l.id);
                }}
                variant={l.id === activeLink ? "solid" : "ghost"}
                color="secondary"
                className="w-5/6"
              >
                <l.icon />
              </Button>
            </Tooltip>
          ) : (
            <Button
              key={l.id}
              onClick={() => {
                if (activeLink === l.id) {
                  return;
                }
                setActiveLink(l.id);
              }}
              color="secondary"
              variant={l.id === activeLink ? "solid" : "light"}
              startContent={<l.icon className="h-4 w-4" />}
              className="w-full justify-start"
            >
              {l.title}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
