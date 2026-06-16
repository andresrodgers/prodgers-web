import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-[100px] resize-none rounded-[13px] bg-[#EEF2F3] px-4 py-3 text-[13px] text-brand-primary outline-none transition-shadow placeholder:text-brand-secondary-light disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
