import { ImageResponse } from "next/og";
import { AppIconGraphic } from "@/lib/appIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIconGraphic size={512} />, { ...size });
}
