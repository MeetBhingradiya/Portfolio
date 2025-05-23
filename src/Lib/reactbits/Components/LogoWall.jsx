/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/default/
	26-1-2025
*/
"use client";
import { useState } from "react";
import "./LogoWall.scss";

function LogoWall({
  items = [],
  direction = "horizontal",
  pauseOnHover = false,
  size = "clamp(8rem, 1rem + 30vmin, 25rem)",
  duration = "60s",
  textColor = "#ffffff",
  bgColor = "#060606",
  bgAccentColor = "#111111"
}) {
  const [isPaused, setIsPaused] = useState(false);

  const wrapperClass = [
    "wrapper",
    direction === "vertical" && "wrapper--vertical"
  ]
    .filter(Boolean)
    .join(" ");

  const marqueeClass = [
    "marquee",
    direction === "vertical" && "marquee--vertical",
    isPaused && "paused"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={wrapperClass}
      style={{
        "--size": size,
        "--duration": duration,
        "--color-text": textColor,
        "--color-bg": bgColor,
        "--color-bg-accent": bgAccentColor
      }}
    >
      <div
        className={marqueeClass}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        <div className="marquee__group">
          {items.map((item, idx) => (
            <img key={idx} src={item.imgUrl} alt={item.altText} />
          ))}
        </div>
        <div className="marquee__group" aria-hidden="true">
          {items.map((item, idx) => (
            <img key={`dup1-${idx}`} src={item.imgUrl} alt={item.altText} />
          ))}
        </div>
      </div>

      <div
        className={`${marqueeClass} marquee--reverse`}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        <div className="marquee__group">
          {items.map((item, idx) => (
            <img key={`rev-${idx}`} src={item.imgUrl} alt={item.altText} />
          ))}
        </div>
        <div className="marquee__group" aria-hidden="true">
          {items.map((item, idx) => (
            <img key={`dup2-${idx}`} src={item.imgUrl} alt={item.altText} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default LogoWall;
