// HSK level per item ID (2012 standard, HSK 1-6).
// null = character not on standard HSK list (proper names, transliterations).
export const HSK_LEVELS = {
  // ── PRONOMES
  wo:       1, ni:       1, nin:      2,
  'ta-m':   1, 'ta-f':   1, men:      1,
  zhe:      1, 'na-dem': 1,

  // ── VERBOS
  shi:           1, jiao:         1, shuo:    1,
  renshi:        1, zai:          1, gongzuo: 1,
  xuexi:         1, keyi:         2, gei:     2,
  'da-dianhua':  1, fa:           3, qing:    1,
  jin:           3, zuo:          1, xiexie:  1,
  'he-drink':    1, xihuan:       1,

  // ── ADVÉRBIOS
  ye: 1, dou: 2, zhi: 2, hai: 2, bu: 1, hen: 1,

  // ── PARTÍCULAS
  ma: 1, ne: 1, de: 1,

  // ── SUBSTANTIVOS
  xing:          2, ming:         1, zi:      2,
  guo:           1, gui:          3, jinchukou: 4,
  jinkou:        4, chukou:       3, gongsi:  3,
  daxue:         2, xi:           4, dianhua: 2,
  haoma:         2, dianziyoujian: 4, dianzi: 3,
  youjian:       4, pengyou:      1, cha:     1,
  xueyuan:       4,

  // ── ADJETIVOS
  gaoxing:  1, da:       1, piaoliang: 1,
  xiao:     1, nu:       2, nan:       2,

  // ── NÚMEROS
  ling: 1,

  // ── LÍNGUA
  yu: 1, wen: 2, he: 1,

  // ── INTERROGATIVOS
  na:        1, shen:       1, me:       1,
  nar:       1, zenmeyang:  1,

  // ── NOVOS VERBOS HSK1
  ai:           1, chi:      1, du:        1,
  'hui-can':    1, 'hui-return': 1,
  kai:          1, kan:      1, kanjian:   1,
  mai:          1, neng:     1, qu:        1,
  shuijiao:     1, ting:     1, xiang:     1,
  'xie-write':  1, you:      1, zhu:       1,
  xiayu:        1, meiyou:   1, zaijian:   1,
  duibuqi:      1, bukeqi:   1, meiguanxi: 1,
  'wei-hello':  1,

  // ── NOVOS ADVÉRBIOS HSK1
  tai:          1,

  // ── NOVA PARTÍCULA HSK1
  le:           1,

  // ── NOVOS ADJETIVOS HSK1
  hao:     1, haochi: 1, leng:  1,
  re:      1, duo:    1, shao:  1,

  // ── NOVOS NÚMEROS HSK1
  'yi-num': 1, er:  1, san: 1,
  si:       1, wu:  1, liu: 1,
  qi:       1, ba:  1, jiu: 1,
  'shi-ten': 1,

  // ── NOVA LÍNGUA HSK1
  hanyu:    1,

  // ── NOVOS INTERROGATIVOS HSK1
  duoshao:  1, ji:   1, shei: 1, zenme: 1,

  // ── NOVOS SUBSTANTIVOS HSK1
  // família
  baba:     1, mama:     1, erzi:     1, nver:      1,
  // pessoas
  laoshi:   1, xuesheng: 1, tongxue:  1,
  xiansheng: 1, xiaojie: 1, ren:      1,
  // lugares
  jia:      1, xuexiao:  1, shangdian: 1, fandian:  1,
  // transporte
  chuzuche: 1, feiji:    1,
  // objetos
  shu:      1, beizi:    1, diannao:  1, dianshi:  1,
  yifu:     1, yizi:     1, zhuozi:   1,
  // animais
  gou:      1, mao:      1,
  // comida e bebida
  pingguo:  1, cai:      1, mifan:    1,
  shuiguo:  1, shui:     1,
  // classificadores
  ge:       1, ben:      1, 'xie-some': 1, kuai:    1,
  // tempo
  jintian:  1, mingtian: 1, zuotian:  1, xianzai:  1,
  xiawu:    1, zhongwu:  1, xingqi:   1, nian:     1,
  yue:      1, fenzhong: 1, shihou:   1, dian:     1,
  // posição
  shang:    1, xia:      1, li:       1,
  shangmian: 1, xiamian: 1, qianmian: 1, houmian:  1,
  // geral
  qian:     1, dongxi:   1, tianqi:   1, mingzi:   1,
  sui:      1,

  // ── NOMES PRÓPRIOS (próprios não entram no HSK)
  beijing:       null,
  zhongguo:      null,
  'lisbon-daxue':        null,
  wenxuexi:              null,
  jianada:               null,
  'dongfang-xueyuan':    null,

  // ── CARACTERES AVULSOS
  'char-xi':            2,    // oeste
  'char-ri':            1,    // sol/dia
  'char-ben':           2,    // origem
  'char-yin':           null, // fonético/India
  'char-du':            3,    // grau
  'char-ao':            null, // fonético/Austrália
  'char-li':            4,    // lucro
  'char-ya':            4,    // Ásia/segundo
  'char-pu':            null, // fonético/Portugal
  'char-tao':           null, // fonético/uva
  'char-ya-tooth':      3,    // dente
  'char-po':            null, // encosta/Singapura
  'char-lv':            4,    // lei/Filipinas
  'char-bin':           4,    // hóspede
  'char-ma':            2,    // cavalo
  'char-ge':            2,    // irmão mais velho
  'char-lun':           null, // ética/Londres
  'char-gen':           4,    // raiz
  'char-ting':          null, // corte real
  'char-nei':           3,    // interior
  'char-sha':           3,    // areia
  'char-bo':            null, // tio/árabe
  'char-se':            2,    // cor
  'char-yang':          2,    // aparência
  'char-er':            1,    // filho/sufixo
  'char-yuan':          2,    // pátio/hospital
  'char-mei':           2,    // belo/EUA
  'char-xin':           2,    // novo
  'char-wu':            null, // escuro/Uruguai
  'char-rui':           null, // auspicioso
  'char-te':            3,    // especial
  'char-tan':           null, // plano/Cazaquistão
  'char-jia':           3,    // adicionar
  'char-na':            3,    // pegar
  'char-lai':           1,    // vir
  'char-la':            3,    // puxar
  'char-bi':            2,    // comparar
  'char-luo':           null, // Roma/Rússia
  'char-ke':            null, // vencer/Iraque
  'char-lie':           4,    // fila/Israel
  'char-wei':           null, // delegar/Venezuela
  'char-bie':           2,    // não (proibição)
  'char-zen':           1,    // como (怎么)
  'char-han-chinese':   2,    // Han/chinês
  'char-yi':            3,    // por meio de
  'char-ha':            null, // ha!/Cazaquistão
  'char-ba':            null, // fonético/Brasil
  'char-han':           4,    // Coreia
  'char-fei':           null, // fonético/Filipinas
  'char-gui':           null, // fonético/Uruguai
  'char-a':             null, // prefixo/Argentina
  'char-e':             null, // Rússia
  'char-si':            null, // fonético/-stão
  'char-yi-phon':       null, // fonético/Iraque
  'char-sa':            null, // fonético/Cazaquistão
  'char-zi':            null, // fonético/Uzbequistão
};

export const HSK_FILTER_OPTIONS = [
  { id: 'all',  label: 'Todos' },
  { id: '1',    label: 'HSK 1' },
  { id: '2',    label: 'HSK 2' },
  { id: '3',    label: 'HSK 3' },
  { id: '4',    label: 'HSK 4+' },
  { id: 'none', label: 'Sem HSK' },
];
