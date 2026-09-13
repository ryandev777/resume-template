# Sobre o projeto — Gerador de Currículo para Devs

Este documento explica o projeto em detalhe, pra você usar como base de um post no LinkedIn (ou README, ou onde fizer sentido). No fim tem um rascunho curto já pronto pra copiar e colar.

## O que é

Um gerador de currículo gratuito, pensado pra quem está começando na programação ou pra quem já trabalha na área mas nunca organizou direito a busca por vaga. Nasceu como um simples modelo de currículo em LaTeX e virou uma aplicação web completa (Next.js), guiando a pessoa do zero até o PDF pronto — sem cadastro, sem mensalidade, sem letra miúda.

Tudo roda no navegador: os dados do currículo ficam salvos só no `localStorage` do próprio usuário, nada é enviado pra nenhum servidor. A hospedagem é gratuita (Vercel) e o código é aberto.

## A ideia por trás

Currículo é uma das primeiras barreiras de quem está entrando no mercado de tech: a pessoa sabe programar, mas não sabe como estruturar as informações de um jeito que passe pelos sistemas automáticos de triagem (ATS) e ainda chame atenção de quem recruta. E depois de pronto, a busca em si vira uma bagunça de abas abertas, vagas salvas em lugar nenhum e nenhuma visão de quantas candidaturas viraram entrevista.

A proposta desse projeto é resolver as duas pontas:

1. **Montar um currículo bom de verdade**, com base em boas práticas reais (não achismo) — formatação linear que ATS lê corretamente, palavras-chave que batem com a vaga, método STAR pra descrever experiência, sem foto (evita viés e problema de parser).
2. **Organizar a busca inteira**, não só o documento — desde encontrar vaga até acompanhar em que fase cada candidatura está.

## O que ele faz, hoje

**Construção do currículo**
- Formulário guiado por seções (dados pessoais, resumo, experiência, formação, projetos, habilidades), com dicas de conteúdo embutidas (método STAR, verbos de ação, o que evitar).
- Prévia em tempo real, já formatada, com aviso de quantas páginas o currículo vai ocupar.
- Exportação em PDF (direto do navegador), em `.txt` puro (útil pra colar em campos de ATS que rejeitam PDF) e em backup `.json` pra levar os dados pra outro lugar.
- Tamanho da fonte ajustável, modo escuro, PT-BR e EN com um clique.
- Importação de um currículo já existente em PDF, com revisão antes de aplicar.
- Importação de repositórios do GitHub direto pra seção de projetos (usa a API pública do GitHub, sem custo).
- Link compartilhável, somente leitura, sem backend — os dados vão compactados na própria URL.
- Perfis: dá pra guardar mais de uma versão do currículo (ex: "Backend", "Dados") e alternar entre elas.

**Compatibilidade com a vaga**
- Cole a descrição da vaga e o app compara as palavras-chave dela com o currículo, mostrando o que já está coberto e o que falta considerar incluir.
- Gerador de rascunho de carta de apresentação, a partir do currículo + da vaga colada.

**Buscar e organizar vagas**
- Feed de notícias e vagas de tecnologia, com foco no mercado brasileiro (fontes comunitárias no GitHub, boards de estágio/júnior, vagas remotas abertas a candidatos do Brasil) e também cobertura internacional.
- Percentual de compatibilidade de cada vaga com o currículo, calculado na hora.
- Um Kanban pessoal de candidaturas (Salvo → Aplicado → Entrevista → Recusado/Oferta), com estatísticas simples (taxa de resposta, ofertas) — tudo salvo só no navegador de quem usa.

## Por que isso ajuda quem está começando

- **Reduz a barreira de formatação.** Ninguém precisa saber o que é um ATS-friendly resume — o formulário já entrega isso pronto.
- **Ensina enquanto usa.** As dicas (STAR, palavras-chave, o que os recrutadores de fato olham) vêm de guias de carreira de universidades e de times de recrutamento — não são achismo.
- **Junta currículo e busca de vaga no mesmo lugar.** Em vez de currículo num Google Docs, vagas salvas em favoritos e candidaturas de cabeça, tudo fica no mesmo app.
- **Zero fricção pra experimentar.** Sem criar conta, sem cartão, sem instalar nada — abre o link e já começa a preencher.

## Stack e filosofia

Next.js + Tailwind, Zustand pra estado local, hospedagem gratuita na Vercel. Sem backend próprio: tudo que parece "salvo na nuvem" (currículo, perfis, candidaturas) na verdade vive no `localStorage` de quem usa — decisão deliberada pra manter o projeto 100% gratuito de operar e sem se tornar responsável por dados sensíveis de ninguém.

**Ponto de atenção importante:** como não existe servidor, os dados moram só no navegador de quem usa. Se a pessoa limpar "cookies e dados do site" do navegador (opção combinada que é padrão em Chrome/Edge/Firefox), trocar de navegador ou de computador, tudo é apagado — não tem como recuperar. O app já mostra um aviso disso na tela e tem botão de exportar um backup (`.json`) a qualquer momento, mas vale deixar claro pra quem for testar/usar: não é armazenamento na nuvem, é local.

---

## Rascunho pra postar no LinkedIn

> Depois de ajudar (e ser ajudado) tantas vezes com currículo na hora de entrar na área de tech, resolvi transformar isso num projeto: um gerador de currículo gratuito, pensado pra quem está começando a programar ou quer organizar melhor a busca por vaga.
>
> O que ele faz:
> — Monta o currículo com base em boas práticas reais de ATS e recrutamento (não achismo)
> — Compara a vaga colada com o currículo e mostra palavras-chave faltando
> — Importa projetos direto do GitHub
> — Gera rascunho de carta de apresentação
> — Feed de vagas e notícias focado no mercado brasileiro, com Kanban de candidaturas
>
> Sem cadastro, sem custo, sem enviar dado nenhum pra servidor — tudo roda no seu navegador. Código aberto.
>
> [link do deploy] · [link do repositório]
