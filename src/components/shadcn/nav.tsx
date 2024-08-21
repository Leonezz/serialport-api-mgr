"use client";

import { createLucideIcon, LucideIcon } from "lucide-react";
import { Tooltip, Link, cn, Button, Image } from "@nextui-org/react";
import { Fragment } from "react/jsx-runtime";

export interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const toolTipContent = (
            <Fragment>
              {link.title}
              {link.label && (
                <span className="ml-auto text-muted-foreground">
                  {link.label}
                </span>
              )}
            </Fragment>
          );
          return isCollapsed ? (
            <Tooltip key={index} delay={0} content={toolTipContent}>
              <Button isIconOnly variant="ghost" color="secondary">
                <link.icon />
              </Button>
            </Tooltip>
          ) : (
            <Button
              key={index}
              color="secondary"
              variant="flat"
              startContent={<link.icon className="mr-2 h-4 w-4" />}
              endContent={
                link.label && (
                  <span
                    className={cn(
                      "ml-auto",
                      link.variant === "default" &&
                        "text-background dark:text-white"
                    )}
                  >
                    {link.label}
                  </span>
                )
              }
            >
              {link.title}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
