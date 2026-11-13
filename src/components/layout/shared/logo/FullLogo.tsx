"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <>
      {/* Dark Logo */}
      <Image
        src="/images/logos/logo-light.png"
        alt="logo"
        width={230}
        height={32}
        className="block dark:hidden rtl:scale-x-[-1]"
        priority={true}
      />
      {/* Light Logo */}
      <Image
        src="/images/logos/logo-dark.png"
        alt="logo"
        width={230}
        height={32}
        className="hidden dark:block rtl:scale-x-[-1]"
        priority={true}
      />
    </>
  );
};

export default FullLogo;
