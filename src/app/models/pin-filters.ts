import type { FeatureType } from './feature-type';
import type { PinType } from './pin-type';
import type { SeasonType } from './season-type';

export type PinFilters = Partial<{
  season: SeasonType;
  features: Partial<Record<FeatureType, boolean>>;
  categories: Partial<Record<PinType, boolean>>;
}>;
