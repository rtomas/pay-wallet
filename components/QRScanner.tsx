"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scannerId = "qr-scanner-" + Math.random().toString(36).slice(2);

    if (!containerRef.current) return;
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        onError?.(typeof err === "string" ? err : "Camera access denied");
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-xl"
    />
  );
}
