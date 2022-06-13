import { PinType } from '../constants/pin-type.constants';

export type Season = 'none' | 'not-winter' | 'summer'| 'not-summer' | 'winter' | 'all-year';

export type PinFilters = Partial<{
  season: 'none' | 'winter' | 'not-winter' | 'summer' | 'not-summer' | 'all-year';
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  hasTrail: boolean;
  hasNoTrail: boolean;
  hasPhotosphere: boolean;
  categories: Partial<Record<PinType, boolean>>;
}>;
