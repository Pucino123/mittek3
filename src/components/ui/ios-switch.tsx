import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const IOSSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // iOS exact dimensions - NEVER change width in any state
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      // Transition only background color - NOT dimensions
      "transition-colors duration-200 ease-in-out",
      // CRITICAL: Force exact pill dimensions with !important-like specificity
      "[width:51px] [min-width:51px] [max-width:51px]",
      "[height:31px] [min-height:31px] [max-height:31px]",
      // Background colors: #e9e9ea when off, Apple Green when on
      "bg-[#e9e9ea] data-[state=checked]:bg-[#34C759]",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    style={{ width: 51, minWidth: 51, maxWidth: 51, height: 31, minHeight: 31, maxHeight: 31 }}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // iOS thumb: 27x27px PERFECT CIRCLE
        "pointer-events-none block rounded-full bg-white",
        // CRITICAL: Force exact dimensions - never change
        "[width:27px] [min-width:27px] [max-width:27px]",
        "[height:27px] [min-height:27px] [max-height:27px]",
        // Crisp shadow like iOS
        "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.06)]",
        // Smooth slide animation - only transform, never dimensions
        "ring-0 transition-transform duration-200 ease-in-out",
        // Position: 2px from edge when off, slides to right when on
        "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5"
      )}
      style={{ width: 27, minWidth: 27, maxWidth: 27, height: 27, minHeight: 27, maxHeight: 27 }}
    />
  </SwitchPrimitives.Root>
));
IOSSwitch.displayName = "IOSSwitch";

export { IOSSwitch };
