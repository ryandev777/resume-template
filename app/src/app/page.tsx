"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, MotionConfig, useScroll, useTransform, type Variants } from "motion/react";

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

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const cardGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/** Two soft, blurred gradient blobs drifting at different speeds as the hero scrolls past —
 * pure decoration, `aria-hidden` and `pointer-events-none` so they never interfere with content
 * or screen readers. Depth comes from each blob's y-transform moving at a different fraction of
 * scroll progress (classic parallax: farther/slower vs. nearer/faster). */
function HeroParallaxBackground({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const ySlow = useTransform(progress, [0, 1], [0, 120]);
  const yFast = useTransform(progress, [0, 1], [0, 260]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div
        style={{ y: ySlow }}
        className="absolute -left-32 -top-24 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/10"
      />
      <motion.div
        style={{ y: yFast }}
        className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-500/10"
      />
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <section
        ref={heroRef}
        className="relative flex flex-col items-center overflow-hidden px-6 py-20 text-center"
      >
        <HeroParallaxBackground progress={scrollYProgress} />

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.p
            variants={heroItem}
            className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400"
          >
            Feito para devs brasileiros
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl"
          >
            Monte um currículo com mais chances de passar
          </motion.h1>
          <motion.p
            variants={heroItem}
            className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400"
          >
            Preencha um formulário guiado com dicas do que recrutadores e sistemas
            ATS realmente procuram, veja o resultado em tempo real e exporte em
            PDF — em português ou inglês.
          </motion.p>
          <motion.div
            variants={heroItem}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/builder">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Criar meu currículo
              </motion.span>
            </Link>
            <Link href="/feed">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Ver notícias e vagas
              </motion.span>
            </Link>
          </motion.div>
          <motion.ul
            variants={heroItem}
            className="mt-12 grid max-w-2xl grid-cols-1 gap-3 text-left text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-3"
          >
            <li className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <strong className="block text-slate-900 dark:text-slate-100">Sem cadastro</strong>
              Seus dados ficam só no seu navegador.
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <strong className="block text-slate-900 dark:text-slate-100">PT-BR e EN</strong>
              Um clique para trocar de idioma e mercado.
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <strong className="block text-slate-900 dark:text-slate-100">Dicas embutidas</strong>
              Método STAR, verbos de ação e boas práticas de ATS.
            </li>
          </motion.ul>
        </motion.div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-16 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Baseado em fatos, não em achismo
            </p>
            <h2 className="mt-1 text-center text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Por que o modelo é montado desse jeito
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 dark:text-slate-400">
              Cada escolha de formato e dica deste gerador vem de guias de
              carreira de universidades, times de recrutamento e do ATS mais
              usado no Brasil — não de opinião.
            </p>
          </motion.div>

          <motion.div
            variants={cardGrid}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {evidence.map((item) => (
              <motion.a
                key={item.title}
                variants={cardItem}
                whileHover={{ y: -4 }}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.tag}
                </span>
                <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
                <span className="mt-3 text-xs font-medium text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-100">
                  Fonte: {item.source} ↗
                </span>
              </motion.a>
            ))}
          </motion.div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-400 dark:text-slate-500">
            Estimativas sobre uso de ATS (ex.: percentual de currículos
            filtrados automaticamente) variam entre fontes e devem ser lidas
            como referência, não número exato — o consenso entre elas é o que
            vira recomendação aqui.
          </p>
        </div>
      </section>
      </main>
    </MotionConfig>
  );
}
