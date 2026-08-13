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

export type Module = {
  slug: string;
  number: number;
  eyebrow: string;
  title: string;
  description: string;
  totalLessons: number;
  lessons: Lesson[];
};

const STORAGE_KEY = "fostern-aprendizagem-progresso-v2";

export const DEFAULT_PROGRESS: ProgressMap = {};

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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Armazenamento indisponível (modo privado, quota, WebView): segue sem persistir.
  }
}

export function completedCount(map: ProgressMap): number {
  return Object.values(map).filter(Boolean).length;
}

export function moduleDoneCount(module: Module, progress: ProgressMap): number {
  return module.lessons.filter((lesson) => progress[lesson.id]).length;
}

export function isModuleAccessible(module: Module, planoAtivo: boolean): boolean {
  return planoAtivo || module.number === 1;
}

export function isLessonAccessible(module: Module, lesson: Lesson, planoAtivo: boolean): boolean {
  if (planoAtivo) return true;
  return module.number === 1 && lesson.number <= 2;
}

export function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
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

type ExemploAula = {
  titulo: string;
  tagline: string;
  nota: string;
};

function exemploLesson(moduleNumber: number, number: number, aula: ExemploAula): Lesson {
  const nn = String(number).padStart(2, "0");
  return {
    id: `m${moduleNumber}-aula-${number}`,
    number,
    title: aula.titulo,
    tagline: aula.tagline,
    duration: `${6 + (number % 5)} min`,
    blocks: [
      { type: "eyebrow", text: `Aula ${nn}` },
      { type: "paragraph", text: aula.nota },
      { type: "video", title: aula.titulo, meta: "Vídeo demonstrativo · 5 min" },
      { type: "heading", text: "Por que isso importa" },
      {
        type: "paragraph",
        text: `Em uma candidatura internacional, nada acontece por acaso: cada etapa precisa ser planejada, praticada e registrada. Esta aula — “${aula.titulo}” — existe para que você saia do conteúdo e entre na prática, com um próximo passo claro e mensurável.`,
      },
      {
        type: "list",
        items: [
          "Comece pelo essencial e avance por etapas pequenas e consistentes.",
          "Registre decisões, aprendizados e resultados em um só lugar.",
          "Revise o que funcionou e ajuste o que não funcionou antes de seguir.",
          "Peça feedback cedo — não na véspera de um prazo importante.",
        ],
      },
      {
        type: "callout",
        title: "Para levar com você",
        text: "Domínio não é saber de cor. É conseguir aplicar, explicar e ensinar o que você aprendeu — inclusive para si mesmo, uma semana depois.",
      },
      { type: "heading", text: "Na prática" },
      {
        type: "paragraph",
        text: "Tudo nesta aula pode ser reduzido a três movimentos: entender, aplicar, registrar. Entender a ideia central, aplicar em um exemplo real da sua rotina e registrar o resultado para retomar depois.",
      },
      {
        type: "concepts",
        items: [
          { term: "Entender", text: "Explicar a ideia central da aula com as suas próprias palavras, sem consultar o texto." },
          { term: "Aplicar", text: "Executar uma ação concreta ligada à aula — um exercício, um esboço, uma pesquisa." },
          { term: "Registrar", text: "Guardar o aprendizado em um lugar único para revisitar quando for montar sua candidatura." },
        ],
      },
      {
        type: "compare",
        title: "Dois caminhos",
        left: {
          label: "Caminho A",
          title: "Assistir e deixar para depois",
          text: "Consumir a aula sem registrar nada, achando que “já está entendido” e adiando a prática.",
          note: "O conhecimento se perde — e a candidatura segue sem avançar.",
        },
        right: {
          label: "Caminho B",
          title: "Aplicar e registrar hoje",
          text: "Terminar a aula com uma ação concreta e uma anotação que se conecta ao restante da jornada.",
          note: "Cada aula vira um tijolo da sua candidatura.",
        },
        verdict:
          "O caminho B é o que constrói uma candidatura competitiva: pequenas ações consistentes, registradas e conectadas entre si. Leve essa mentalidade para todas as aulas da trilha.",
      },
      {
        type: "paragraph",
        text: `Reserve alguns minutos agora para fazer a atividade do exercício abaixo. Depois, siga para a próxima aula — o progresso aparece aula a aula, e cada uma delas te aproxima da sua candidatura final.`,
      },
    ],
    exercise: {
      question: "Depois desta aula, qual atitude você deve levar para a sua preparação?",
      options: [
        { id: "A", label: "Acumular várias tarefas ao mesmo tempo", detail: "Para adiantar etapas, mesmo sem registrar ou revisar o aprendizado." },
        { id: "B", label: "Aplicar um passo de cada vez e registrar", detail: "Entender a ideia, executar uma ação concreta e guardar o resultado." },
        { id: "C", label: "Revisar tudo somente no fim do processo", detail: "Deixar a prática e os registros para depois, quando sobrar tempo." },
      ],
      correct: "B",
      correctFeedback: "Isso. Prática constante com registro é o que sustenta uma candidatura forte.",
      wrongFeedback: "Quase — pense no que gera progresso real a longo prazo.",
      explanation:
        "Progresso em candidaturas internacionais vem de consistência: entender, aplicar e registrar em pequenas doses. Acumular tarefas ou adiar a revisão não constrói evidência — e evidência é o que as universidades leem.",
    },
  };
}

