"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setDataUrl);
  }, [value, size]);

  if (!dataUrl) return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-[var(--secondary)]" />;

  return <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />;
}
