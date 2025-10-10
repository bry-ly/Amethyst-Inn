"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isRenderedRef = useRef(false);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="turnstile"]');
    
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Load Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Only cleanup widget, not script (script should stay loaded)
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error("Error removing Turnstile widget:", error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile || isRenderedRef.current) {
      return;
    }

    // Render Turnstile widget only once
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onSuccess,
        "error-callback": onError,
        "expired-callback": onExpire,
        theme,
        size,
      });
      isRenderedRef.current = true;
    } catch (error) {
      console.error("Failed to render Turnstile:", error);
      onError?.();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          isRenderedRef.current = false;
        } catch (error) {
          console.error("Error removing Turnstile widget:", error);
        }
      }
    };
  }, [isLoaded, siteKey, theme, size]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
}
