/**
 * Table of contents, transcribed from "PRINCIPIOS GERAIS DA TRAUMATOLOGIA 2.pdf".
 * Titles were converted from all caps to sentence case; names and affiliations are kept as
 * written. Two typographic slips in the source were normalised: "Vicenzo" → "Vincenzo"
 * (the same author signs chapters 2 and 35) and "Claúdio" → "Cláudio".
 */

export type Contributor = {
  /** Academic title exactly as listed in the table of contents. */
  title?: string;
  name: string;
  affiliation?: string;
};

export type Chapter = {
  number: number;
  title: string;
  authors: Contributor[];
};

export type Module = {
  numeral: string;
  title: string;
  chapters: Chapter[];
};

const a = (name: string, title?: string, affiliation?: string): Contributor => ({ name, title, affiliation });

export const modules: Module[] = [
  {
    numeral: 'I',
    title: 'Geral',
    chapters: [
      { number: 1, title: 'Lesões da placa de crescimento', authors: [a('Susana dos Reis Braga', 'Dra.', 'FCMSC/SP')] },
      { number: 2, title: 'Atendimento ao politraumatizado', authors: [a('Vincenzo Giordano', 'Dr.')] },
      { number: 3, title: 'Reimplantes e revascularizações', authors: [a('Rames Mattar Júnior', 'Prof. Dr.')] },
      { number: 4, title: 'Lesão traumática do plexo braquial', authors: [a('Marcelo Rosa de Rezende', 'Prof. LD.')] },
      { number: 5, title: 'Traumatismo raquimedular', authors: [a('Alexandre Fogaça Cristante', 'Prof. LD.', 'DOT/FMUSP')] },
      { number: 6, title: 'Fratura exposta', authors: [a('José Octávio Soares Hungria', 'Prof. Dr.', 'DOT/FCMSC-SP')] },
      { number: 7, title: 'Fratura por fragilidade óssea', authors: [a('Marcos Rassi Fernandes', 'Dr.', 'DOT/FMUFG')] },
      { number: 8, title: 'Síndrome compartimental', authors: [a('Fernando Baldy dos Reis', 'Prof. Dr.', 'DOT/UNIFESP')] },
      {
        number: 9,
        title: 'Reabilitação nas lesões musculoesqueléticas',
        authors: [
          a('Ana Cristina Ferreira Garcia Amorim', 'Prof.', 'DOT/FMUFG'),
          a('Eduardo de Melo Carvalho Rocha', 'Prof. Dr.', 'DOT/FCMSC-SP'),
        ],
      },
      { number: 10, title: 'Passado, presente e futuro no tratamento das fraturas', authors: [a('Osvandré Canfield Lech', 'Dr.', 'IOT/PF/RS')] },
      { number: 11, title: 'Uso de células-tronco no trauma', authors: [a('Douglas Kenji Narazaki', 'Prof.', 'DOT/FMUSP-SP')] },
    ],
  },
  {
    numeral: 'II',
    title: 'Fraturas nas crianças',
    chapters: [
      { number: 12, title: 'Fraturas dos ossos da mão', authors: [a('Antonio Carlos da Costa', 'Dr.')] },
      { number: 13, title: 'Fraturas do rádio distal', authors: [a('Francisco Carlos Salles Nogueira')] },
      { number: 14, title: 'Fraturas dos ossos do antebraço', authors: [a('Jamil Faissal Soni', 'Prof. Dr.')] },
      { number: 15, title: 'Fraturas supracondilianas do úmero', authors: [a('Marcelo Matsumoto', 'Prof. Dr.', 'DOT/UNIFESP')] },
      {
        number: 16,
        title: 'Fraturas da diáfise do úmero',
        authors: [a('Luiz Marcelo Leite', 'Dr.'), a('Marcos Rassi Fernandes', 'Prof. Dr.')],
      },
      {
        number: 17,
        title: 'Fraturas do úmero proximal',
        authors: [a('Renato Aroca Zan', 'Dr.'), a('Marcos Rassi Fernandes', 'Prof. Dr.')],
      },
      { number: 18, title: 'Fraturas da clavícula', authors: [a('João Felipe Medeiros', 'Prof.')] },
      { number: 19, title: 'Fraturas da coluna', authors: [a('Robert Meves', 'Prof. Pós-Dr.', 'FCMSC/SP')] },
      {
        number: 20,
        title: 'Fraturas da diáfise do fêmur',
        authors: [a('Weverley Valenza', 'Dr.'), a('Jamil Faissal Soni')],
      },
      { number: 21, title: 'Fraturas da tíbia e fíbula', authors: [a('Miguel Akkari', 'Dr.')] },
      { number: 22, title: 'Fraturas dos ossos do pé', authors: [a('Cláudio Beling Gonçalves Soares', 'Dr.')] },
    ],
  },
  {
    numeral: 'III',
    title: 'Fraturas nos adultos',
    chapters: [
      { number: 23, title: 'Fraturas dos ossos da mão', authors: [a('Antônio Lourenço Severo', 'Dr.', 'IOT/PF/RS')] },
      { number: 24, title: 'Fraturas do rádio distal', authors: [a('Mario Yoshihide Kuwae', 'Dr.', 'HC/UFG')] },
      { number: 25, title: 'Fraturas dos ossos do antebraço', authors: [a('Alexandre de Bustamonte Pallotino')] },
      {
        number: 26,
        title: 'Fraturas da cabeça do rádio',
        authors: [a('Pedro Godinho'), a('André Godinho'), a('Glaydson G. Godinho', 'Prof. Dr.')],
      },
      { number: 27, title: 'Fraturas do úmero distal', authors: [a('José Carlos Souza Vilela', 'Dr.')] },
      { number: 28, title: 'Fraturas da diáfise do úmero', authors: [a('Paulo Faiad Piluski', undefined, 'IOT/PF/RS')] },
      { number: 29, title: 'Fraturas do úmero proximal', authors: [a('Eduardo Angeli Malavolta', 'Prof. LD.')] },
      {
        number: 30,
        title: 'Fraturas da clavícula',
        authors: [a('Nicola Archetti Neto', 'Prof. Dr.'), a('Marcel Jun S. Tamaoki', 'Prof. LD.', 'DOT/UNIFESP')],
      },
      { number: 31, title: 'Fraturas da escápula', authors: [a('Arnaldo Amado Ferreira Neto', 'Prof. LD.', 'DOT/FMUSP')] },
      { number: 32, title: 'Fraturas da coluna cervical', authors: [a('Murilo Tavares Daher', 'Prof. Dr.', 'DOT/FMUFG')] },
      { number: 33, title: 'Fraturas da coluna toracolombar', authors: [a('Alberto Gotfryd', 'Prof. Pós-Dr.', 'DOT/FCMSC-SP')] },
      { number: 34, title: 'Fraturas do anel pélvico', authors: [a('Gustavo Tadeu Sanchez', undefined, 'EPM-UNIFESP')] },
      { number: 35, title: 'Fraturas do acetábulo', authors: [a('Vincenzo Giordano', 'Dr.', 'RJ')] },
      { number: 36, title: 'Fraturas do colo femoral', authors: [a('Anderson Freitas', 'Dr.', 'DF')] },
      {
        number: 37,
        title: 'Fraturas intertrocantéricas',
        authors: [
          a('Marcelo Tadeu Caiero', 'Dr.', 'IOT-FM/USP'),
          a('Pedro José Labronici', 'Prof. Pós-Dr.'),
          a('Gustavo Waldolato'),
        ],
      },
      { number: 38, title: 'Fraturas da diáfise do fêmur', authors: [a('Francisco Ramiro Cavalcante', 'Dr.', 'IOG-GO')] },
      { number: 39, title: 'Fraturas do fêmur distal', authors: [a('Julian Machado', 'Dr.', 'DF')] },
      { number: 40, title: 'Fraturas da patela', authors: [a('Pedro José Labronici', 'Prof. Pós-Dr.')] },
      { number: 41, title: 'Fraturas da tíbia proximal', authors: [a('Robinson Esteves Pires', 'Pós-Dr.', 'MG')] },
      { number: 42, title: 'Fraturas da diáfise da tíbia', authors: [a('Willian Dias Belangero', 'Prof. Dr.')] },
      {
        number: 43,
        title: 'Fraturas dos ossos do tornozelo',
        authors: [a('Bruno Air Machado', 'Dr.'), a('Daniel Soares Baumfeld', 'Prof. Dr.')],
      },
      { number: 44, title: 'Fraturas dos ossos do pé', authors: [a('Nacime Salomão Barbachan Mansur', 'Prof. Dr.', 'DOT/EPM-UNIFESP')] },
    ],
  },
  {
    numeral: 'IV',
    title: 'Luxações nos adultos',
    chapters: [
      { number: 45, title: 'Luxação do cotovelo', authors: [a('Joel Murachovsky', 'Prof. Dr.')] },
      { number: 46, title: 'Luxação glenoumeral', authors: [a('Benno Ejnisman', 'Prof. Dr.', 'CETE/SP')] },
      { number: 47, title: 'Luxação acromioclavicular', authors: [a('Jair Simmer Filho', 'Dr.')] },
      {
        number: 48,
        title: 'Luxação esternoclavicular',
        authors: [a('Alberto Miyazaki', 'Prof. Dr.'), a('Luciana Andrade da Silva', 'Dra.')],
      },
      { number: 49, title: 'Luxação do quadril', authors: [a('Guilherme Guadagnini Falótico', 'Dr.', 'SP')] },
    ],
  },
  {
    numeral: 'V',
    title: 'Lesões ligamentares nos adultos',
    chapters: [
      {
        number: 50,
        title: 'Lesões ligamentares do ombro',
        authors: [
          a('Marcos Rassi Fernandes', 'Prof. Dr.'),
          a('José Carlos Garcia Júnior', 'Dr.'),
          a('Mauricio Raffaelli'),
        ],
      },
      { number: 51, title: 'Lesões ligamentares do joelho', authors: [a('Ricardo Gomes Gobbi', 'Prof. Dr.', 'FMUSP')] },
      { number: 52, title: 'Lesões ligamentares do tornozelo', authors: [a('Alexandre Leme Godoy-Santos', 'Prof. LD.', 'FMUSP')] },
    ],
  },
  {
    numeral: 'VI',
    title: 'Face nos adultos',
    chapters: [{ number: 53, title: 'Fraturas dos ossos da face', authors: [a('Nivaldo Alonso', 'Prof. LD.', 'FMUSP')] }],
  },
];
