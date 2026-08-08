export type ProgressMap = Record<string, boolean>;

export type Block =
  | { type: "eyebrow"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "video"; title: string; meta: string }
  | { type: "concepts"; items: { term: string; text: string }[] }
  | {
      type: "compare";
      title: string;
      left: { label: string; title: string; text: string; note: string };
      right: { label: string; title: string; text: string; note: string };
      verdict: string;
    };

export type Exercise = {
  question: string;
  options: { id: string; label: string; detail: string }[];
  correct: string;
  correctFeedback: string;
  wrongFeedback: string;
  explanation: string;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  tagline: string;
  duration: string;
  blocks: Block[];
  exercise: Exercise;
};

export type LockedLesson = {
  number: number;
  title: string;
};

const STORAGE_KEY = "fostern-aprendizagem-progresso";

export const DEFAULT_PROGRESS: ProgressMap = { "lesson-1": true };

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: ProgressMap | null = raw ? JSON.parse(raw) : null;
    return { ...DEFAULT_PROGRESS, ...(parsed ?? {}) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(map: ProgressMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function completedCount(map: ProgressMap): number {
  return Object.values(map).filter(Boolean).length;
}

export const lesson1: Lesson = {
  id: "lesson-1",
  number: 1,
  title: "Como funciona uma candidatura internacional?",
  tagline: "Entenda o que as universidades leem, como leem e o que torna uma aplicação competitiva.",
  duration: "8 min",
  blocks: [
    {
      type: "paragraph",
      text: "Uma candidatura internacional não é um formulário preenchido. É uma história — lida por pessoas que dedicam alguns minutos a cada arquivo e precisam decidir se ele vale uma vaga. A boa notícia: essa leitura tem estrutura, e estrutura se aprende.",
    },
    { type: "video", title: "Como funciona uma candidatura internacional?", meta: "Vídeo demonstrativo · 6 min" },
    { type: "heading", text: "O que uma universidade lê quando lê você" },
    {
      type: "paragraph",
      text: "Cada aplicação é composta por peças. Cada peça responde a uma pergunta diferente sobre quem você é — e, juntas, elas precisam formar um retrato único e coerente.",
    },
    {
      type: "list",
      items: [
        "Histórico acadêmico e notas — evidência de que você sustenta rigor com constância.",
        "Testes padronizados (SAT, TOEFL, IELTS) — um retrato comparável entre candidatos do mundo inteiro.",
        "Ensaios pessoais — sua voz, suas escolhas e o que você faria com a oportunidade.",
        "Recomendações — o que quem te ensinou diz sobre como você trabalha.",
        "Atividades e projetos — o que você construiu para além da sala de aula.",
      ],
    },
    {
      type: "callout",
      title: "O fio condutor",
      text: "Uma candidatura competitiva não é a soma das partes. É uma história única contada por várias vozes — todas coerentes entre si.",
    },
    { type: "heading", text: "Dois estudantes, duas histórias" },
    {
      type: "compare",
      title: "Dois estudantes, duas histórias",
      left: {
        label: "História A",
        title: "Atividades de última hora",
        text: "Um ano final intenso: certificados avulsos, um ensaio escrito às pressas e participações pontuais em projetos que não se conectam.",
        note: "Nada se encaixa. É impossível saber o que move esse estudante.",
      },
      right: {
        label: "História B",
        title: "Um interesse, dois anos",
        text: "Um interesse por cidades e espaços públicos que atravessou leituras, uma pesquisa sobre mobilidade urbana e um projeto voluntário de mapeamento do próprio bairro.",
        note: "Cada peça reforça a outra. Dá para ver quem é o estudante.",
      },
      verdict:
        "A história B é competitiva porque demonstra profundidade, coerência e iniciativa. Admissões não querem saber se você fez muitas coisas — querem saber se você é capaz de se aprofundar em algo de verdade.",
    },
    {
      type: "paragraph",
      text: "O ciclo de candidaturas começa mais cedo do que parece: cerca de um ano antes do prazo final. Por isso o primeiro passo não é preencher formulários — é organizar o trabalho: escolher direções, definir marcos e deixar claro o que cada semana vai produzir. É exatamente isso que os próximos módulos fazem com você.",
    },
  ],
  exercise: {
    question: "Qual destas opções representa melhor uma candidatura competitiva para uma universidade internacional?",
    options: [
      { id: "A", label: "Um ano final intenso", detail: "Certificados avulsos, várias atividades paralelas e um ensaio escrito às pressas." },
      { id: "B", label: "Dois anos de um projeto de pesquisa", detail: "Nasceu de uma curiosidade própria e seguiu com escrita, apresentações e continuidade." },
      { id: "C", label: "Um currículo extenso e genérico", detail: "Cobre de tudo um pouco, sem um fio condutor claro." },
    ],
    correct: "B",
    correctFeedback: "Isso. A opção B é a mais competitiva das três.",
    wrongFeedback: "Quase — observe o que cada opção demonstra sobre o estudante.",
    explanation:
      "As admissões procuram profundidade e coerência. O projeto B demonstra curiosidade genuína, iniciativa e a capacidade de sustentar um trabalho durante dois anos — sinais muito mais fortes do que quantidade de atividades. Em candidaturas internacionais, profundidade vence amplitude.",
  },
};

export const lesson2: Lesson = {
  id: "lesson-2",
  number: 2,
  title: "Extracurriculares: o que realmente importa?",
  tagline: "Como construir experiências genuínas — e não apenas um currículo cheio.",
  duration: "10 min",
  blocks: [
    {
      type: "paragraph",
      text: "Extracurricular não é sinônimo de “atividade de fim de semana”. É qualquer trabalho que você escolhe fazer e que deixa rastro — prova de quem você é quando ninguém está pedindo.",
    },
    { type: "heading", text: "O que as admissões procuram" },
    {
      type: "paragraph",
      text: "Ao ler suas atividades, os avaliadores não contam itens. Eles procuram quatro sinais — e quanto mais presentes, mais forte é a experiência.",
    },
    {
      type: "concepts",
      items: [
        { term: "Profundidade", text: "Fazer uma coisa por muito tempo e com continuidade vale mais do que fazer várias coisas por pouco tempo." },
        { term: "Liderança", text: "Liderança é responsabilidade por pessoas, decisões ou resultados. Não é um título em um certificado." },
        { term: "Impacto", text: "O que mudou de concreto por causa do seu trabalho? Pessoas ajudadas, um problema resolvido, algo criado." },
        { term: "Consistência", text: "Interesse que aparece e some parece acaso. Interesse sustentado parece escolha — e escolha é o que admissões procuram." },
      ],
    },
    { type: "heading", text: "Formas de construir experiência" },
    {
      type: "paragraph",
      text: "Existem caminhos clássicos para acumular evidências de verdade. Nenhum é obrigatório — o que importa é o que eles demonstram sobre você.",
    },
    {
      type: "list",
      items: [
        "Projetos autorais — algo que só você faria, com começo, meio e resultado visível.",
        "Olimpíadas — rigor, treino e evidência de domínio de uma área.",
        "Pesquisa — a habilidade de perguntar, investigar e comunicar achados.",
        "Empreendedorismo — resolver um problema real com iniciativa e execução.",
        "Voluntariado — impacto com constância, e não participação de uma tarde.",
      ],
    },
    {
      type: "callout",
      title: "O princípio",
      text: "A Fostern não ensina a “encher o currículo”. Ensina a construir experiências relevantes e genuínas — que fazem sentido para a história de cada estudante e, por serem verdadeiras, sustentam uma candidatura inteira.",
    },
    { type: "heading", text: "Exemplo: por que uma experiência vence a outra" },
    {
      type: "paragraph",
      text: "Compare duas formas de escrever a mesma intenção. A diferença está no que cada uma demonstra.",
    },
    {
      type: "compare",
      title: "Atividade fraca × atividade forte",
      left: {
        label: "Atividade fraca",
        title: "Participei de um clube.",
        text: "Uma linha no currículo. Sem papel descrito, sem escala, sem consequência. Não diz nada sobre você além de “estive presente”.",
        note: "Um fato, não uma história.",
      },
      right: {
        label: "Atividade forte",
        title: "Criei e liderei um grupo de estudos com 40 alunos durante um ano.",
        text: "Iniciativa de criar do zero, responsabilidade de conduzir pessoas, escala de 40 alunos e constância de um ano. Cada detalhe é evidência.",
        note: "Uma história com consequência.",
      },
      verdict:
        "A segunda experiência demonstra iniciativa (criar do zero), liderança (conduzir pessoas), impacto (escala de 40 alunos) e consistência (um ano inteiro). A pergunta certa não é “o que você fez?”, mas “o que mudou por causa de você?”.",
    },
  ],
  exercise: {
    question: "Qual dessas experiências demonstra maior impacto?",
    options: [
      { id: "A", label: "Participei de um projeto voluntário uma vez.", detail: "Participação pontual, sem papel claro nem resultado descrito." },
      { id: "B", label: "Criei um projeto de reforço escolar que ajudou 30 alunos durante um ano.", detail: "Iniciativa própria, escala, duração e resultado concreto." },
    ],
    correct: "B",
    correctFeedback: "Isso. A opção B demonstra impacto de verdade.",
    wrongFeedback: "Quase — preste atenção em escala, duração e resultado.",
    explanation:
      "Impacto não é presença, é consequência. A opção B mostra que você iniciou algo, sustentou durante um ano e mudou a vida de 30 pessoas — iniciativa, escala e resultado. Participar pontualmente é positivo, mas não demonstra o mesmo tipo de trabalho. A pergunta certa não é “o que você fez?”, e sim “o que mudou por causa de você?”.",
  },
};

export const lockedLessons: LockedLesson[] = [
  { number: 3, title: "Encontrando seu fio condutor" },
  { number: 4, title: "Testes padronizados: estratégia para o SAT e o TOEFL" },
  { number: 5, title: "Construindo um projeto autoral" },
  { number: 6, title: "A escrita dos ensaios pessoais" },
  { number: 7, title: "Recomendações: a arte de pedir ajuda" },
  { number: 8, title: "Montando sua lista final de universidades" },
];

export const MODULE = {
  slug: "caminho-universidade-internacional",
  eyebrow: "Módulo 1 — Começando sua jornada",
  title: "Construindo seu caminho para uma universidade internacional",
  description:
    "A base de tudo: como as admissões funcionam, o que elas procuram e como transformar seu momento em um plano de trabalho concreto.",
  totalLessons: 8,
  lessons: [lesson1, lesson2],
  locked: lockedLessons,
};
