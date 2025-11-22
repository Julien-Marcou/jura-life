import type { PinType } from './pin-type';
import type { SerializedTrail } from './serialized-trail';

export type SerializedPointOfInterest = {
  name: string;
  latitude: number;
  longitude: number;
  type: PinType;
  description?: string;
  trails?: SerializedTrail[];
  photospheres?: string[];
  isWinterExclusive: boolean;
  isSummerExclusive: boolean;
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  isAccessibleWithoutWalkingMuch?: boolean;
};
