import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[0.625rem] bg-primary text-base font-semibold text-primary-foreground select-none ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* Replace with: <Image src="/logo.png" alt="Yashu" width={size} height={size} className="object-contain" /> */}
      <span aria-hidden="true">Y</span>
    </div>
  );
}
