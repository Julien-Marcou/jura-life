import { PinType } from '../constants/pin-type.constants';
import { SerializedTrail } from './serialized-trail';

export type SerializedPointOfInterest = {
  name: string;
  latitude: number;
  longitude: number;
  type: PinType;
  description?: string;
  trails?: Array<SerializedTrail>;
  photospheres?: Array<string>;
  isWinterExclusive: boolean;
  isSummerExclusive: boolean;
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  isAccessibleWithoutWalkingMuch?: boolean;
};
