import type { ParsedTrail, SerializedTrail } from '../models/serialized-trail';

import { readFileSync } from 'fs';
import * as jsdom from 'jsdom';

export class TrailParserNodeJsService {

  public static parseTrail(serializedTrail: SerializedTrail): ParsedTrail {
    const gpxString = readFileSync(`${__dirname}/../../../public/trails/${serializedTrail.gpxFile}`).toString();
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
        elevation,
        latitude,
        longitude,
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
