import { Subject } from 'rxjs';
import { ScrollableComponentElement } from 'scrollable-component';

export class InfoWindow extends google.maps.OverlayView {

  public readonly onSelfClose = new Subject<void>();

  private isWindowOpen = false;
  private zIndex: number;
  private position: google.maps.LatLng;
  private map: google.maps.Map;
  private containerElement: HTMLElement;
  private infoWindowElement: HTMLElement;
  private viewportElement: ScrollableComponentElement;

  constructor(zIndex: number, position: google.maps.LatLng, map: google.maps.Map, content: HTMLElement) {
    super();
    this.zIndex = zIndex;
    this.position = position;
    this.map = map;

    this.containerElement = document.createElement('div');
    this.containerElement.classList.add('info-window-container');
    this.containerElement.innerHTML = `
      <div class="info-window-anchor">
        <div class="info-window">
          <button class="minimize-button button" type="button" title="Réduire" aria-label="Réduire la fenêtre">
            <span class="material-icons" aria-hidden="true">remove</span>
          </button>
          <button class="maximize-button button" type="button" title="Agrandir" aria-label="Agrandir la fenêtre">
            <span class="material-icons" aria-hidden="true">unfold_more</span>
          </button>
          <button class="close-button button" type="button" title="Fermer" aria-label="Fermer la fenêtre">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
          <scrollable-component class="info-window-viewport" scrollbar-visibility="always"></scrollable-component>
        </div>
      </div>`;
    this.infoWindowElement = this.containerElement.querySelector('.info-window') as HTMLElement;
    this.viewportElement = this.infoWindowElement.querySelector('.info-window-viewport') as ScrollableComponentElement;
    this.viewportElement.appendChild(content);
    (this.infoWindowElement.querySelector('.minimize-button') as HTMLButtonElement).addEventListener('click', () => {
      this.containerElement.classList.add('minimized');
    }, { passive: true });
    (this.infoWindowElement.querySelector('.maximize-button') as HTMLButtonElement).addEventListener('click', () => {
      this.containerElement.classList.remove('minimized');
    }, { passive: true });
    (this.infoWindowElement.querySelector('.close-button') as HTMLButtonElement).addEventListener('click', () => {
      this.close();
      this.onSelfClose.next();
    }, { passive: true });

    InfoWindow.preventMapHitsAndGesturesFrom(this.containerElement);
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
    if (this.isWindowOpen) {
      const containerProjection = this.getProjection();
      if (!containerProjection) {
        return;
      }
      const maxWidth = window.innerWidth - 70;
      const maxHeight = window.innerHeight - 155;
      const containerPosition = containerProjection.fromLatLngToDivPixel(this.position) ?? new google.maps.Point(0, 0);
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

  public isOpen(): boolean {
    return this.isWindowOpen;
  }

  public open(): void {
    if (this.isWindowOpen) {
      return;
    }
    this.isWindowOpen = true;
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  public close(): void {
    if (!this.isWindowOpen) {
      return;
    }
    this.isWindowOpen = false;
    this.containerElement.classList.remove('minimized');
    requestAnimationFrame(() => {
      this.draw();
    });
  }

  public getBounds(): google.maps.LatLngBounds {
    const containerPosition = this.getProjection().fromLatLngToDivPixel(this.position) ?? new google.maps.Point(0, 0);
    const containerTopLeftPosition = this.getProjection().fromDivPixelToLatLng(
      new google.maps.Point(
        containerPosition.x - (this.infoWindowElement.clientWidth / 2) - 30,
        containerPosition.y - this.infoWindowElement.clientHeight - 140,
      ),
    );
    const containerBottomRightPosition = this.getProjection().fromDivPixelToLatLng(
      new google.maps.Point(
        containerPosition.x + (this.infoWindowElement.clientWidth / 2) + 30,
        containerPosition.y + 34,
      ),
    );
    return new google.maps.LatLngBounds(containerTopLeftPosition, containerBottomRightPosition);
  }

  public focus(): void {
    this.infoWindowElement.setAttribute('tabindex', '0');
    requestAnimationFrame(() => {
      this.infoWindowElement.focus();
      this.infoWindowElement.removeAttribute('tabindex');
    });
  }

}
