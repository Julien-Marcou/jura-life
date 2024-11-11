import { FeatureType } from './feature-type';
import { PinType } from './pin-type';
import { Season } from './season';

export type PinFilters = Partial<{
  season: Season;
  features: Partial<Record<FeatureType, boolean>>;
  categories: Partial<Record<PinType, boolean>>;
}>;
