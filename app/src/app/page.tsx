import Link from "next/link";

const evidence = [
  {
    tag: "Formatação para ATS",
    title: "Estrutura simples, sem colunas ou ícones",
    body: "Sistemas de rastreamento de candidatos (ATS) leem melhor currículos lineares, com seções padrão (Resumo, Experiência, Educação, Habilidades) e sem tabelas, colunas ou dados em cabeçalho/rodapé — que muitas vezes nem são lidos pelo parser.",
    source: "MIT Career Advising & Professional Development",
    href: "https://capd.mit.edu/resources/make-your-resume-ats-friendly/",
  },
  {
    tag: "Palavras-chave",
    title: "Use os termos exatos da vaga",
    body: "ATS e recrutadores comparam o texto do currículo com a descrição da vaga. Termos idênticos (ex: \"JavaScript\", não \"JS\") pontuam mais do que sinônimos — vale reler a vaga e espelhar o vocabulário técnico usado nela.",
    source: "CNS Career Services — UT Austin",
    href: "https://careerservices.cns.utexas.edu/resources/resumes/applicant-tracking-systems",
  },
  {
    tag: "Conteúdo",
    title: "Resultado mensurável > lista de tarefas",
    body: 'Recrutadores de empresas como o Google buscam a fórmula "alcancei [X], medido por [Y], fazendo [Z]" — o que você entregou e o impacto, não apenas as tecnologias usadas.',
    source: "IGotAnOffer — Google Resume Examples",
    href: "https://igotanoffer.com/blogs/tech/google-resume-examples-tips",
  },
  {
    tag: "Mercado brasileiro",
    title: "A Gupy é o ATS mais usado no Brasil",
    body: "Presente em milhares de empresas (Nubank, iFood, Magazine Luiza, entre outras), a IA da Gupy ranqueia candidatos por afinidade com a vaga. Um currículo com boa estrutura e palavras-chave aumenta a pontuação nesse ranqueamento.",
    source: "Gupy — O que é ATS?",
    href: "https://www.gupy.io/blog/ats",
  },
  {
    tag: "Extensão",
    title: "Uma página, para a maioria das trajetórias",
    body: "Para quem está começando ou tem até ~10 anos de experiência, um currículo de uma página, direto ao ponto, tende a ser lido por completo — currículos longos correm o risco de ter as partes finais ignoradas.",
    source: "Harvard FAS Career Services — Create a Strong Resume",
    href: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/",
  },
  {
    tag: "Método",
    title: "Estruture cada realização com o método STAR",
    body: "Situação, Tarefa, Ação e Resultado. Descrever o contexto e o resultado (não só a ação) é o que diferencia um bullet genérico de um que convence quem está lendo.",
    source: "Harvard FAS Career Services",
    href: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/",
  },
];

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50">
      <section className="flex flex-col items-center px-6 py-20 text-center">
        <p className="mb-3 text-sm font-medium text-slate-500">
          Feito para devs brasileiros
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Monte um currículo com mais chances de passar
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Preencha um formulário guiado com dicas do que recrutadores e sistemas
          ATS realmente procuram, veja o resultado em tempo real e exporte em
          PDF — em português ou inglês.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/builder"
            className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Criar meu currículo
          </Link>
          <Link
            href="/feed"
            className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver notícias e vagas
          </Link>
        </div>
        <ul className="mt-12 grid max-w-2xl grid-cols-1 gap-3 text-left text-sm text-slate-600 sm:grid-cols-3">
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-900">Sem cadastro</strong>
            Seus dados ficam só no seu navegador.
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-900">PT-BR e EN</strong>
            Um clique para trocar de idioma e mercado.
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-900">Dicas embutidas</strong>
            Método STAR, verbos de ação e boas práticas de ATS.
          </li>
        </ul>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-medium text-slate-500">
            Baseado em fatos, não em achismo
          </p>
          <h2 className="mt-1 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Por que o modelo é montado desse jeito
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600">
            Cada escolha de formato e dica deste gerador vem de guias de
            carreira de universidades, times de recrutamento e do ATS mais
            usado no Brasil — não de opinião.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evidence.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-400"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.tag}
                </span>
                <h3 className="mt-1 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600">
                  {item.body}
                </p>
                <span className="mt-3 text-xs font-medium text-slate-500 group-hover:text-slate-900">
                  Fonte: {item.source} ↗
                </span>
              </a>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-400">
            Estimativas sobre uso de ATS (ex.: percentual de currículos
            filtrados automaticamente) variam entre fontes e devem ser lidas
            como referência, não número exato — o consenso entre elas é o que
            vira recomendação aqui.
          </p>
        </div>
      </section>
    </main>
  );
}
