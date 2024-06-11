import { Subject } from 'rxjs';
import { PinType } from '../models/pin-type';

export class Marker extends google.maps.OverlayView {

  public readonly onFocus = new Subject<void>();
  public readonly onClick = new Subject<void>();

  private isMarkerVisible = true;
  private zIndex: number;
  private position: google.maps.LatLng;
  private map: google.maps.Map;
  private containerElement: HTMLElement;
  private markerElement: HTMLButtonElement;
  private allowMarkerInteraction = true;

  constructor(zIndex: number, position: google.maps.LatLng, map: google.maps.Map, title: string, type: PinType) {
    super();
    this.zIndex = zIndex;
    this.position = position;
    this.map = map;

    this.containerElement = document.createElement('div');
    this.containerElement.classList.add('marker-container');
    this.containerElement.innerHTML = `
      <button class="marker" type="button" title="${title}" aria-label="Afficher les informations pour : ${title}">
        <img class="pin" alt="" aria-hidden="true" src="/img/markers/${type}.webp" width="33" height="52">
      </button>`;
    this.markerElement = this.containerElement.querySelector('.marker') as HTMLButtonElement;

    // Bring the focused marker into the viewport
    this.markerElement.addEventListener('focus', () => {
      if (!this.allowMarkerInteraction) {
        this.onFocus.next();
      }
    }, { passive: true });

    // Open the marker's info window
    this.markerElement.addEventListener('click', () => {
      if (this.allowMarkerInteraction) {
        this.onClick.next();
      }
    }, { passive: true });

    // Prevent focusing & clicking the marker when dragging the map from the marker
    this.markerElement.addEventListener('pointerdown', () => {
      google.maps.event.addListenerOnce(this.map, 'dragstart', () => {
        this.allowMarkerInteraction = false;
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
          this.allowMarkerInteraction = true;
        });
      });
    }, { passive: true });

    Marker.preventMapHitsFrom(this.containerElement);
    this.setMap(this.map);
  }

  public override onAdd(): void {
    const panes = this.getPanes();
    if (panes) {
      panes.floatPane.appendChild(this.containerElement);
    }
  }

  public override onRemove(): void {
    if (this.containerElement.parentElement) {
      this.containerElement.parentElement.removeChild(this.containerElement);
    }
  }

  public override draw(): void {
    if (this.isMarkerVisible) {
      const containerPosition = this.getProjection().fromLatLngToDivPixel(this.position) ?? new google.maps.Point(0, 0);
      this.containerElement.style.display = 'block';
      this.containerElement.style.zIndex = `${this.zIndex}`;
      this.containerElement.style.left = `${containerPosition.x}px`;
      this.containerElement.style.top = `${containerPosition.y}px`;
    }
    else {
      this.containerElement.style.display = 'none';
    }
  }

  public isVisible(): boolean {
    return this.isMarkerVisible;
  }

  public display(): void {
    if (this.isMarkerVisible) {
      return;
    }
    this.isMarkerVisible = true;
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  public hide(): void {
    if (!this.isMarkerVisible) {
      return;
    }
    this.isMarkerVisible = false;
    requestAnimationFrame(() => {
      this.draw();
    });
  }

}
