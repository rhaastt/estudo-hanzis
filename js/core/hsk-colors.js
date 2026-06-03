import { HSK_LEVELS } from './hsk-levels.js';

export const HSK_COLOR = {
  1: '#1E6B2E',
  2: '#0D4A80',
  3: '#7A4A00',
  4: '#4A1E7A',
};

export const getHskColor = id => HSK_COLOR[HSK_LEVELS[id]] ?? '#505050';
export const getHskLevel = id => HSK_LEVELS[id] ?? null;
