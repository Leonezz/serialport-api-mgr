import { ReactNode } from "react";

type StyledTitleProps = {
  color?:
    | "primary"
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  size?: "large" | "medium" | "small";
};
export const StyledTitle = ({
  color = "primary",
  size = "medium",
  children,
}: StyledTitleProps & Readonly<{ children: ReactNode }>) => {
  return (
    <div className="flex flex-row">
      <span
        className={`flex flex-row text-${size} font-semibold items-center before:flex before:h-[77%] before:contents-[''] before:w-1 before:mr-1 before:rounded-sm before:bg-${color}`}
      >
        {children}
      </span>
    </div>
  );
};
