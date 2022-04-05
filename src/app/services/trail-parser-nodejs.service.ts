import { readFileSync } from 'fs';
import * as jsdom from 'jsdom';
import { ParsedTrail, SerializedTrail } from '../models/serialized-trail';

export class TrailParserNodeJsService {

  public static async parseTrail(serializedTrail: SerializedTrail): Promise<ParsedTrail> {
    const gpxString = readFileSync(`${__dirname}/../../assets/trails/${serializedTrail.gpxFile}`).toString();
    const gpxDocument = new jsdom.JSDOM(gpxString, { contentType: 'text/xml' }).window.document;
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
