// src/components/Clock.tsx
import { useEffect, useState } from "react";

export default function Clock({ format = "24h" }: { format?: "12h" | "24h" }) {
  const [time, setTime] = useState(getFormattedTime(format));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getFormattedTime(format));
    }, 1000);
    return () => clearInterval(interval);
  }, [format]);

  return <span className="text-5xl font-bold text-blue-600">{time}</span>;
}

function getFormattedTime(format: "12h" | "24h") {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  });
}
