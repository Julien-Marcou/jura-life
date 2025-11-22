import type { PinType } from './pin-type';
import type { Trail } from './trail';
import type { InfoWindow } from '../map-overlays/info-window';
import type { Marker } from '../map-overlays/marker';

export type PointOfInterest = {
  id: string;
  name: string;
  type: PinType;
  position: google.maps.LatLng;
  content: HTMLElement;
  marker: Marker;
  infoWindow: InfoWindow;
  trails?: Trail[];
  photospheres?: string[];
  isWinterExclusive: boolean;
  isSummerExclusive: boolean;
  isIndoor: boolean;
  isLandscape: boolean;
  isActivity: boolean;
  isAccessibleWithoutWalkingMuch?: boolean;
};
