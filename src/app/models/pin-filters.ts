import { PinType } from './pin-type';
import { Season } from './season';

export type PinFilters = Partial<{
  season: Season;
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  hasTrail: boolean;
  hasNoTrail: boolean;
  hasPhotosphere: boolean;
  categories: Partial<Record<PinType, boolean>>;
}>;
