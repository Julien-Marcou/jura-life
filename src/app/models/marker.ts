import { Subject } from 'rxjs';
import { PinType } from './pin-type';

export class Marker extends google.maps.OverlayView {

  public readonly onClick: Subject<void> = new Subject();
  private _isVisible: boolean = true;
  private zIndex: number;
  private position: google.maps.LatLng;
  private map: google.maps.Map;
  private containerElement: HTMLElement;
  private markerElement: HTMLButtonElement;

  constructor(zIndex: number, position: google.maps.LatLng, map: google.maps.Map, title: string, type: PinType) {
    super();
    this.zIndex = zIndex;
    this.position = position;
    this.map = map;

    this.containerElement = document.createElement('div');
    this.containerElement.classList.add('marker-container');
    this.containerElement.innerHTML = `
      <button class="marker" type="button" title="${title}">
        <img class="pin" src="/assets/markers/${type}.webp">
      </button>`;
    this.markerElement = this.containerElement.querySelector('.marker')!;
    this.markerElement.addEventListener('click', () => {
      this.onClick.next();
    });

    Marker.preventMapHitsFrom(this.containerElement);
    this.setMap(this.map);
  }

  onAdd(): void {
    this.getPanes()!.floatPane.appendChild(this.containerElement);
  }

  onRemove(): void {
    if (this.containerElement.parentElement) {
      this.containerElement.parentElement.removeChild(this.containerElement);
    }
  }

  isVisible(): boolean {
    return this._isVisible;
  }

  display(): void {
    if (this._isVisible) {
      return;
    }
    this._isVisible = true;
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  hide(): void {
    if (!this._isVisible) {
      return;
    }
    this._isVisible = false;
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  draw(): void {
    if (this._isVisible) {
      const containerPosition = this.getProjection().fromLatLngToDivPixel(this.position);
      this.containerElement.style.display = 'block';
      this.containerElement.style.zIndex = `${this.zIndex}`;
      this.containerElement.style.left = `${containerPosition.x}px`;
      this.containerElement.style.top = `${containerPosition.y}px`;
    }
    else {
      this.containerElement.style.display = 'none';
    }
  }
}
