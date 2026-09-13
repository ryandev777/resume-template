const BG = "#0f172a";
const PAGE_BG = "#ffffff";
const LINE_COLOR = "#334155";
const ACCENT_LINE_COLOR = "#64748b";

/** Simple "document with text lines" glyph shared by every app/PWA icon (browser tab, iOS home
 * screen, Android install prompt) — built from plain flexbox `div`s with no text and no images,
 * so it renders identically through Satori (what `next/og`'s ImageResponse uses under the hood),
 * which only understands a CSS subset. `maskable` shrinks the glyph and drops the outer corner
 * rounding to respect Android's adaptive-icon safe zone: content must sit inside the center
 * ~80% of the canvas, and the background must bleed to the full square edge-to-edge. */
export function AppIconGraphic({
  size,
  maskable = false,
}: {
  size: number;
  maskable?: boolean;
}) {
  const pageScale = maskable ? 0.44 : 0.6;
  const pageWidth = size * pageScale;
  const pageHeight = pageWidth * 1.28;
  const linePad = pageWidth * 0.16;
  const lineHeight = Math.max(2, pageWidth * 0.08);
  const lineGap = pageWidth * 0.1;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        borderRadius: maskable ? 0 : size * 0.18,
      }}
    >
      <div
        style={{
          width: pageWidth,
          height: pageHeight,
          background: PAGE_BG,
          borderRadius: pageWidth * 0.08,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: linePad,
          gap: lineGap,
        }}
      >
        <div
          style={{
            width: "100%",
            height: lineHeight,
            background: ACCENT_LINE_COLOR,
            borderRadius: lineHeight,
          }}
        />
        <div
          style={{ width: "80%", height: lineHeight, background: LINE_COLOR, borderRadius: lineHeight }}
        />
        <div
          style={{ width: "90%", height: lineHeight, background: LINE_COLOR, borderRadius: lineHeight }}
        />
        <div
          style={{ width: "65%", height: lineHeight, background: LINE_COLOR, borderRadius: lineHeight }}
        />
      </div>
    </div>
  );
}
