import type { Season } from '../models/season';

import { SeasonType } from '../models/season-type';

export const SEASONS: Record<SeasonType, Season> = {
  [SeasonType.None]: {
    label: 'Peu importe',
  },
  [SeasonType.NotWinter]: {
    label: 'En Été',
  },
  [SeasonType.Summer]: {
    label: 'Uniquement en Été',
  },
  [SeasonType.NotSummer]: {
    label: 'En Hiver',
  },
  [SeasonType.Winter]: {
    label: 'Uniquement en Hiver',
  },
  [SeasonType.AllYear]: {
    label: 'Toute l\'Année',
  },
};

export const ALL_SEASONS = Object.keys(SEASONS) as SeasonType[];
