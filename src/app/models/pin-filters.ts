import { PinType } from '../constants/pin-type.constants';
import { Season } from '../constants/season.constants';

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
