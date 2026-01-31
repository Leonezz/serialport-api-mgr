/**
 * Breadcrumb Navigation Component
 *
 * Displays hierarchical navigation path with clickable links
 */

import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={`${item.href || item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="flex items-center gap-1 text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Convenience component for workspace home breadcrumb
export const workspaceItem: BreadcrumbItem = {
  label: "Workspace",
  href: "/",
  icon: Home,
};
