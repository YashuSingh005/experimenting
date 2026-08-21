"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;
  springConfig?: { stiffness: number; damping: number };
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}

export function MagneticButton({
  children,
  strength = 0.3,
  springConfig = { stiffness: 300, damping: 30 },
  className = "",
  onClick,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-30, 30], [15, -15]);
  const rotateY = useTransform(springX, [-30, 30], [-15, 15]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      x.set(deltaX);
      y.set(deltaY);
    };

    const handleMouseEnter = () => {
      // The magnetic effect handles the visual feedback
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [x, y, strength]);

  return (
    <motion.button
      ref={ref}
      style={{
        x: springX,
        y: springY,
        rotateX,
        rotateY,
        transformPerspective: 500,
      }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}

interface RippleButtonProps {
  children: ReactNode;
  color?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function RippleButton({ children, color = "currentColor", className = "", onClick, disabled, type = "button" }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const idCounter = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idCounter.current++;

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
      type={type}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: color,
            transformOrigin: "center",
            pointerEvents: "none",
          }}
        />
      ))}
    </button>
  );
}