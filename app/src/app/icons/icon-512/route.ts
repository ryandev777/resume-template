import { ImageResponse } from "next/og";
import { createElement } from "react";
import { AppIconGraphic } from "@/lib/appIcon";

// Prerendered once at build time — see icons/icon-192/route.ts.
export const dynamic = "force-static";

/** See icons/icon-192/route.ts for why this is a plain Route Handler with a fixed URL instead
 * of the `icon` file convention. */
export async function GET() {
  return new ImageResponse(createElement(AppIconGraphic, { size: 512 }), {
    width: 512,
    height: 512,
  });
}
