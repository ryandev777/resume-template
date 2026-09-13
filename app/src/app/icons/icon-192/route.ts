import { ImageResponse } from "next/og";
import { createElement } from "react";
import { AppIconGraphic } from "@/lib/appIcon";

// Prerendered once at build time instead of re-rendered through Satori on every request — this
// image never changes at runtime.
export const dynamic = "force-static";

/** Plain Route Handler (not the `icon` file convention) so the URL is a fixed, literal path —
 * `manifest.ts` needs a stable URL to reference, unlike the auto-generated/hashed one the `icon`
 * convention produces. Built with `createElement` instead of JSX so this can stay a `.ts` file,
 * matching the documented route.js/route.ts convention (route.tsx isn't a listed convention). */
export async function GET() {
  return new ImageResponse(createElement(AppIconGraphic, { size: 192 }), {
    width: 192,
    height: 192,
  });
}
