/**
 *  @FileID          Lib\reactbits\Animations\AnimatedContent.jsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 *  @modified 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 */


/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/default/
	26-1-2025
*/
"use client";
import { useRef, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

const AnimatedContent = ({
  children,
  distance = 100,
  direction = "vertical",
  reverse = false,
  config = { tension: 50, friction: 25 },
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold]);

  const directions = {
    vertical: "Y",
    horizontal: "X",
  };

  const springProps = useSpring({
    from: {
      transform: `translate${directions[direction]}(${reverse ? `-${distance}px` : `${distance}px`}) scale(${scale})`,
      opacity: animateOpacity ? initialOpacity : 1,
    },
    to: inView
      ? { transform: "translateY(0px) scale(1)", opacity: 1 }
      : undefined,
    config,
  });

  return (
    <animated.div ref={ref} style={springProps}>
      {children}
    </animated.div>
  );
};

export default AnimatedContent;
