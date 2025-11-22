export type SerializedTrail = {
  startingPoint: string;
  duration: string;
  gpxFile: string;
  inverted?: boolean;
};

export type ParsedTrail = {
  points: TrailPoint[];
  minElevation: number;
  maxElevation: number;
  inverted?: boolean;
};

export type TrailPoint = {
  elevation: number;
  latitude: number;
  longitude: number;
};
