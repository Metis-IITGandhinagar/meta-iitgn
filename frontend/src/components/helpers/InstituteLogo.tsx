import Image from "next/image";

/** Official IIT Gandhinagar emblem (source: iitgn.ac.in). Unaltered artwork. */
export function InstituteLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/iitgn-logo.svg"
      alt="IIT Gandhinagar emblem"
      width={size}
      height={size}
      unoptimized
      className={className}
    />
  );
}
