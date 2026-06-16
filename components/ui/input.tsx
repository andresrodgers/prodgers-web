import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[42px] w-full min-w-0 rounded-[13px] border border-transparent bg-[#EEF2F3] px-[14px] text-[14px] text-brand-primary outline-none transition placeholder:text-brand-secondary-light",
        "focus:border-brand-primary focus:shadow-[0_0_0_4px_rgba(11,45,61,.08)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-st-red aria-invalid:bg-[#fbeeea]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input };
