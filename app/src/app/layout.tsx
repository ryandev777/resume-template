import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StorageBackupBoot } from "@/components/StorageBackupBoot";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

/** Runs before hydration so the `dark` class is set on first paint — otherwise the page
 * would flash light before React mounts and applies the stored/system theme. */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gerador de Currículo | resume-template",
  description:
    "Monte um currículo com mais chances de passar em vagas de programação no Brasil ou no exterior.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
        <StorageBackupBoot />
        <ThemeToggle />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
