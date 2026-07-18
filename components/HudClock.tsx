"use client";

import React, { useEffect, useState } from "react";

export default function HudClock() {
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState({
    day: "19",
    month: "JUL",
    year: "2026",
    hour: "00",
    minute: "00",
    second: "00",
  });

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const d = new Date();
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).formatToParts(d);

        let day = "19";
        let month = "JUL";
        let year = "2026";
        let hour = "00";
        let minute = "00";
        let second = "00";

        for (const part of parts) {
          if (part.type === "day") day = part.value;
          else if (part.type === "month") month = part.value.toUpperCase();
          else if (part.type === "year") year = part.value;
          else if (part.type === "hour") hour = part.value;
          else if (part.type === "minute") minute = part.value;
          else if (part.type === "second") second = part.value;
        }

        setTimeStr({ day, month, year, hour, minute, second });
      } catch (err) {
        console.error("Error formatting date:", err);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="font-mono text-[10px] text-[#94A3B8] select-none mt-0.5">
        [ 19 JUL 2026 : --:--:-- WIB ]
      </div>
    );
  }

  return (
    <div className="font-mono text-[10px] text-[#94A3B8] select-none mt-0.5">
      [ {timeStr.day} {timeStr.month} {timeStr.year} <span className="animate-blink-colon">:</span> {timeStr.hour}
      <span className="animate-blink-colon">:</span>
      {timeStr.minute}
      <span className="animate-blink-colon">:</span>
      {timeStr.second} WIB ]
    </div>
  );
}
