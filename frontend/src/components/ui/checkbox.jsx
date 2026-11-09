"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

function Checkbox({
  className,
  ...props
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group size-5 shrink-0 rounded-[6px] border border-input bg-card shadow-xs transition-[background-color,border-color,box-shadow,transform] duration-fast ease-out outline-none active:scale-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground motion-reduce:transition-none motion-reduce:active:scale-100 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      {/* forceMount keeps the check in the DOM so it can be drawn in and out via stroke-dashoffset */}
      <CheckboxPrimitive.Indicator
        forceMount
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-3.5">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke-dasharray:1_2] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-fast ease-in group-data-[state=checked]:[stroke-dashoffset:0] group-data-[state=checked]:delay-75 group-data-[state=checked]:duration-base group-data-[state=checked]:ease-out motion-reduce:transition-none"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
