import Image from "next/image";

/** The Meta IITGN mark (book + arch). Decorative when paired with the wordmark. */
export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/meta-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      className={`rounded-[22%] ${className}`}
    />
  );
}
