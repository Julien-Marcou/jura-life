import { PinType } from './pin-type';
import { Trail } from './trail';

export type PointOfInterest = {
  name: string,
  type: PinType,
  content: Element,
  marker: google.maps.Marker,
  infoWindow: google.maps.InfoWindow,
  trails?: Array<Trail>,
  photospheres?: Array<string>,
  isWinterExclusive: boolean,
  isSummerExclusive: boolean,
  isIndoor: boolean,
  isLandscape: boolean,
  isActivity: boolean,
};
