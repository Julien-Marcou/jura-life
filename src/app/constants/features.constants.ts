import { Feature } from '../models/feature';
import { FeatureType } from '../models/feature-type';

export const FEATURES: Record<FeatureType, Feature> = {
  [FeatureType.IsLandscape]: {
    label: 'Paysage à voir',
    isIncompatibleWith: [FeatureType.IsActivity, FeatureType.IsIndoor],
  },
  [FeatureType.IsActivity]: {
    label: 'Activité à faire',
    isIncompatibleWith: [FeatureType.IsLandscape],
  },
  [FeatureType.IsIndoor]: {
    label: 'En intérieur',
    isIncompatibleWith: [FeatureType.IsLandscape, FeatureType.HasTrail],
  },
  [FeatureType.HasTrail]: {
    label: 'Avec randonnée',
    isIncompatibleWith: [FeatureType.IsIndoor, FeatureType.HasNoTrail],
  },
  [FeatureType.HasNoTrail]: {
    label: 'Sans randonnée',
    isIncompatibleWith: [FeatureType.HasTrail],
  },
  [FeatureType.HasPhotosphere]: {
    label: 'Aperçu photosphère',
  },
};

export const ALL_FEATURE_TYPES = Object.keys(FEATURES) as Array<FeatureType>;
