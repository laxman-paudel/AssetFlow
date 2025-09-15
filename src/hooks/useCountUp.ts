'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountUp(endValue: number, duration: number = 500) {
  const [count, setCount] = useState(endValue);
  const prevValueRef = useRef(endValue);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const startValue = prevValueRef.current;
    let currentFrame = 0;

    const counter = () => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const currentValue = startValue + (endValue - startValue) * progress;

      if (progress < 1) {
        setCount(currentValue);
        animationFrameId.current = requestAnimationFrame(counter);
      } else {
        setCount(endValue);
        prevValueRef.current = endValue;
      }
    };

    if (endValue !== prevValueRef.current) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(counter);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [endValue, duration, totalFrames]);

  return count;
}
