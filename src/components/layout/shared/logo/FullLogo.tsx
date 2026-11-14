"use client";

import Image from "next/image";
import Link from "next/link";

interface FullLogoProps {
  compact?: boolean;
}

const FullLogo = ({ compact = false }: FullLogoProps) => {
  const iconWidth = compact ? 28 : 32;
  const iconHeight = compact ? 31 : 36;
  const wordmarkWidth = compact ? 132 : 164;
  const wordmarkHeight = compact ? 17 : 21;

  return (
    <Link
      href="/"
      aria-label="Surabie.Dev"
      className={`flex w-fit min-w-0 items-center ${compact ? "gap-1.5" : "gap-2"}`}
    >
      <Image
        src="/images/logos/logo.png"
        alt=""
        width={iconWidth}
        height={iconHeight}
        className="shrink-0"
        priority
      />
      <Image
        src="/images/logos/logo-light.png"
        alt=""
        width={wordmarkWidth}
        height={wordmarkHeight}
        className="block h-auto shrink-0 dark:hidden"
        priority
      />
      <Image
        src="/images/logos/logo-dark.png"
        alt=""
        width={wordmarkWidth}
        height={wordmarkHeight}
        className="hidden h-auto shrink-0 dark:block"
        priority
      />
    </Link>
  );
};

export default FullLogo;
