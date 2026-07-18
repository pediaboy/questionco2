"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?";

interface DecodeTextProps {
  text: string;
  className?: string;
}

export default function DecodeText({ text, className = "" }: DecodeTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startScramble = () => {
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let iteration = 0;
    const textLength = text.length;

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            // Scramble index depending on current iteration progress
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
      });

      // Gradually reveal characters: standard reveal rate
      iteration += textLength / 12; 
      if (iteration >= textLength) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
      }
    }, 35);

    // Robust safety resolve after 500ms
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(text);
    }, 500);
  };

  const stopScramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayText(text);
  };

  useEffect(() => {
    setDisplayText(text);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text]);

  return (
    <motion.span
      className={className}
      onMouseDown={startScramble}
      onTouchStart={startScramble}
      onMouseUp={stopScramble}
      onTouchEnd={stopScramble}
      onMouseEnter={startScramble}
      onMouseLeave={stopScramble}
      whileTap={{ scale: 0.99 }}
      style={{ display: "inline-block", cursor: "pointer" }}
    >
      {displayText}
    </motion.span>
  );
}
