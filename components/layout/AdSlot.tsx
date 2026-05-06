"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot?: string;
  className?: string;
  minHeight?: number;
};

export function AdSlot({ slot = "auto", className, minHeight = 90 }: AdSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const requestedRef = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!client || requestedRef.current || !adRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      requestedRef.current = true;
    } catch (error) {
      console.error("AdSense render failed", error);
    }
  }, [client]);

  if (!client) return null;

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className ?? ""}`.trim()}
      style={{ display: "block", minHeight }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
