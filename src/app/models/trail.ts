export type Trail = {
  startingPoint: string,
  masterPolyline: google.maps.Polyline,
  elevationPolylines: Array<google.maps.Polyline>,
  startingElevation: number,
  endingElevation: number,
  minElevation: number,
  maxElevation: number,
  positiveElevation: number,
  negativeElevation: number,
  length: number,
  duration: string,
  inverted?: boolean,
};
