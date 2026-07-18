"use client";

import { useEffect, useRef, useState } from "react";

/** Typewriter reveal that triggers once the element scrolls into view. */
export default function RevealText({
  text,
  className,
  speed = 18,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [visible, text, speed]);

  return (
    <p ref={ref} className={className}>
      {shown}
      {visible && shown.length < text.length && (
        <span className="text-cyan-300">_</span>
      )}
    </p>
  );
}
