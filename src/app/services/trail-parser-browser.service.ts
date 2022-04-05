import { ParsedTrail, SerializedTrail } from '../models/serialized-trail';

export class TrailParserBrowserService {

  public static async parseTrail(serializedTrail: SerializedTrail): Promise<ParsedTrail> {
    const gpxString = await (await fetch(`/assets/trails/${serializedTrail.gpxFile}`)).text();
    const gpxDocument = new DOMParser().parseFromString(gpxString, 'text/xml');
    const trackPoints = gpxDocument.getElementsByTagName('trkpt');

    const parsedTrail: ParsedTrail = {
      points: [],
      minElevation: Number.POSITIVE_INFINITY,
      maxElevation: Number.NEGATIVE_INFINITY,
      inverted: serializedTrail.inverted,
    };
    Array.from(trackPoints).forEach((trackPoint) => {
      const latitude = parseFloat(trackPoint.getAttribute('lat') ?? '0');
      const longitude = parseFloat(trackPoint.getAttribute('lon') ?? '0');
      const elevation = parseFloat(trackPoint.querySelector('ele')?.textContent ?? '0');
      parsedTrail.points.push({
        elevation: elevation,
        latitude: latitude,
        longitude: longitude,
      });
      if (elevation < parsedTrail.minElevation) {
        parsedTrail.minElevation = elevation;
      }
      else if (elevation > parsedTrail.maxElevation) {
        parsedTrail.maxElevation = elevation;
      }
    });
    return parsedTrail;
  }

}
