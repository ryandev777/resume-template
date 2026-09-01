import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-20 text-center">
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
      <div className="mt-8 flex gap-3">
        <Link
          href="/builder"
          className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Criar meu currículo
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
    </main>
  );
}
