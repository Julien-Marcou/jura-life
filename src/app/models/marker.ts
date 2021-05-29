import { Subject } from 'rxjs';
import { PinType } from './pin-type';
import { Pins } from './pins';

export class Marker {

  public readonly onClick: Subject<void> = new Subject();
  private marker: google.maps.Marker;
  private map: google.maps.Map;

  constructor(zIndex: number, position: google.maps.LatLng, map: google.maps.Map, title: string, type: PinType) {
    const pin = Pins[type];
    this.map = map;
    this.marker = new google.maps.Marker({
      zIndex: zIndex,
      title: title,
      label: {
        fontFamily: 'Map Icons',
        color: pin.textColor,
        fontSize: pin.fontSize,
        text: pin.icon,
      },
      icon: {
        url: `/assets/pins/${pin.color}.svg`,
        size: new google.maps.Size(33, 52),
        anchor: new google.maps.Point(16.5, 52),
        labelOrigin: new google.maps.Point(16.5, 16.5),
        // Using icons with a path make Google Maps lag
        // path: 'M4.538 12.368C4.525 12.333 4.465 12.106 4.405 11.865C4.216 11.101 3.885 10.281 3.439 9.453C3.181 8.976 3.134 8.903 2.383 7.735C1.172 5.851.957 5.318 1 4.305C1.043 3.374 1.356 2.678 2.039 2.004C2.606 1.442 3.233 1.12 3.997 1C5.89.691 7.727 1.936 8.096 3.782C8.187 4.211 8.165 4.949 8.058 5.353C7.938 5.791 7.461 6.684 6.787 7.727C5.572 9.607 5.113 10.547 4.765 11.848C4.632 12.355 4.576 12.479 4.538 12.368ZM4.538 12.368',
        // strokeColor: pin.strokeColor,
        // strokeWeight: 1,
        // strokeOpacity: 1,
        // fillColor: pin.fillColor,
        // fillOpacity: 1,
        // scale: 4.2,
        // anchor: new google.maps.Point(4.7, 12.5),
        // labelOrigin: new google.maps.Point(4.6, 4.6),
      },
      position: position,
      map: this.map,
      draggable: false,
    });

    this.marker.addListener('click', () => {
      this.onClick.next();
    });
  }

  display(): void {
    if (this.marker.getMap() === this.map) {
      return;
    }
    this.marker.setMap(this.map);
  }

  hide(): void {
    if (this.marker.getMap() === null) {
      return;
    }
    this.marker.setMap(null);
  }
}
