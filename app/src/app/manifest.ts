import type { MetadataRoute } from "next";

/** Native Next.js App Router convention — this file is served at /manifest.webmanifest
 * automatically. The icon URLs point at the fixed Route Handlers under src/app/icons/ rather
 * than the `icon`/`apple-icon` file conventions, since those generate hashed URLs that can't be
 * hardcoded here reliably. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gerador de Currículo | resume-template",
    short_name: "Currículo",
    description:
      "Monte um currículo com mais chances de passar em vagas de programação, compare com a vaga, acompanhe candidaturas — tudo grátis, sem cadastro, salvo só no seu navegador.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
