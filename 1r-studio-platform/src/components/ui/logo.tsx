import Image from "next/image";
import { clsx } from "clsx";

/** Official 1R. Studio wordmark — do not redesign or recolor. */
export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="1R. Studio"
      width={488}
      height={470}
      priority
      style={{ width: size, height: "auto" }}
      className={clsx("select-none", className)}
    />
  );
}
