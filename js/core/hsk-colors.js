export const HSK_COLOR = {
  1: '#1E6B2E',
  2: '#0D4A80',
  3: '#7A4A00',
  4: '#4A1E7A',
};

// level (item.hsk) → cor do hanzi; null/5/6 caem no cinza padrão
export const hskColor = level => HSK_COLOR[level] ?? '#505050';
