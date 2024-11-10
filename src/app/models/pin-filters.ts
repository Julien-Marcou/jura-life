import { Feature } from './feature';
import { PinType } from './pin-type';
import { Season } from './season';

export type PinFilters = Partial<{
  season: Season;
  features: Partial<Record<Feature, boolean>>;
  categories: Partial<Record<PinType, boolean>>;
}>;
