import type { Locale } from "./types";

export const content: Record<
  Locale,
  {
    steps: string[];
    labels: Record<string, string>;
    placeholders: Record<string, string>;
    sectionTitles: Record<string, string>;
    tips: { title: string; items: string[] }[];
    actionVerbs: { group: string; verbs: string[] }[];
  }
> = {
  "pt-br": {
    steps: [
      "Dados pessoais",
      "Resumo",
      "Experiência",
      "Liderança",
      "Projetos",
      "Educação",
      "Habilidades",
    ],
    labels: {
      fullName: "Nome completo",
      headline: "Título profissional",
      location: "Cidade, Estado",
      email: "E-mail",
      phone: "Telefone",
      linkedin: "LinkedIn (URL)",
      linkedinText: "Texto do link (opcional)",
      github: "GitHub (URL)",
      githubText: "Texto do link (opcional)",
      website: "Portfólio / site (URL)",
      websiteText: "Texto do link (opcional)",
      summary: "Resumo profissional",
      org: "Empresa / organização",
      role: "Cargo",
      startDate: "Início",
      endDate: "Término",
      current: "Trabalho atual",
      bullets: "Realizações",
      institution: "Instituição de ensino",
      degree: "Curso / grau",
      technical: "Habilidades técnicas",
      languages: "Idiomas",
      projectName: "Nome do projeto",
      projectLink: "Link (GitHub, deploy, etc.)",
      projectLinkText: "Texto do link (opcional)",
      projectDescription: "Descrição",
      studentMode: "Estou buscando estágio / primeiro emprego",
    },
    placeholders: {
      fullName: "Seu Nome Completo",
      headline: "Ex: Desenvolvedor Full Stack (Node.js | React)",
      location: "São Paulo, SP",
      email: "seu.email@exemplo.com",
      phone: "(11) 91234-5678",
      linkedin: "linkedin.com/in/seu-usuario",
      linkedinText: "Ex: LinkedIn",
      github: "github.com/seu-usuario",
      githubText: "Ex: GitHub",
      website: "seusite.com",
      websiteText: "Ex: Portfólio",
      summary:
        "2 a 3 linhas: quem você é, sua principal stack e o tipo de vaga que busca. Ex: Desenvolvedor Back-end com 3 anos de experiência em Node.js e sistemas distribuídos, focado em performance e escalabilidade.",
      org: "Nome da empresa",
      role: "Ex: Desenvolvedor Full Stack",
      bullet:
        "Alcancei [resultado] através de [ação], resultando em [impacto quantificado].",
      institution: "Nome da universidade",
      degree: "Ex: Bacharelado em Ciência da Computação",
      technical: "Ex: JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
      languagesText: "Ex: Português (Nativo), Inglês (Avançado)",
      projectName: "Ex: API de encurtador de URLs",
      projectLinkText: "Ex: ver projeto",
      projectDescription:
        "O que o projeto faz, tecnologias usadas e resultado/aprendizado.",
    },
    sectionTitles: {
      experience: "Experiência",
      leadership: "Atividades de Liderança",
      education: "Educação",
      skills: "Habilidades",
      projects: "Projetos",
    },
    tips: [
      {
        title: "O currículo ideal é",
        items: [
          "Específico, não genérico — evite frases vagas como \"responsável por diversas tarefas\".",
          "Ativo, não passivo — comece cada linha com um verbo de ação.",
          "Baseado em fatos — quantifique sempre que possível (%, R$, tempo, usuários).",
          "Claro e direto — recrutadores e sistemas ATS fazem leitura rápida.",
          "Sem foto — pode causar viés e prejudicar a leitura por ATS.",
        ],
      },
      {
        title: "Método STAR para cada bullet",
        items: [
          "Situação: qual era o contexto/problema?",
          "Tarefa: o que precisava ser feito?",
          "Ação: o que você fez, especificamente?",
          "Resultado: qual foi o impacto, de preferência quantificado?",
        ],
      },
      {
        title: "Para vagas gringas (EUA/Europa)",
        items: [
          "Use o template em inglês e troque para esse idioma no topo da página.",
          "Prefira métricas e resultados de negócio (revenue, latency, uptime) a listas de tecnologias soltas.",
          "Evite abreviações só usadas no Brasil (ex: \"Ensino Médio\" → \"High School Diploma\").",
        ],
      },
    ],
    actionVerbs: [
      {
        group: "Liderança",
        verbs: ["Liderei", "Coordenei", "Mentorei", "Orientei", "Gerenciei", "Facilitei"],
      },
      {
        group: "Desenvolvimento",
        verbs: ["Desenvolvi", "Implementei", "Construí", "Arquitetei", "Refatorei", "Integrei"],
      },
      {
        group: "Otimização",
        verbs: ["Otimizei", "Reduzi", "Automatizei", "Escalei", "Melhorei", "Acelerei"],
      },
      {
        group: "Colaboração",
        verbs: ["Colaborei", "Alinhei", "Apresentei", "Documentei", "Treinei", "Revisei"],
      },
    ],
  },
  en: {
    steps: [
      "Personal info",
      "Summary",
      "Experience",
      "Leadership",
      "Projects",
      "Education",
      "Skills",
    ],
    labels: {
      fullName: "Full name",
      headline: "Professional headline",
      location: "City, State",
      email: "Email",
      phone: "Phone",
      linkedin: "LinkedIn (URL)",
      linkedinText: "Link text (optional)",
      github: "GitHub (URL)",
      githubText: "Link text (optional)",
      website: "Portfolio / website (URL)",
      websiteText: "Link text (optional)",
      summary: "Professional summary",
      org: "Company / organization",
      role: "Role",
      startDate: "Start date",
      endDate: "End date",
      current: "I currently work here",
      bullets: "Achievements",
      institution: "Institution",
      degree: "Degree",
      technical: "Technical skills",
      languages: "Languages",
      projectName: "Project name",
      projectLink: "Link (GitHub, live demo, etc.)",
      projectLinkText: "Link text (optional)",
      projectDescription: "Description",
      studentMode: "I'm looking for an internship / first job",
    },
    placeholders: {
      fullName: "Your Full Name",
      headline: "Ex: Full Stack Developer (Node.js | React)",
      location: "Remote / State, Country",
      email: "your.email@example.com",
      phone: "+1 (555) 123-4567",
      linkedin: "linkedin.com/in/username",
      linkedinText: "Ex: LinkedIn",
      github: "github.com/username",
      githubText: "Ex: GitHub",
      website: "yoursite.com",
      websiteText: "Ex: Portfolio",
      summary:
        "2-3 lines: who you are, your core stack, and the role you're targeting. Ex: Backend Engineer with 3 years of experience in Node.js and distributed systems, focused on performance and scalability.",
      org: "Company name",
      role: "Ex: Full Stack Developer",
      bullet: "Achieved [result] through [action taken], resulting in [quantified impact].",
      institution: "University name",
      degree: "Ex: B.S. in Computer Science",
      technical: "Ex: JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
      languagesText: "Ex: Portuguese (Native), English (Fluent)",
      projectName: "Ex: URL Shortener API",
      projectLinkText: "Ex: view project",
      projectDescription: "What it does, tech used, and the result/learning.",
    },
    sectionTitles: {
      experience: "Experience",
      leadership: "Leadership Activities",
      education: "Education",
      skills: "Skills",
      projects: "Projects",
    },
    tips: [
      {
        title: "A strong resume is",
        items: [
          "Specific, not generic — avoid vague phrases like \"responsible for various tasks\".",
          "Active, not passive — start every line with an action verb.",
          "Fact-based — quantify whenever possible (%, $, time, users).",
          "Clear and scannable — recruiters and ATS systems skim fast.",
          "Photo-free — can introduce bias and break ATS parsing.",
        ],
      },
      {
        title: "STAR method for every bullet",
        items: [
          "Situation: what was the context/problem?",
          "Task: what needed to be done?",
          "Action: what did you specifically do?",
          "Result: what was the impact, ideally quantified?",
        ],
      },
      {
        title: "For international applications",
        items: [
          "Keep this version in English and mention time zone if applying remote.",
          "Favor business-impact metrics (revenue, latency, uptime) over plain tech lists.",
          "Spell out local terms an international recruiter may not recognize.",
        ],
      },
    ],
    actionVerbs: [
      {
        group: "Leadership",
        verbs: ["Led", "Coordinated", "Mentored", "Guided", "Managed", "Facilitated"],
      },
      {
        group: "Development",
        verbs: ["Developed", "Implemented", "Built", "Architected", "Refactored", "Integrated"],
      },
      {
        group: "Optimization",
        verbs: ["Optimized", "Reduced", "Automated", "Scaled", "Improved", "Accelerated"],
      },
      {
        group: "Collaboration",
        verbs: ["Collaborated", "Aligned", "Presented", "Documented", "Trained", "Reviewed"],
      },
    ],
  },
};
