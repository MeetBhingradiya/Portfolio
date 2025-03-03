/**
 *  @FileID          Lib\reactbits\Components\Dock.jsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/default/
	26-1-2025
*/
"use client";
import { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './Dock.scss'; // Import your CSS for styling

const Dock = ({ position = 'bottom', collapsible = false, responsive = 'bottom' }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isDockVisible, setDockVisible] = useState(!collapsible);
  const [currentPosition, setCurrentPosition] = useState(position);

  const dockItems = ['🍕', '🍔', '🌭', '🌮', '🌯'];

  const handleMouseEnter = (index) => {
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleParentMouseEnter = () => {
    if (collapsible) {
      setDockVisible(true);
    }
  };

  const handleParentMouseLeave = () => {
    if (collapsible) {
      setDockVisible(false);
    }
  };

  // Update position based on screen size and responsive prop
  useEffect(() => {
    const updatePosition = () => {
      if (responsive && window.innerWidth <= 768) { // Adjust threshold as needed
        setCurrentPosition(responsive);
      } else {
        setCurrentPosition(position);
      }
    };

    updatePosition(); // Initial update

    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position, responsive, collapsible]);

  const getDockStyle = () => {
    const flexDirection = currentPosition === 'left' || currentPosition === 'right' ? 'column' : 'row';
    return { flexDirection };
  };

  const scaleSpring = (index) => {
    const translateValue = (() => {
      if (hoverIndex === index) {
        switch (currentPosition) {
          case 'left':
            return 'translateX(5px) translateY(0px)';
          case 'right':
            return 'translateX(-5px) translateY(0px)';
          case 'top':
            return 'translateX(0px) translateY(5px)';
          case 'bottom':
            return 'translateX(0px) translateY(-5px)';
          default:
            return 'translateX(0px) translateY(0px)';
        }
      } else {
        return 'translateX(0px) translateY(0px)';
      }
    })();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSpring({
      transform:
        hoverIndex === index
          ? `scale(1.5) ${translateValue}`
          : hoverIndex !== null && Math.abs(hoverIndex - index) === 1
            ? `scale(1.3) translateX(0px) translateY(0px)`
            : `scale(1) translateX(0px) translateY(0px)`,
      config: { tension: 200, friction: 15 },
    });
  };

  const visibilitySpring = useSpring({
    opacity: isDockVisible ? 1 : 0,
    config: { tension: 120, friction: 14 },
  });

  return (
    <div
      className={`dock-container ${currentPosition}`}
      onMouseEnter={handleParentMouseEnter}
      onMouseLeave={handleParentMouseLeave}
    >
      <animated.div className="dock" style={{ ...getDockStyle(), ...visibilitySpring }}>
        {dockItems.map((item, index) => (
          <animated.div
            key={item}
            className="dock-item"
            style={scaleSpring(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {item}
          </animated.div>
        ))}
      </animated.div>
    </div>
  );
};

export default Dock;
