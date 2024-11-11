import { FeatureType } from './feature-type';

export type Feature = {
  label: string;
  isIncompatibleWith?: Array<FeatureType>;
};
