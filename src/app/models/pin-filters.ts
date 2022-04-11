import { PinType } from '../constants/pin-type.constants';

export type PinFilters = {
  season: 'none' | 'winter' | 'not-winter' | 'summer' | 'not-summer' | 'all-year';
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  hasTrail: boolean;
  hasNoTrail: boolean;
  hasPhotosphere: boolean;
  categories: Record<PinType, boolean>;
};
