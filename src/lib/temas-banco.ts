import type { TemaGerado } from "./tema.server";

export const BANCO_TEMAS: TemaGerado[] = [
  {
    titulo: "Desafios para combater a desinformação digital no Brasil",
    eixo: "cidadania digital",
    repertorio: ["educação midiática", "algoritmos de recomendação", "responsabilidade das plataformas"],
    contexto:
      "A circulação de conteúdos falsos afeta decisões coletivas e a confiança nas instituições brasileiras.",
  },
  {
    titulo: "Caminhos para reduzir a evasão escolar no ensino médio brasileiro",
    eixo: "educação",
    repertorio: ["trabalho infantil", "escola em tempo integral", "Lei de Diretrizes e Bases"],
    contexto:
      "Muitos estudantes interrompem os estudos antes de concluir a educação básica, o que limita oportunidades futuras.",
  },
  {
    titulo: "O papel da saúde mental no ambiente escolar brasileiro",
    eixo: "saúde",
    repertorio: ["ansiedade entre jovens", "psicólogos nas escolas", "Estatuto da Criança e do Adolescente"],
    contexto:
      "O sofrimento psíquico entre adolescentes tem impacto direto na aprendizagem e na permanência na escola.",
  },
  {
    titulo: "Desafios para a mobilidade urbana sustentável nas cidades brasileiras",
    eixo: "urbanismo",
    repertorio: ["transporte público", "ciclovias", "Estatuto da Cidade"],
    contexto:
      "O deslocamento diário nas grandes cidades consome tempo, gera poluição e aprofunda desigualdades.",
  },
  {
    titulo: "Caminhos para valorizar a cultura indígena na sociedade brasileira",
    eixo: "cultura",
    repertorio: ["Lei 11.645/2008", "línguas originárias", "apagamento histórico"],
    contexto:
      "As culturas originárias seguem pouco representadas nos currículos escolares e nos meios de comunicação.",
  },
  {
    titulo: "Impactos do trabalho por aplicativos na proteção social do trabalhador brasileiro",
    eixo: "trabalho",
    repertorio: ["uberização", "CLT", "previdência social"],
    contexto:
      "O crescimento das plataformas digitais criou novas formas de trabalho sem as garantias tradicionais.",
  },
  {
    titulo: "Desafios para garantir o acesso à água potável no Brasil",
    eixo: "meio ambiente",
    repertorio: ["saneamento básico", "seca no semiárido", "ODS da ONU"],
    contexto:
      "Parte da população brasileira ainda convive com abastecimento irregular e falta de saneamento.",
  },
  {
    titulo: "A importância da inclusão de pessoas com deficiência no mercado de trabalho brasileiro",
    eixo: "direitos",
    repertorio: ["Lei de Cotas", "acessibilidade", "capacitismo"],
    contexto:
      "Barreiras físicas e atitudinais ainda restringem a participação plena dessas pessoas no trabalho formal.",
  },
  {
    titulo: "Caminhos para o enfrentamento da violência contra idosos no Brasil",
    eixo: "cidadania",
    repertorio: ["Estatuto do Idoso", "envelhecimento populacional", "redes de denúncia"],
    contexto:
      "Com o envelhecimento da população, cresce a necessidade de proteger idosos de negligência e abusos.",
  },
  {
    titulo: "Desafios para popularizar a ciência na sociedade brasileira",
    eixo: "ciência",
    repertorio: ["divulgação científica", "negacionismo", "museus e universidades públicas"],
    contexto:
      "O distanciamento entre pesquisa e público facilita a difusão de crenças sem base científica.",
  },
  {
    titulo: "O papel do esporte na formação cidadã dos jovens brasileiros",
    eixo: "educação",
    repertorio: ["projetos sociais", "escolas públicas", "saúde coletiva"],
    contexto:
      "A prática esportiva orientada contribui para disciplina, convivência e permanência escolar.",
  },
  {
    titulo: "Desafios para a segurança alimentar das famílias brasileiras",
    eixo: "saúde",
    repertorio: ["insegurança alimentar", "agricultura familiar", "programas de alimentação escolar"],
    contexto:
      "O acesso regular a alimentos de qualidade ainda não está garantido para parte da população.",
  },
];

export function temaLocal(temasAnteriores: string[] = []): TemaGerado {
  const disponiveis = BANCO_TEMAS.filter((tema) => !temasAnteriores.includes(tema.titulo));
  const lista = disponiveis.length ? disponiveis : BANCO_TEMAS;
  return lista[Math.floor(Math.random() * lista.length)]!;
}
