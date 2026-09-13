import { ImageResponse } from "next/og";
import { createElement } from "react";
import { AppIconGraphic } from "@/lib/appIcon";

// Prerendered once at build time — see icons/icon-192/route.ts.
export const dynamic = "force-static";

/** "Maskable" purpose icon for Android's adaptive-icon system — the OS applies its own shape
 * mask (circle, squircle, etc.) on top, so the glyph must sit inside a safe center zone and the
 * background must bleed edge-to-edge (see AppIconGraphic's `maskable` branch). See
 * icons/icon-192/route.ts for why this is a plain Route Handler with a fixed URL. */
export async function GET() {
  return new ImageResponse(createElement(AppIconGraphic, { size: 512, maskable: true }), {
    width: 512,
    height: 512,
  });
}
