import { ParsedTrail, TrailPoint } from '../models/serialized-trail';
import { TrailPolyline } from '../models/trail-polyline';

export class TrailPolylineService {

  private static StrokeColor = '#fff';

  private static ElevationGradient = [
    {
      red: 0,
      green: 198,
      blue: 255,
      step: 0,
    },
    {
      red: 147,
      green: 85,
      blue: 255,
      step: 33,
    },
    {
      red: 255,
      green: 0,
      blue: 0,
      step: 66,
    },
    {
      red: 0,
      green: 0,
      blue: 0,
      step: 100,
    },
  ];

  public static getTrailPolyline(parsedTrail: ParsedTrail): TrailPolyline {
    const masterPolyline = new google.maps.Polyline({
      zIndex: 0,
      geodesic: true,
      clickable: false,
      strokeColor: this.StrokeColor,
      strokeOpacity: 1.0,
      strokeWeight: 7,
    });
    const elevationPolylines: Array<google.maps.Polyline> = [];

    let previousTrailPoint: TrailPoint | undefined;
    let previousPolylinePoint: google.maps.LatLng | undefined;
    for (const trailPoint of parsedTrail.points) {
      const polylinePoint = new google.maps.LatLng(trailPoint.latitude, trailPoint.longitude);
      masterPolyline.getPath().push(polylinePoint);
      if (previousTrailPoint && previousPolylinePoint) {
        elevationPolylines.push(this.getElevationPolyline(
          previousTrailPoint,
          trailPoint,
          previousPolylinePoint,
          polylinePoint,
          parsedTrail.minElevation,
          parsedTrail.maxElevation,
        ));
      }
      previousTrailPoint = trailPoint;
      previousPolylinePoint = polylinePoint;
    }

    return {
      masterPolyline: masterPolyline,
      elevationPolylines: elevationPolylines,
    };
  }

  private static getElevationPolyline(
    previousTrailPoint: TrailPoint,
    trailPoint: TrailPoint,
    previousPolylinePoint: google.maps.LatLng,
    polylinePoint: google.maps.LatLng,
    minElevation: number,
    maxElevation: number,
  ): google.maps.Polyline {
    const step = (((previousTrailPoint.elevation + trailPoint.elevation) / 2) - minElevation) * (100 / (maxElevation - minElevation));
    let minColor = this.ElevationGradient[0];
    let maxColor = this.ElevationGradient[this.ElevationGradient.length - 1];
    this.ElevationGradient.forEach((gradientColor) => {
      if (gradientColor.step <= step && gradientColor.step > minColor.step) {
        minColor = gradientColor;
      }
      if (gradientColor.step >= step && gradientColor.step < maxColor.step) {
        maxColor = gradientColor;
      }
    });
    const color = {
      red: maxColor.red,
      green: maxColor.green,
      blue: maxColor.blue,
    };
    if (minColor !== maxColor) {
      const multiplier = (step - minColor.step) * 100 / (maxColor.step - minColor.step);
      color.red = Math.round(minColor.red + (maxColor.red - minColor.red) * multiplier / 100);
      color.green = Math.round(minColor.green + (maxColor.green - minColor.green) * multiplier / 100);
      color.blue = Math.round(minColor.blue + (maxColor.blue - minColor.blue) * multiplier / 100);
    }
    return new google.maps.Polyline({
      zIndex: 1,
      path: [previousPolylinePoint, polylinePoint],
      geodesic: true,
      clickable: false,
      strokeColor: `#${color.red.toString(16).padStart(2, '0')}${color.green.toString(16).padStart(2, '0')}${color.blue.toString(16).padStart(2, '0')}`,
      strokeOpacity: 1.0,
      strokeWeight: 3,
    });
  }

}
