import { Trail } from "./trail";

export type PointOfInterest = {
  index: number,
  name: string,
  content: Element,
  marker: google.maps.Marker,
  infoWindow: google.maps.InfoWindow,
  trails?: Array<Trail>,
  photospheres?: Array<string>,
};
