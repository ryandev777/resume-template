# Gerador de Currículo (Web App)

Aplicação Next.js + Tailwind que gera um currículo em PT-BR ou EN a partir de um formulário guiado, com dicas de conteúdo (método STAR, verbos de ação, boas práticas de ATS) e exportação em PDF pelo próprio navegador.

- **Sem backend, sem login:** todos os dados ficam salvos apenas no `localStorage` do navegador.
- **Sem custo:** hospedagem gratuita na [Vercel](https://vercel.com).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e depois `/builder`.

## Deploy na Vercel

1. Suba este repositório para o GitHub.
2. Na Vercel, clique em "New Project", selecione o repositório e defina o **Root Directory** como `app`.
3. A Vercel detecta o Next.js automaticamente — não é necessário configurar variáveis de ambiente.

## Estrutura

- `src/app` — rotas (`/` landing, `/builder` o gerador)
- `src/components/forms` — formulários de cada seção do currículo
- `src/components/preview/ResumeDocument.tsx` — o template do currículo (também usado na exportação em PDF via impressão do navegador)
- `src/lib/store.ts` — estado global (Zustand) persistido em `localStorage`
- `src/lib/content.ts` — todos os textos, labels, dicas e verbos de ação, em PT-BR e EN
