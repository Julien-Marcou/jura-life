import type { FeatureType } from './feature-type';

export type Feature = {
  label: string;
  isIncompatibleWith?: FeatureType[];
};
