/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/default/
	26-1-2025
*/
"use client";
import { useState, useEffect, useRef } from "react";

const Magnet = ({
  children,
  /** Distance around the magnet where the mouse can activate it. */
  padding = 100,
  /** Disables the magnet effect entirely. */
  disabled = false,
  /** Controls how strong the magnet pull is. Higher = less offset. */
  magnetStrength = 2,
  /** Transition when the magnet is active (mouse in range). */
  activeTransition = "transform 0.3s ease-out",
  /** Transition when the magnet is inactive (mouse out of range). */
  inactiveTransition = "transform 0.5s ease-in-out",
  /** Optional class for the outer wrapper. */
  wrapperClassName = "",
  /** Optional class for the moving/inner element. */
  innerClassName = "",
  ...props
}) => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e) => {
      if (!magnetRef.current) return;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);

        const offsetX = (e.clientX - centerX) / magnetStrength;
        const offsetY = (e.clientY - centerY) / magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [padding, disabled, magnetStrength]);

  const transitionStyle = isActive ? activeTransition : inactiveTransition;

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{ position: "relative", display: "inline-block" }}
      {...props}
    >
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: transitionStyle,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
