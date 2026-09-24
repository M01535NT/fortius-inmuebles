"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

export function PublicPerformance() {
  return <SpeedInsights beforeSend={(event) => {
    const url = new URL(event.url);
    if (url.pathname.startsWith("/admin")) return null;
    url.search = "";
    url.hash = "";
    return { ...event, url: url.href };
  }} />;
}
