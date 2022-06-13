import { InfoWindow } from '../map-overlays/info-window';
import { Marker } from '../map-overlays/marker';
import { PinType } from './pin-type';
import { Trail } from './trail';

export type PointOfInterest = {
  id: string;
  name: string;
  type: PinType;
  position: google.maps.LatLng;
  content: HTMLElement;
  marker: Marker;
  infoWindow: InfoWindow;
  trails?: Array<Trail>;
  photospheres?: Array<string>;
  isWinterExclusive: boolean;
  isSummerExclusive: boolean;
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  isAccessibleWithoutWalkingMuch?: boolean;
};
