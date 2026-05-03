import Image from "next/image";

const SIZES = {
  sm: 26,
  md: 46,
  lg: 58,
};

interface BrandMarkProps {
  size?: keyof typeof SIZES;
  className?: string;
}

export default function BrandMark({
  size = "md",
  className = "",
}: BrandMarkProps) {
  const pixels = SIZES[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded border border-white/15 bg-black/80 shadow-[0_0_18px_rgba(181,202,212,0.12)] ${className}`}
      style={{ width: pixels, height: pixels }}
      aria-hidden="true"
    >
      <Image
        src="/brand-icon.png"
        alt=""
        width={pixels}
        height={pixels}
        className="h-full w-full object-cover"
        priority={size !== "sm"}
      />
    </span>
  );
}
