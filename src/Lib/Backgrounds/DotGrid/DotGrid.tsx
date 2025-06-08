/*
	Installed from https://reactbits.dev/ts/tailwind/
*/

import React, { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(InertiaPlugin);

interface InertiaDot extends HTMLDivElement {
	_inertiaApplied: boolean;
}

interface DotCentre {
	el: InertiaDot;
	x: number;
	y: number;
}

export interface DotGridProps {
	dotSize?: number;
	gap?: number;
	baseColor?: string;
	activeColor?: string;
	proximity?: number;
	speedTrigger?: number;
	shockRadius?: number;
	shockStrength?: number;
	maxSpeed?: number;
	resistance?: number;
	returnDuration?: number;
	className?: string;
	style?: React.CSSProperties;
}

const DotGrid: React.FC<DotGridProps> = ({
	dotSize = 16,
	gap = 32,
	baseColor = "#00d8ff",
	activeColor = "#00d8ff",
	proximity = 150,
	speedTrigger = 100,
	shockRadius = 250,
	shockStrength = 5,
	maxSpeed = 5000,
	resistance = 750,
	returnDuration = 1.5,
	className = "",
	style,
}) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const dotsRef = useRef<InertiaDot[]>([]);
	const centresRef = useRef<DotCentre[]>([]);

	const buildGrid = useCallback((): void => {
		const container = containerRef.current;
		if (!container) return;

		container.innerHTML = "";
		dotsRef.current = [];
		centresRef.current = [];

		const { clientWidth: w, clientHeight: h } = container;
		const cols = Math.floor((w + gap) / (dotSize + gap));
		const rows = Math.floor((h + gap) / (dotSize + gap));
		const total = cols * rows;

		for (let i = 0; i < total; i++) {
			const dot = document.createElement("div") as InertiaDot;

			dot.className = "rounded-full will-change-contents";
			dot.style.width = `${dotSize}px`;
			dot.style.height = `${dotSize}px`;
			dot.style.transformOrigin = "center";
			dot.style.willChange = "transform,background-color";

			dot._inertiaApplied = false;
			gsap.set(dot, { x: 0, y: 0, backgroundColor: baseColor });
			container.appendChild(dot);
			dotsRef.current.push(dot);
		}

		requestAnimationFrame(() => {
			centresRef.current = dotsRef.current.map((el) => {
				const r = el.getBoundingClientRect();
				return {
					el,
					x: r.left + window.scrollX + r.width / 2,
					y: r.top + window.scrollY + r.height / 2,
				};
			});
		});
	}, [dotSize, gap, baseColor]);

	useEffect(() => {
		buildGrid();
		const ro = new ResizeObserver(buildGrid);
		if (containerRef.current) ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, [buildGrid]);

	useEffect(() => {
		let lastTime = 0;
		let lastX = 0;
		let lastY = 0;

		const onMove = (e: MouseEvent): void => {
			const now = performance.now();
			const dt = now - (lastTime || now);
			const dx = e.pageX - lastX;
			const dy = e.pageY - lastY;
			let vx = (dx / dt) * 1000;
			let vy = (dy / dt) * 1000;
			let speed = Math.hypot(vx, vy);

			if (speed > maxSpeed) {
				const s = maxSpeed / speed;
				vx *= s;
				vy *= s;
				speed = maxSpeed;
			}

			lastTime = now;
			lastX = e.pageX;
			lastY = e.pageY;

			requestAnimationFrame(() => {
				centresRef.current.forEach(({ el, x, y }) => {
					const dist = Math.hypot(x - e.pageX, y - e.pageY);
					const interp = Math.max(0, 1 - dist / proximity);
					gsap.set(el, {
						backgroundColor: gsap.utils.interpolate(
							baseColor,
							activeColor,
							interp
						),
					});

					if (
						speed > speedTrigger &&
						dist < proximity &&
						!el._inertiaApplied
					) {
						el._inertiaApplied = true;
						const pushX = x - e.pageX + vx * 0.005;
						const pushY = y - e.pageY + vy * 0.005;

						gsap.to(el, {
							inertia: { x: pushX, y: pushY, resistance },
							onComplete: () => {
								gsap.to(el, {
									x: 0,
									y: 0,
									duration: returnDuration,
									ease: "elastic.out(1,0.75)",
								});
								el._inertiaApplied = false;
							},
						});
					}
				});
			});
		};

		const onClick = (e: MouseEvent): void => {
			centresRef.current.forEach(({ el, x, y }) => {
				const dist = Math.hypot(x - e.pageX, y - e.pageY);
				if (dist < shockRadius && !el._inertiaApplied) {
					el._inertiaApplied = true;
					const falloff = Math.max(0, 1 - dist / shockRadius);
					const pushX = (x - e.pageX) * shockStrength * falloff;
					const pushY = (y - e.pageY) * shockStrength * falloff;

					gsap.to(el, {
						inertia: { x: pushX, y: pushY, resistance },
						onComplete: () => {
							gsap.to(el, {
								x: 0,
								y: 0,
								duration: returnDuration,
								ease: "elastic.out(1,0.75)",
							});
							el._inertiaApplied = false;
						},
					});
				}
			});
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("click", onClick);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("click", onClick);
		};
	}, [
		baseColor,
		activeColor,
		proximity,
		speedTrigger,
		shockRadius,
		shockStrength,
		maxSpeed,
		resistance,
		returnDuration,
	]);

	return (
		<section
			className={`relative flex items-center justify-center p-4 h-full w-full ${className}`}
			style={style}
		>
			<div className="w-full h-full relative">
				<div
					ref={containerRef}
					className="absolute inset-0 flex pointer-events-none"
					style={{ gap: `${gap}px`, flexWrap: "wrap" }}
				/>
			</div>
		</section>
	);
};

export default DotGrid;
