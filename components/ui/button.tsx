import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[7px] whitespace-nowrap border border-transparent font-heading font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Amarillo solar — CTA principal */
        default:
          "rounded-[14px] bg-brand-accent text-brand-primary shadow-solar hover:brightness-95",
        /* Petróleo oscuro */
        secondary:
          "rounded-[14px] bg-brand-primary text-white shadow-dark-btn hover:bg-brand-primary-700",
        /* Ghost / borde suave */
        outline:
          "rounded-[14px] bg-white text-brand-primary shadow-prodgers-sm hover:bg-app-muted",
        /* Solo texto */
        ghost:
          "rounded-[13px] bg-transparent text-brand-primary hover:bg-app-muted",
        /* Peligro — borde rojo + texto rojo, fondo blanco */
        destructive:
          "rounded-[14px] border-[#C0492F] bg-white text-[#C0492F] hover:bg-[#f8e2dc]",
        link: "text-brand-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 rounded-[11px] px-[14px] text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[14px] [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "h-9 w-9 rounded-[11px] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "h-8 w-8 rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return <button data-slot="button" className={classes} {...props} />;
}

export { Button, buttonVariants };