function buildModule(opts: {
  number: number;
  slug: string;
  title: string;
  description: string;
  aulas: ExemploAula[];
  extras?: Lesson[];
}): Module {
  const startIndex = opts.extras ? opts.extras.length : 0;
  const extras = opts.extras ?? [];
  const geradas = opts.aulas.map((aula, i) => exemploLesson(opts.number, startIndex + i + 1, aula));
  return {
    number: opts.number,
    slug: opts.slug,
    eyebrow: `Módulo ${opts.number} — ${opts.title.split(":")[0].trim()}`,
    title: opts.title,
    description: opts.description,
    totalLessons: 10,
    lessons: [...extras, ...geradas],
  };
}

export const MODULES: Module[] = [
  buildModule({
    number: 1,
    slug: "caminho-universidade-internacional",
    title: "Construindo seu caminho para uma universidade internacional",
    description:
      "A base de tudo: como as admissões funcionam, o que elas procuram e como transformar seu momento em um plano de trabalho concreto.",
    extras: [lesson1, lesson2],
    aulas: [
      {
        titulo: "Encontrando seu fio condutor",
        tagline: "A pergunta que amarra todas as peças da sua candidatura.",
        nota: "Antes de escrever qualquer ensaio ou listar atividades, você precisa de um fio condutor: a ideia central que conecta suas escolhas, suas experiências e seus objetivos. É ele que transforma um conjunto de feitos em uma história.",
      },
      {
        titulo: "Organizando seu tempo de preparação",
        tagline: "Como encaixar a candidatura na rotina sem entrar em pânico.",
        nota: "Uma candidatura internacional compete com provas, projetos e vida pessoal. A solução não é mais horas — é um calendário realista: blocos fixos por semana, marcos mensais e revisões que protegem seu tempo sem sacrificar a escola.",
      },
      {
        titulo: "O que as universidades procuram em cada peça",
        tagline: "O que notas, testes, ensaios e atividades comunicam juntos.",
        nota: "Cada peça da candidatura responde a uma pergunta: as notas mostram consistência, os testes mostram comparação, os ensaios mostram voz e as atividades mostram iniciativa. Entender a função de cada uma ajuda você a investir onde o retorno é maior.",
      },
      {
        titulo: "Construindo um plano de estudos semanal",
        tagline: "Um modelo simples de rotina para avançar semanalmente.",
        nota: "Plano de estudos não é lista infinita de tarefas. É um compromisso realista: escolher poucos focos por semana, agendar horários fixos e medir avanço. Um plano enxuto que você cumpre vence um plano ambicioso que você abandona.",
      },
      {
        titulo: "Sua linha do tempo de candidatura",
        tagline: "Do primeiro ano à matrícula: o ciclo completo em etapas.",
        nota: "O ciclo de candidaturas dura cerca de um ano — e o sucesso depende de começar cedo. Esta aula monta a linha do tempo: quando pesquisar universidades, quando começar os testes, quando escrever ensaios e quando enviar cada aplicação.",
      },
      {
        titulo: "Montando seu primeiro esboço de perfil",
        tagline: "Um retrato de uma página sobre quem você é hoje.",
        nota: "Um esboço de perfil condensa quem você é em uma página: contexto, interesses, conquistas e direção. Ele não precisa ser perfeito — serve como ponto de partida para conversas de mentoria e como base para os próximos módulos.",
      },
      {
        titulo: "Ferramentas e hábitos de estudo",
        tagline: "O mínimo de ferramentas que organiza tudo sem sobrecarregar.",
        nota: "Você não precisa de dez apps para se organizar. Precisa de três coisas: um lugar para registrar ideias, um calendário para prazos e um hábito de revisão semanal. Simples e constante vence sofisticado e esquecido.",
      },
      {
        titulo: "Revisão do módulo: seu plano de ação",
        tagline: "Junte tudo e escreva seu primeiro plano de ação concreto.",
        nota: "Chegou a hora de consolidar: seu fio condutor, sua rotina, sua linha do tempo e seu esboço de perfil viram um único documento — seu plano de ação. Esse plano vai guiar todos os módulos seguintes.",
      },
    ],
  }),
  buildModule({
    number: 2,
    slug: "autoconhecimento-e-narrativa",
    title: "Autoconhecimento: sua história",
    description:
      "Descubra o que é único em você — o material bruto que amarra toda a candidatura e alimenta ensaios, atividades e entrevistas.",
    aulas: [
      {
        titulo: "Mapeando suas experiências de vida",
        tagline: "O inventário de tudo que você já viveu — e que parece comum para você.",
        nota: "O que parece cotidiano para você é único para quem não viveu a sua história. Este exercício de mapeamento lista experiências, mudanças, responsabilidades e superações — e revela o material bruto de uma candidatura autêntica.",
      },
      {
        titulo: "O que te move: interesses e curiosidades",
        tagline: "Perguntas que revelam seus interesses reais.",
        nota: "Interesse genuíno aparece quando você investiga algo por curiosidade, não por obrigação. Descobrir o que te move — e por quê — dá direção para projetos, atividades e, no futuro, para os ensaios.",
      },
      {
        titulo: "Transformando vivências em narrativa",
        tagline: "De lista de fatos a história com começo, meio e sentido.",
        nota: "Uma vivência só vira narrativa quando ganha contexto e consequência: o que aconteceu, o que você escolheu e o que mudou. Nesta aula você pratica transformar acontecimentos em histórias com direção.",
      },
      {
        titulo: "Valores e pontos fortes",
        tagline: "O vocabulário das suas qualidades — sem clichês.",
        nota: "“Eu sou dedicado” é clichê. “Eu sustento um projeto por dois anos porque acredito em constância” é evidência. Mapear valores e pontos fortes com exemplos concretos cria o vocabulário das suas qualidades.",
      },
      {
        titulo: "Escrevendo seu manifesto pessoal",
        tagline: "Uma página que captura quem você é e para onde quer ir.",
        nota: "Um manifesto pessoal é a primeira versão da sua narrativa: quem você é, o que valoriza, como chegou até aqui e para onde quer ir. Ele não vai para a candidatura — serve de bússola para tudo que virá.",
      },
      {
        titulo: "Encontrando temas que se conectam",
        tagline: "Os pontos em comum entre histórias aparentemente diferentes.",
        nota: "Suas experiências mais importantes quase sempre orbitam poucos temas: justiça, ciência, comunidade, descoberta. Identificar esses temas repetidos mostra que sua história tem coerência — e coerência é o que as admissões buscam.",
      },
      {
        titulo: "Sua identidade em uma frase",
        tagline: "O exercício de se descrever em uma única linha.",
        nota: "Se você só pudesse dizer uma frase sobre si, qual seria? Descrever sua identidade em uma frase força escolhas: o que é essencial e o que é ruído. Essa frase vira o norte dos seus materiais.",
      },
      {
        titulo: "Coletando histórias que importam",
        tagline: "Um arquivo vivo de momentos, detalhes e pequenas reviravoltas.",
        nota: "Boa escrita vem de bons materiais. Manter um arquivo de histórias — conversas, obstáculos, decisões, detalhes concretos — garante que você nunca chegue em branco na hora de escrever um ensaio.",
      },
      {
        titulo: "Feedback: afiando sua narrativa",
        tagline: "Como ouvir o que os outros veem sem perder sua voz.",
        nota: "Mostrar sua narrativa para outras pessoas revela o que você não enxerga. O truque é pedir feedback específico e filtrar: o que ressoa, o que confunde e o que não é você — o juiz final é sempre a sua voz.",
      },
      {
        titulo: "Revisão: sua narrativa final",
        tagline: "Consolidando autoconhecimento em um perfil pronto para a jornada.",
        nota: "Este módulo termina com seu documento de narrativa: manifesto, temas, frase de identidade e arquivo de histórias. Ele será consultado em todos os próximos passos — dos projetos aos ensaios.",
      },
    ],
  }),
  buildModule({
    number: 3,
    slug: "extracurriculares-e-projetos",
    title: "Extracurriculares e projetos autorais",
    description:
      "Construa experiências genuínas — com profundidade, liderança e impacto — que sustentam sua candidatura de ponta a ponta.",
    aulas: [
      {
        titulo: "Profundidade, liderança e impacto",
        tagline: "Os três sinais que as admissões procuram em toda atividade.",
        nota: "Toda atividade forte tem pelo menos um dos três sinais: profundidade (duração e constância), liderança (responsabilidade) ou impacto (mudança concreta). Avaliar suas atividades por esses critérios mostra onde investir.",
      },
      {
        titulo: "Projetos autorais do zero",
        tagline: "Criar algo que só você faria — do primeiro passo ao resultado.",
        nota: "Um projeto autoral nasce de um problema ou curiosidade sua, e tem começo, meio e resultado visível. Não precisa ser grandioso: precisa ser seu. Projetos autorais são a evidência mais forte de iniciativa.",
      },
      {
        titulo: "Como iniciar e manter um projeto",
        tagline: "Do primeiro esboço ao hábito semanal — sem se perder no meio.",
        nota: "A maioria dos projetos morre no segundo mês. Iniciar é empolgante; manter exige sistema: uma meta pequena, um horário fixo e um registro de avanço. Constância, não intensidade, é o que sustenta projetos.",
      },
      {
        titulo: "Olimpíadas e competições",
        tagline: "Usar competições para demonstrar rigor e domínio.",
        nota: "Olimpíadas e competições são uma via eficiente de evidência: elas provam rigor, treino e domínio de uma área em uma linguagem que qualquer universidade entende. O valor está no processo, não apenas na medalha.",
      },
      {
        titulo: "Pesquisa e iniciação científica",
        tagline: "A habilidade de perguntar, investigar e comunicar.",
        nota: "Pesquisa demonstra uma habilidade rara em adolescentes: formular uma pergunta boa e trabalhar para respondê-la. Você não precisa de laboratório — precisa de método, orientação e comunicação dos resultados.",
      },
      {
        titulo: "Voluntariado com constância",
        tagline: "Impacto duradouro em vez de participação de uma tarde.",
        nota: "Um voluntariado de um ano com papel definido vale mais que cinco ações pontuais. Constância mostra compromisso real; continuidade permite assumir responsabilidade e medir impacto — e é isso que se conta.",
      },
      {
        titulo: "Empreendedorismo na escola",
        tagline: "Resolver um problema real com iniciativa e execução.",
        nota: "Empreender pode ser pequeno: um projeto de vendas na escola, uma rede de apoio entre alunos, um serviço que resolve um incômodo real. O que importa é iniciativa, execução e resultado — não o tamanho do faturamento.",
      },
      {
        titulo: "Documentando seu impacto",
        tagline: "Números, histórias e evidências para suas atividades.",
        nota: "Atividade sem registro é anedota. Documente: quantas pessoas foram impactadas, quanto tempo durou, qual foi o resultado concreto. Esses números e histórias serão a matéria-prima de formulários e ensaios.",
      },
      {
        titulo: "Currículo de atividades sem inflar",
        tagline: "Escolher o que listar — e o que deixar de fora.",
        nota: "Qualidade vence quantidade. O formulário de atividades tem espaço limitado; inflá-lo com itens fracos dilui os fortes. Aprenda a priorizar as atividades que demonstram seus três sinais com mais força.",
      },
      {
        titulo: "Revisão: seu portfólio de atividades",
        tagline: "Consolidando seu conjunto de experiências em um portfólio.",
        nota: "Seu portfólio de atividades reúne cada experiência com seu papel, duração e impacto — pronto para ser usado em formulários, ensaios e entrevistas. Este documento é um dos pilares da sua candidatura.",
      },
    ],
  }),
  buildModule({
    number: 4,
    slug: "testes-padronizados",
    title: "Testes padronizados: SAT, TOEFL e IELTS",
    description:
      "Estratégia completa para os exames que as universidades pedem: como se preparar, quando fazer e como decidir se vale enviar.",
    aulas: [
      {
        titulo: "Entendendo o SAT e o ACT",
        tagline: "Estrutura, pontuação e como escolher entre os dois.",
        nota: "O SAT e o ACT são exames padronizados que comparam candidatos de sistemas educacionais diferentes. Conhecer a estrutura, o tempo e a pontuação de cada um ajuda a decidir qual se encaixa melhor no seu perfil.",
      },
      {
        titulo: "TOEFL e IELTS: inglês acadêmico",
        tagline: "A prova de proficiência que abre (ou fecha) portas.",
        nota: "Para quem estuda em outro idioma, o TOEFL ou o IELTS comprova proficiência acadêmica — entender aulas, escrever e se comunicar. Saber qual a universidade exige e a nota mínima evita surpresas no fim.",
      },
      {
        titulo: "Montando seu plano de preparação",
        tagline: "Quantos meses você precisa e como distribuir os estudos.",
        nota: "Preparação eficiente é planejada: um diagnóstico inicial, blocos semanais por área de dificuldade e um simulado a cada duas semanas. A maioria dos estudantes precisa de 3 a 6 meses de preparação consistente.",
      },
      {
        titulo: "Matemática do SAT na prática",
        tagline: "Os tópicos que mais caem e as armadilhas clássicas.",
        nota: "A matemática do SAT é mais sobre raciocínio rápido do que conteúdo avançado. Dominar os tópicos recorrentes, treinar leitura de problemas e revisar erros de distração rende mais que estudar teoria infinita.",
      },
      {
        titulo: "Leitura e escrita do SAT",
        tagline: "Compreensão de leitura e gramática sob pressão de tempo.",
        nota: "A seção de leitura e escrita exige velocidade e precisão: identificar ideia principal, propósito e tom, além de dominar regras de gramática e estrutura. Técnica de eliminação e prática dirigida são a chave.",
      },
      {
        titulo: "Estratégia de tempo e ritmo",
        tagline: "Gerenciar o relógio sem sacrificar a precisão.",
        nota: "O maior inimigo dos testes padronizados é o tempo. Aprender a alocar minutos por questão, pular e voltar, e manter um ritmo constante reduz a ansiedade e aumenta a pontuação — velocidade vem de treino.",
      },
      {
        titulo: "Testes simulados e análise de erros",
        tagline: "A ferramenta mais eficaz de preparação.",
        nota: "Simulados com tempo revelam seu nível real e, mais importante, seus padrões de erro. Cada erro analisado — por que errei, o que deveria ter feito — vira um item de estudo. Treino sem análise não rende.",
      },
      {
        titulo: "Inscrevendo-se e escolhendo datas",
        tagline: "Prazos, centros de aplicação e plano B.",
        nota: "A inscrição exige antecedência: datas do exame, centros disponíveis, custo e prazo para enviar notas às universidades. Monte seu cronograma de testes com folga para repetir, se necessário.",
      },
      {
        titulo: "Test-optional: quando não enviar",
        tagline: "Decidir se a nota fortalece ou enfraquece sua candidatura.",
        nota: "Muitas universidades tornaram os testes opcionais. A decisão de enviar ou não a nota depende de como ela se compara à faixa dos admitidos. Nem sempre a melhor estratégia é enviar — e isso não é fraqueza.",
      },
      {
        titulo: "Revisão: seu plano de testes",
        tagline: "Consolidando datas, alvos e plano de estudo dos exames.",
        nota: "Seu plano de testes reúne: exame e data escolhidos, nota-alvo, plano semanal e decisão de envio. Com ele em mãos, os exames saem da zona de ansiedade e entram no calendário de trabalho.",
      },
    ],
  }),
  buildModule({
    number: 5,
    slug: "ensaios-pessoais",
    title: "Ensaios pessoais que abrem portas",
    description:
      "Escreva sobre o que só você pode escrever: tópico, voz, estrutura e revisão de ensaios memoráveis.",
    aulas: [
      {
        titulo: "A anatomia de um ensaio memorável",
        tagline: "O que todo ensaio que abre portas tem em comum.",
        nota: "Ensaio memorável não é o mais bem escrito — é o mais específico. Ele mostra um momento real, uma decisão ou um detalhe concreto, e o que aquilo revela sobre o autor. Especificidade é o que separa lembrado de esquecido.",
      },
      {
        titulo: "Escolhendo seu tópico",
        tagline: "Como achar a história certa entre as suas muitas histórias.",
        nota: "Não existe tópico perfeito; existem histórias com potencial. As melhores escolhas combinam três coisas: algo importante para você, algo que só você poderia contar e algo que revela uma qualidade para a admissão.",
      },
      {
        titulo: "Abertura que prende o leitor",
        tagline: "As primeiras linhas decidem se alguém continua lendo.",
        nota: "Avaliadores leem centenas de ensaios. Uma abertura com detalhe concreto, ação ou tensão imediata cria curiosidade. A regra de ouro: entrar na história o mais perto possível do momento em que ela se torna interessante.",
      },
      {
        titulo: "Mostre, não conte",
        tagline: "Transformar afirmações em cenas que o leitor enxerga.",
        nota: "“Eu sou curioso” conta. “Eu desmontei um rádio da minha avó para entender como o som saía dali” mostra. Cenas, detalhes e ação concreta substituem adjetivos e tornam o texto vivo.",
      },
      {
        titulo: "Estrutura e ritmo do texto",
        tagline: "Organizar o ensaio para guiar o leitor do início ao fim.",
        nota: "Um bom ensaio tem movimento: começa numa cena, revela reflexão, mostra mudança e termina com uma conclusão que conecta tudo. A estrutura existe para o leitor não se perder — e para o autor não divagar.",
      },
      {
        titulo: "Voz autêntica vs. ensaio genérico",
        tagline: "Escrever como você fala — sem tentar parecer outra pessoa.",
        nota: "Ensaio genérico soa como todo mundo: palavras difíceis, frases solenes e zero personalidade. Voz autêntica é a sua: frases do seu tamanho, humor se você tem, sinceridade sempre. Leia em voz alta — se não soa como você, reescreva.",
      },
      {
        titulo: "Revisando e cortando sem dó",
        tagline: "A edição que transforma um rascunho em texto afiado.",
        nota: "O primeiro rascunho existe para existir. A revisão é onde o ensaio nasce: cortar repetições, substituir genéricos por específicos, encurtar frases e checar se cada parágrafo avança a história.",
      },
      {
        titulo: "Feedback: rodadas de leitura",
        tagline: "Quem pedir, o que perguntar e como filtrar opiniões.",
        nota: "Boas rodadas de feedback começam com perguntas específicas: O que você lembra deste ensaio? Onde perdeu o interesse? Que qualidade do autor ele mostra? Ouvir e filtrar — sem perder sua voz — é parte do ofício.",
      },
      {
        titulo: "Suplementos e ensaios curtos",
        tagline: "As perguntas extras que completam a candidatura.",
        nota: "Além do ensaio principal, muitas universidades pedem suplementos: “Por que nossa universidade?” e perguntas curtas. São menos sobre novidade e mais sobre mostrar que você pesquisou e que se encaixa.",
      },
      {
        titulo: "Revisão: seu conjunto de ensaios",
        tagline: "Consolidando seu ensaio principal e suplementos.",
        nota: "Seu conjunto de ensaios reúne a versão final do ensaio principal e os suplementos adaptados a cada universidade. Revisado, editado e lido em voz alta — pronto para fazer o trabalho de abrir portas.",
      },
    ],
  }),
  buildModule({
    number: 6,
    slug: "recomendacoes-e-documentos",
    title: "Recomendações e documentos",
    description:
      "Peça ajuda de verdade e organize a papelada: de quem pedir recomendação até a tradução de documentos oficiais.",
    aulas: [
      {
        titulo: "A quem pedir uma recomendação",
        tagline: "Escolher quem escreve sobre você — e por quê.",
        nota: "A melhor recomendação vem de quem conhece você em ação: um professor que viu sua evolução, um mentor de projeto que testemunhou seu trabalho. O título da pessoa importa menos que a qualidade do que ela pode dizer.",
      },
      {
        titulo: "A arte de pedir: quando e como",
        tagline: "Pedir com antecedência e com contexto.",
        nota: "Pedir recomendação é uma arte de respeito: com antecedência (4 a 6 semanas), pessoalmente ou por e-mail cuidadoso, explicando para que é e o que a pessoa pode destacar. Sempre deixe a porta aberta para um “não”.",
      },
      {
        titulo: "Materiais para o recomendador",
        tagline: "Entregar o contexto que transforma a carta em algo forte.",
        nota: "Uma boa carta precisa de matéria-prima: seu currículo de atividades, uma lista de momentos marcantes da sua relação com aquela pessoa e seus objetivos. Recomendador bem informado escreve carta específica — não genérica.",
      },
      {
        titulo: "Currículo e histórico: formatação",
        tagline: "Um currículo limpo e legível para quem lê em minutos.",
        nota: "Seu currículo é lido em segundos por pessoas com pouco tempo. Formatação importa: uma página, seções claras, verbos de ação, resultados com números e ordem de impacto — não cronológica.",
      },
      {
        titulo: "Conversa com o conselheiro",
        tagline: "A entrevista que prepara o contexto escolar da sua candidatura.",
        nota: "A maioria das escolas envia um relatório do conselheiro junto com a candidatura. Uma conversa preparada — seus objetivos, sua trajetória, o que você quer destacar — garante que o relatório reflita você de verdade.",
      },
      {
        titulo: "Cartas de recomendação: o que elas dizem",
        tagline: "Entender o peso de cada carta no processo de avaliação.",
        nota: "Cartas mostram o que quem te ensinou pensa sobre como você trabalha: curiosidade, resiliência, contribuição em sala. Entender o que os avaliadores buscam ajuda a orientar seus recomendadores sobre o que enfatizar.",
      },
      {
        titulo: "Traduzindo documentos oficiais",
        tagline: "Históricos, certificados e traduções juramentadas.",
        nota: "Históricos e certificados brasileiros precisam ser traduzidos e, em muitos casos, certificados. Conhecer os tipos de tradução exigidos por cada universidade e o tempo de emissão evita atrasos no fim do processo.",
      },
      {
        titulo: "Prazos e organização de documentos",
        tagline: "Um sistema simples para nunca perder um papel.",
        nota: "Documentos perdidos custam candidaturas. Monte uma pasta digital e física com histórico, certificados, traduções, passaporte e cartas — e um calendário com os prazos de cada universidade. Organização é metade da candidatura.",
      },
      {
        titulo: "Checklist final de papelada",
        tagline: "A conferência de tudo que precisa ser enviado.",
        nota: "Antes de apertar “enviar”, confira cada item: formulário completo, ensaio revisado, atividade preenchida, recomendação enviada, teste recebido e taxa paga. Um checklist mata as surpresas de última hora.",
      },
      {
        titulo: "Revisão: sua pasta de documentos",
        tagline: "Consolidando recomendações e papelada pronta para envio.",
        nota: "Ao fim deste módulo, você tem: recomendadores confirmados, currículo e histórico prontos, traduções pedidas e um sistema de prazos. A papelada deixa de ser um vilão e vira parte do plano.",
      },
    ],
  }),
  buildModule({
    number: 7,
    slug: "pesquisa-de-universidades",
    title: "Montando sua lista de universidades",
    description:
      "Pesquise, compare e escolha onde aplicar — com critérios claros e uma lista equilibrada entre sonho e realidade.",
    aulas: [
      {
        titulo: "Critérios que importam na escolha",
        tagline: "Como decidir o que pesa mais na sua decisão.",
        nota: "Universidade “boa” é a que se encaixa em você: área acadêmica, tamanho, cidade, cultura, custo e apoio a estudantes internacionais. Definir seus critérios com pesos evita escolhas por ranking ou por impressão.",
      },
      {
        titulo: "Fit acadêmico e cultural",
        tagline: "Encontrar onde você vai estudar bem — e viver bem.",
        nota: "Fit é a combinação de ambiente acadêmico e estilo de vida: currículos flexíveis, cultura de pesquisa, tamanho das turmas, clima, comunidade internacional. Universidades publicam muito sobre si — basta saber onde olhar.",
      },
      {
        titulo: "Reach, match e safety",
        tagline: "O equilíbrio de uma lista com chance real de sucesso.",
        nota: "Uma lista saudável tem três níveis: reach (sonho, difícil), match (alcançável) e safety (quase certo). A proporção típica é 2-3 reach, 4-5 match e 2 safety — para nenhum sonho virar risco.",
      },
      {
        titulo: "Analisando taxas de admissão",
        tagline: "Ler números sem se enganar com eles.",
        nota: "Taxa de admissão é um dado, não um destino: ela muda com o tamanho da turma, os requerentes e a política de testes. Comparar sua faixa de notas e testes com a dos admitidos é mais útil que o número cru.",
      },
      {
        titulo: "Custos e oportunidades de bolsa",
        tagline: "Estimar o investimento real antes de sonhar com o destino.",
        nota: "O custo anual de estudar fora vai além da mensalidade: moradia, alimentação, seguro, livros e passagens. Antes de qualquer lista, entenda quanto você pode investir e quais universidades oferecem ajuda financeira a internacionais.",
      },
      {
        titulo: "Campus, cidade e clima",
        tagline: "Os detalhes do dia a dia que decidem a experiência.",
        nota: "Você vai morar lá por quatro anos. Pesquisar o campus, a cidade, o transporte, o clima e a comunidade de brasileiros muda a experiência de estudar fora de romance para realidade.",
      },
      {
        titulo: "Visitando (virtualmente) os campi",
        tagline: "Tours virtuais, palestras e contato com estudantes.",
        nota: "Visitas virtuais e conversas com estudantes atuais revelam o que sites não contam: a atmosfera, a cultura, o suporte. Participar de eventos oficiais ainda demonstra interesse genuíno — que algumas universidades avaliam.",
      },
      {
        titulo: "Construindo sua short list",
        tagline: "Reduzir o universo de universidades a uma lista de trabalho.",
        nota: "Com critérios, dados e visitas em mãos, chega a short list: 8 a 12 universidades candidatas, cada uma com seu motivo documentado. Uma short list clara evita inscrições por impulso e desperdício de taxa e esforço.",
      },
      {
        titulo: "Equilíbrio da lista final",
        tagline: "Ajustar a proporção de sonho, alcançável e segurança.",
        nota: "Lista final é matemática de risco: muitas reaches sem safety é aposta; safety demais é subvender seu potencial. Revise a proporção, o custo e a probabilidade de cada uma antes de fechar o conjunto.",
      },
      {
        titulo: "Revisão: sua lista estratégica",
        tagline: "Consolidando sua lista final com motivo e custo de cada uma.",
        nota: "Sua lista final documenta cada universidade: por que ela, quanto custa, chance estimada e prazo. Este documento orienta todas as aplicações — e, mais tarde, a comparação das ofertas recebidas.",
      },
    ],
  }),
  buildModule({
    number: 8,
    slug: "candidatura-e-common-app",
    title: "Aplicando: Common App e formulários",
    description:
      "Preencha, organize e envie suas candidaturas sem estresse: plataformas, prazos e conferência final.",
    aulas: [
      {
        titulo: "Entendendo o Common App",
        tagline: "A plataforma que centraliza a maioria das candidaturas.",
        nota: "O Common App é um formulário único que se envia para centenas de universidades: dados pessoais, histórico, atividades e ensaios. Uma única seção de atividades e um ensaio principal valem para várias candidaturas.",
      },
      {
        titulo: "Preenchendo o perfil e as atividades",
        tagline: "Cada campo tem um peso — saiba o que escrever em cada um.",
        nota: "O formulário de atividades limita cada item a poucos caracteres: título, papel, organização, duração e descrição curta. Escrever com verbo de ação, número e resultado transforma um espaço pequeno em evidência grande.",
      },
      {
        titulo: "Coalition e aplicações próprias",
        tagline: "As outras plataformas que você pode precisar usar.",
        nota: "Além do Common App, existem o Coalition e as plataformas próprias de algumas universidades. Vale conferir onde cada uma da sua lista quer a candidatura — e as diferenças de campos e prazos de cada sistema.",
      },
      {
        titulo: "Sistemas de submissão: dicas práticas",
        tagline: "Salvar, revisar e navegar os formulários com segurança.",
        nota: "Formulários se perdem por descuido: sessões que expiram, respostas não salvas, documentos com formato errado. Aprender as boas práticas de cada plataforma evita o erro mais comum do processo — o erro evitável.",
      },
      {
        titulo: "Prazos: early vs. regular",
        tagline: "Early action, early decision e regular: escolher a estratégia.",
        nota: "Prazos antecipados aumentam as chances e exigem decisão: early decision é vinculante, early action não, e regular dá mais tempo. Escolher a estratégia por universidade — e não no desespero — é parte do plano.",
      },
      {
        titulo: "Taxas e waivers",
        tagline: "Os custos de cada aplicação e como solicitar isenção.",
        nota: "Cada candidatura tem uma taxa de inscrição. Universidades oferecem isenção para candidatos com necessidade comprovada — e o processo é simples, desde que pedido com antecedência e documentação em ordem.",
      },
      {
        titulo: "Conferindo cada aplicação",
        tagline: "A revisão final que separa envio seguro de arrependimento.",
        nota: "Antes de enviar, revise como quem avalia: leia o ensaio em voz alta, cheque nomes e datas, veja o preview da plataforma e confira se a universidade certa recebeu o ensaio certo. Erros de copiar e colar destroem boas candidaturas.",
      },
      {
        titulo: "Enviando com segurança",
        tagline: "O momento do envio — e o que fazer logo depois.",
        nota: "Enviar é o fim de uma etapa, não do processo: você precisa do e-mail de confirmação, do recibo e da ativação do portal da universidade. Enviar com folga do prazo evita o pânico de última hora — e seus erros.",
      },
      {
        titulo: "Acompanhando portais de candidato",
        tagline: "O que conferir no portal e como responder pendências.",
        nota: "Depois do envio, cada universidade abre um portal: histórico de documentos, status de recomendações e pendências. Acompanhar com regularidade — e responder rápido — mostra organização e evita desclassificação por documento faltando.",
      },
      {
        titulo: "Revisão: seu processo de aplicação",
        tagline: "Consolidando todas as candidaturas em um painel de controle.",
        nota: "Seu painel de candidaturas reúne cada universidade com plataforma, prazo, taxa, status e pendências. Com ele, você gerencia o processo inteiro de um lugar só — e nada fica para a véspera.",
      },
    ],
  }),
  buildModule({
    number: 9,
    slug: "financiamento-e-bolsas",
    title: "Financiamento e bolsas",
    description:
      "Entenda o custo real de estudar fora e encontre caminhos de bolsa, necessidade financeira e financiamento.",
    aulas: [
      {
        titulo: "O custo real de estudar fora",
        tagline: "Mensalidade, moradia, seguro e a conta que ninguém mostra.",
        nota: "O custo total de estudar fora é maior que a mensalidade: moradia, alimentação, livros, seguro-saúde, passagens e vistos. Estimar o custo real por universidade — e não só a taxa — é o primeiro passo financeiro.",
      },
      {
        titulo: "Bolsa de mérito e bolsa de necessidade",
        tagline: "As duas grandes famílias de ajuda financeira.",
        nota: "Bolsa de mérito premia seu perfil (notas, talento, perfil esportivo); bolsa de necessidade cobre a diferença entre o custo e o que sua família pode pagar. Saber qual cada universidade oferece muda a lista.",
      },
      {
        titulo: "Bolsas para estudantes internacionais",
        tagline: "Onde procurar oportunidades para quem não é residente.",
        nota: "Muitas universidades oferecem ajuda específica para internacionais — mas não todas. Fontes confiáveis (site oficial, escritório de ajuda financeira, programas reconhecidos) valem mais que promessas de agências duvidosas.",
      },
      {
        titulo: "Programas do governo e ONGs",
        tagline: "Bolsas fora das universidades que podem cobrir boa parte.",
        nota: "Governos, fundações e ONGs oferecem bolsas parciais e integrais para brasileiros: programas de intercâmbio, fundações setoriais e editais de mérito. Cada edital tem perfil, prazos e processo próprios — e é grátis se candidatar.",
      },
      {
        titulo: "Colleges que atendem 100% da necessidade",
        tagline: "As universidades que garantem o custo após a admissão.",
        nota: "Um grupo pequeno de universidades se compromete a atender 100% da necessidade financeira dos admitidos, inclusive internacionais. Para famílias com renda limitada, essas instituições são o coração da lista.",
      },
      {
        titulo: "CSS Profile e formulários financeiros",
        tagline: "A papelada que mede a sua necessidade financeira.",
        nota: "Para receber ajuda por necessidade, você preenche o CSS Profile (e às vezes formulários próprios da universidade) com os dados financeiros da família. Precisão e antecedência aqui valem milhares de dólares em bolsa.",
      },
      {
        titulo: "Planejando o orçamento familiar",
        tagline: "A conversa honesta sobre quanto a família pode investir.",
        nota: "Antes de qualquer formulário, a família precisa ter uma conversa honesta: quanto pode investir por ano e por quanto tempo. Esse número realista é o que orienta a estratégia de bolsas e a composição da lista.",
      },
      {
        titulo: "Empréstimos: quando faz sentido",
        tagline: "As opções de crédito — e os riscos de cada uma.",
        nota: "Empréstimos internacionais existem, mas exigem cuidado: taxas, moeda e garantia. Eles fazem sentido quando complementam um plano financeiro sólido — nunca como o plano inteiro.",
      },
      {
        titulo: "Cronograma de bolsas",
        tagline: "Um calendário de editais, formulários e prazos.",
        nota: "Bolsa perdida é bolsa que tinha prazo: formulários de necessidade, editais externos e programas de mérito têm janelas próprias. Um cronograma de bolsas alinhado à candidatura evita perder oportunidades por atraso.",
      },
      {
        titulo: "Revisão: seu plano financeiro",
        tagline: "Consolidando custos, bolsas e financiamento em um plano.",
        nota: "Seu plano financeiro reúne custo real por universidade, bolsas pretendidas, formulários a preencher e o aporte familiar. Com ele, a decisão de onde aplicar — e depois de onde ir — é financeiramente consciente.",
      },
    ],
  }),
  buildModule({
    number: 10,
    slug: "entrevistas-e-decisao",
    title: "Entrevistas, deferimentos e decisão",
    description:
      "Prepare-se para o último trecho: entrevistas, waitlists, cartas de aceitação e a decisão final.",
    aulas: [
      {
        titulo: "Como funcionam as entrevistas",
        tagline: "O que é, quem faz e o que as universidades avaliam.",
        nota: "A entrevista é uma conversa que complementa os papéis: mostra se você se expressa bem, se é curioso e se se encaixa. Nem toda universidade entrevista, e nem toda entrevista influencia a decisão — mas prepare-se como se fosse.",
      },
      {
        titulo: "Perguntas mais comuns",
        tagline: "As perguntas que você quase certamente vai ouvir.",
        nota: "“Conte sobre você”, “por que quer estudar X”, “por que nossa universidade”, “me conte uma dificuldade”. Preparar respostas sinceras com exemplos concretos — sem decorar — é o melhor treino para qualquer entrevista.",
      },
      {
        titulo: "Sua história em uma conversa",
        tagline: "Contar o essencial em dois minutos — sem monólogo.",
        nota: "A entrevista pede a sua história em versão falada: breve, organizada e com espaço para perguntas. Treinar um “elevator pitch” pessoal — quem você é e para onde quer ir — transforma a conversa em vantagem.",
      },
      {
        titulo: "Entrevista por vídeo e com alumni",
        tagline: "Os formatos possíveis — e como se preparar para cada um.",
        nota: "Algumas entrevistas são por vídeo gravado, outras ao vivo com ex-alunos. Cada formato pede preparo diferente: ambiente, tempo de resposta e perguntas que o entrevistador pode ou não fazer. Flexibilidade é a habilidade-chave.",
      },
      {
        titulo: "Pós-envio: o que acontece agora",
        tagline: "O que as universidades fazem com sua candidatura.",
        nota: "Depois do envio, sua aplicação passa por leitura, avaliação e decisão — em comitês, com contexto regional. Saber o processo reduz ansiedade: o que você pode controlar (portais, pendências) e o que não pode (a decisão).",
      },
      {
        titulo: "Deferimentos e waitlists",
        tagline: "O que significam e o que fazer se acontecer com você.",
        nota: "Deferido ou em waitlist não é “não”: é um “ainda não”. Carta de interesse, novas conquistas e comunicação respeitosa podem ajudar — mas a estratégia principal é seguir a vida com o plano em andamento.",
      },
      {
        titulo: "Lendo suas cartas de aceitação",
        tagline: "Entender o que cada carta realmente oferece.",
        nota: "Carta de aceitação não é só um “sim”: é um pacote com condições, prazos e, muitas vezes, uma oferta financeira. Ler com calma — o que exige, quanto custa, quando decidir — transforma a euforia em boa decisão.",
      },
      {
        titulo: "Comparando ofertas financeiras",
        tagline: "Colocar lado a lado custos, bolsas e condições.",
        nota: "Comparar ofertas é comparar pacotes completos: custo líquido após bolsa, mensalidade, moradia e as condições de cada ajuda. Uma planilha honesta — não a emoção da carta — deve guiar a decisão final.",
      },
      {
        titulo: "Celebrando e agradecendo",
        tagline: "O encerramento do processo com quem te ajudou.",
        nota: "Terminar bem é parte da jornada: agradecer quem te apoiou, professores, recomendadores e família. Além de gratidão genuína, é networking — essas pessoas seguirão na sua trajetória.",
      },
      {
        titulo: "Revisão: daqui até a matrícula",
        tagline: "O plano do pós-decisão: visto, moradia e chegada.",
        nota: "Depois de escolher, o trabalho continua: visto de estudante, moradia, matrícula, saúde e passagem. Este fechamento transforma a decisão em plano de chegada — e encerra a sua jornada de candidatura com tudo organizado.",
      },
    ],
  }),
];

export const TOTAL_LESSONS = MODULES.reduce((total, module) => total + module.totalLessons, 0);
