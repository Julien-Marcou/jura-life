import type { ParsedTrail } from '../models/serialized-trail';
import type { TrailMetadata } from '../models/trail-metadata';

export class TrailMetadataService {

  public static getTrailMetadata(parsedTrail: ParsedTrail): TrailMetadata {
    const startingElevation = parsedTrail.points[0].elevation;
    const endingElevation = parsedTrail.points[parsedTrail.points.length - 1].elevation;
    let length = 0;
    let positiveElevation = 0;
    let negativeElevation = 0;
    parsedTrail.points.forEach((trailPoint, trailPointIndex) => {
      const previousTrailPoint = parsedTrail.points.at(trailPointIndex - 1);
      if (!previousTrailPoint) {
        return;
      }
      length += this.distanceInKmBetweenEarthCoordinates(trailPoint.latitude, trailPoint.longitude, previousTrailPoint.latitude, previousTrailPoint.longitude);
      const elevation = trailPoint.elevation - previousTrailPoint.elevation;
      if (elevation > 0) {
        positiveElevation += elevation;
      }
      else {
        negativeElevation -= elevation;
      }
    });

    return {
      minElevation: parsedTrail.minElevation,
      maxElevation: parsedTrail.maxElevation,
      startingElevation: parsedTrail.inverted ? endingElevation : startingElevation,
      endingElevation: parsedTrail.inverted ? startingElevation : endingElevation,
      positiveElevation: parsedTrail.inverted ? negativeElevation : positiveElevation,
      negativeElevation: parsedTrail.inverted ? positiveElevation : negativeElevation,
      length,
    };
  }

  private static distanceInKmBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

}
