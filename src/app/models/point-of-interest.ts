import { InfoWindow } from './info-window';
import { Marker } from './marker';
import { PinType } from './pin-type';
import { Trail } from './trail';

export type PointOfInterest = {
  name: string,
  type: PinType,
  position: google.maps.LatLng,
  content: HTMLElement,
  marker: Marker,
  infoWindow: InfoWindow,
  trails?: Array<Trail>,
  photospheres?: Array<string>,
  isWinterExclusive: boolean,
  isSummerExclusive: boolean,
  isIndoor: boolean,
  isLandscape: boolean,
  isActivity: boolean,
  isAccessibleWithoutWalkingMuch?: boolean,
};
