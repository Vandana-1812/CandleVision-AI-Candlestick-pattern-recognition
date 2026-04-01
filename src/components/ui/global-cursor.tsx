"use client";

import { useEffect, useRef, useState } from 'react';

const TRAIL_LENGTH = 12;

export function GlobalCursor() {
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const cursorTargetRef = useRef({ x: -100, y: -100 });
  const cursorRenderRef = useRef({ x: -100, y: -100 });
  const trailRenderRef = useRef(Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 })));
  const [trail, setTrail] = useState(Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 })));
  const [cursorActive, setCursorActive] = useState(false);

  useEffect(() => {
    let frameId = 0;

    document.body.classList.add('site-cursor-enabled');

    const animateCursor = () => {
      const target = cursorTargetRef.current;
      const render = cursorRenderRef.current;

      render.x += (target.x - render.x) * 0.2;
      render.y += (target.y - render.y) * 0.2;

      setCursor({ x: render.x, y: render.y });

      const points = trailRenderRef.current;
      points[0] = { x: render.x, y: render.y };
      for (let i = 1; i < points.length; i += 1) {
        points[i] = {
          x: points[i].x + (points[i - 1].x - points[i].x) * 0.34,
          y: points[i].y + (points[i - 1].y - points[i].y) * 0.34,
        };
      }
      setTrail([...points]);

      frameId = requestAnimationFrame(animateCursor);
    };

    const handleMove = (event: MouseEvent) => {
      cursorTargetRef.current = { x: event.clientX, y: event.clientY };
      const target = event.target as HTMLElement | null;
      setCursorActive(
        Boolean(target?.closest('a,button,input,textarea,select,[role="button"],[data-cursor="active"]'))
      );
    };

    frameId = requestAnimationFrame(animateCursor);
    window.addEventListener('mousemove', handleMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMove);
      document.body.classList.remove('site-cursor-enabled');
    };
  }, []);

  return (
    <>
      {trail.map((point, index) => (
        <div
          key={index}
          className="guest-cursor-trail hidden md:block"
          style={{
            transform: `translate3d(${point.x - 4}px, ${point.y - 4}px, 0) scale(${1 - index * 0.055})`,
            opacity: `${Math.max(0.06, 0.84 - index * 0.07)}`,
          }}
        />
      ))}
      <div
        className={`guest-cursor-dot hidden md:block ${cursorActive ? 'guest-cursor-dot-active' : ''}`}
        style={{ transform: `translate3d(${cursor.x - 5}px, ${cursor.y - 5}px, 0)` }}
      />
    </>
  );
}
