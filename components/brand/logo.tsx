import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markOnly?: boolean;
  variant?: "onLight" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { px: 28, text: "text-base" },
  md: { px: 36, text: "text-xl" },
  lg: { px: 44, text: "text-2xl" },
};

export function Logo({
  className,
  markOnly = false,
  variant = "onLight",
  size = "md",
}: LogoProps) {
  const asset =
    variant === "onDark"
      ? "/brand/prodgers-isotipo-on-dark.svg"
      : "/brand/prodgers-isotipo-on-light.svg";

  const color = variant === "onDark" ? "text-white" : "text-brand-primary";
  const px = sizeMap[size].px;

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={asset}
        width={px}
        height={px}
        alt="Isotipo PRODGERS"
        priority
        className="shrink-0"
        style={{ width: px, height: "auto" }}
      />
      {!markOnly && (
        <span className={cn("font-heading font-semibold tracking-normal", color, sizeMap[size].text)}>
          PRODGERS
        </span>
      )}
    </div>
  );
}
