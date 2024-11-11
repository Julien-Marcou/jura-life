import { FeatureType } from './feature-type';
import { PinType } from './pin-type';
import { SeasonType } from './season-type';

export type PinFilters = Partial<{
  season: SeasonType;
  features: Partial<Record<FeatureType, boolean>>;
  categories: Partial<Record<PinType, boolean>>;
}>;
