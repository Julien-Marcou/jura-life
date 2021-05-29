import { Subject } from 'rxjs';
import { ScrollableComponentElement } from 'scrollable-component';

export class InfoWindow extends google.maps.OverlayView {

  public readonly onOpen: Subject<void> = new Subject();
  public readonly onClose: Subject<void> = new Subject();
  private _isOpen: boolean = false;
  private zIndex: number;
  private position: google.maps.LatLng;
  private map: google.maps.Map;
  private containerElement: HTMLElement;
  private infoWindowElement: HTMLElement;
  private viewportElement: ScrollableComponentElement;
  private template = document.createElement('template');

  constructor(zIndex: number, position: google.maps.LatLng, map: google.maps.Map, content: HTMLElement) {
    super();
    this.zIndex = zIndex;
    this.position = position;
    this.map = map;

    this.template.innerHTML = `
      <div class="info-window-container">
        <div class="info-window-anchor">
          <div class="info-window">
            <button class="minimize-button button" type="button" title="Réduire">
              <span class="material-icons">expand_more</span>
            </button>
            <button class="maximize-button button" type="button" title="Agrandir">
              <span class="material-icons">expand_less</span>
            </button>
            <button class="close-button button" type="button" title="Fermer">
              <span class="material-icons">close</span>
            </button>
            <scrollable-component class="info-window-viewport" scrollbar-visibility="always"></scrollable-component>
          </div>
        </div>
      </div>`;

    const template = this.template.content.cloneNode(true) as DocumentFragment;
    this.containerElement = template.querySelector('.info-window-container') as HTMLElement;
    this.infoWindowElement = template.querySelector('.info-window') as HTMLElement;
    this.viewportElement = this.infoWindowElement.querySelector('.info-window-viewport') as ScrollableComponentElement;
    this.viewportElement.appendChild(content);
    this.infoWindowElement.querySelector('.minimize-button')!.addEventListener('click', () => {
      this.containerElement.classList.add('minimized');
    });
    this.infoWindowElement.querySelector('.maximize-button')!.addEventListener('click', () => {
      this.containerElement.classList.remove('minimized');
    });
    this.infoWindowElement.querySelector('.close-button')!.addEventListener('click', () => {
      this.close();
    });

    InfoWindow.preventMapHitsAndGesturesFrom(this.containerElement);
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

  isOpen(): boolean {
    return this._isOpen;
  }

  open(): void {
    if (this._isOpen) {
      return;
    }
    this._isOpen = true;
    this.onOpen.next();
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  close(): void {
    if (!this._isOpen) {
      return;
    }
    this._isOpen = false;
    this.onClose.next();
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  draw(): void {
    if (this._isOpen) {
      const maxWidth = window.innerWidth - 60;
      const maxHeight = window.innerHeight - 90;
      const containerPosition = this.getProjection().fromLatLngToDivPixel(this.position);
      this.containerElement.style.display = 'block';
      this.containerElement.style.zIndex = `${this.zIndex}`;
      this.containerElement.style.left = `${containerPosition.x}px`;
      this.containerElement.style.top = `${containerPosition.y}px`;
      this.viewportElement.style.maxHeight = `${maxHeight}px`;
      this.viewportElement.style.maxWidth = `${maxWidth}px`;
    }
    else {
      this.containerElement.style.display = 'none';
    }
  }

  getBounds(): google.maps.LatLngBounds {
    const containerPosition = this.getProjection().fromLatLngToDivPixel(this.position);
    const containerTopLeftPosition = this.getProjection().fromDivPixelToLatLng(
      new google.maps.Point(
        containerPosition.x - (this.infoWindowElement.clientWidth / 2) - 30,
        containerPosition.y - this.infoWindowElement.clientHeight - 140
      )
    );
    const containerBottomRightPosition = this.getProjection().fromDivPixelToLatLng(
      new google.maps.Point(
        containerPosition.x + (this.infoWindowElement.clientWidth / 2) + 30,
        containerPosition.y + 34
      )
    );
    return new google.maps.LatLngBounds(containerTopLeftPosition, containerBottomRightPosition);
  }
}
