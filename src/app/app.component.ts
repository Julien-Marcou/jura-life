import { KeyValue } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { filter, Subject, take, takeUntil } from 'rxjs';
import { JURA_POINTS_OF_INTEREST } from './constants/jura-points-of-interest.constants';
import { PinType } from './constants/pin-type.constants';
import { PINS } from './constants/pins.constants';
import { InfoWindow } from './map-overlays/info-window';
import { Marker } from './map-overlays/marker';
import { Pin } from './models/pin';
import { PinFilters } from './models/pin-filters';
import { PointOfInterest } from './models/point-of-interest';
import { SerializedPointOfInterest } from './models/serialized-point-of-interest';
import { Trail } from './models/trail';
import { TrailMetadataService } from './services/trail-metadata.service';
import { TrailParserBrowserService } from './services/trail-parser-browser.service';
import { TrailPolylineService } from './services/trail-polyline.service';

// TODO : use this to transform "svg pin + icon font" markers to simple "webp" markers
// import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  @ViewChild('mapElement', {static: true}) private mapElement!: ElementRef<HTMLElement>;

  public mapOptions: google.maps.MapOptions = {
    center: { lat: 46.4789051, lng: 5.8939042 },
    zoom: 11,
    clickableIcons: false,
    gestureHandling: 'greedy',
    // streetViewControl: false,
    // fullscreenControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [
          { visibility: 'off' },
        ],
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [
          { visibility: 'off' },
        ],
      },
      {
        featureType: 'landscape',
        elementType: 'labels',
        stylers: [
          { visibility: 'off' },
        ],
      },
    ],
  };

  public photosphere?: SafeResourceUrl;
  public displayFilters = false;
  public filtersForm: UntypedFormGroup;
  public pointOfInterestCountByPinType: Record<string, number>;
  public pins = PINS;
  public mapLoaded = false;

  private filtersFormControls = {
    season: new UntypedFormControl('none'),
    isIndoor: new UntypedFormControl(false),
    isLandscape: new UntypedFormControl(false),
    isActivity: new UntypedFormControl(false),
    hasTrail: new UntypedFormControl(false),
    hasNoTrail: new UntypedFormControl(false),
    hasPhotosphere: new UntypedFormControl(false),
    categories: new UntypedFormGroup({}),
  };
  private map!: google.maps.Map;
  private pointsOfInterest: Map<string, PointOfInterest> = new Map();
  private contentTemplate = document.createElement('template');
  private descriptionTemplate = document.createElement('template');
  private trailsTemplate = document.createElement('template');
  private trailTemplate = document.createElement('template');
  private photospheresTemplate = document.createElement('template');
  private photosphereTemplate = document.createElement('template');
  private readonly pointOfInterestAdded = new Subject<PointOfInterest>();
  private readonly paramsChanged = new Subject<void>();

  constructor(private readonly route: ActivatedRoute, private readonly sanitizer: DomSanitizer) {
    this.filtersForm = new UntypedFormGroup(this.filtersFormControls);
    this.contentTemplate.innerHTML = `
      <div class="content">
        <a class="permalink">
          <span class="material-icons" aria-hidden="true">tag</span>
          <h2 class="title"></h2>
        </a>
      </div>`;
    this.descriptionTemplate.innerHTML = `
      <p class="description"></p>`;
    this.trailsTemplate.innerHTML = `
      <ul class="trails"></ul>`;
    this.trailTemplate.innerHTML = `
      <li class="trail">
        <h3 class="name">
          <span class="starting-point"></span>
          <button class="select-trail" type="button">Voir</button>
        </h3>
        <div class="topology"></div>
      </li>`;
    this.photospheresTemplate.innerHTML = `
      <ul class="photospheres"></ul>`;
    this.photosphereTemplate.innerHTML = `
      <li class="photosphere">
        <h3 class="name">
          <span class="label"></span>
          <button class="select-photosphere" type="button">Voir</button>
        </h3>
      </li>`;
    this.pointOfInterestCountByPinType = Object.fromEntries(Object.keys(PINS).map((pinType) => [pinType, 0]));
    Object.keys(PINS).forEach((pinType) => {
      (this.filtersFormControls.categories as UntypedFormGroup).addControl(pinType, new UntypedFormControl(true));
    });
  }

  public ngOnInit(): void {
    this.initGoogleMap();
    this.initFormControls();
    this.initAllPointsOfInterest();

    // TODO : use this to transform "svg pin + icon font" markers to simple "webp" markers
    // setTimeout(async () => {
    //   const sourcePins = document.querySelectorAll('.pins.source > .pin');
    //   const targetPins = document.querySelector('.pins.target') as HTMLElement;
    //   for (const pinElement of Array.from(sourcePins)) {
    //     const canvas = await html2canvas(pinElement, {backgroundColor: null});
    //     targetPins.appendChild(canvas);
    //     const webpUrl = canvas.toDataURL('image/webp', 1);
    //     const downloadLink = document.createElement('a');
    //     downloadLink.setAttribute('href', webpUrl);
    //     downloadLink.setAttribute('download', `${pinElement.getAttribute('data-name')}.webp`);
    //     downloadLink.style.display = 'none';
    //     document.body.appendChild(downloadLink);
    //     downloadLink.click();
    //     document.body.removeChild(downloadLink);
    //     await new Promise((resolve) => {
    //       setTimeout(resolve, 80);
    //     });
    //   }
    // }, 1000);
  }

  public comparePin(pinA: KeyValue<string, Pin>, pinB: KeyValue<string, Pin>): number {
    return pinA.value.label.localeCompare(pinB.value.label);
  }

  public toggleFilters(): void {
    this.displayFilters = !this.displayFilters;
    const filtersForm = document.querySelector('.filters') as HTMLFormElement;
    filtersForm.setAttribute('tabindex', '0');
    if (this.displayFilters) {
      requestAnimationFrame(() => {
        filtersForm.focus();
        filtersForm.removeAttribute('tabindex');
      });
    }
  }

  public closePhotosphere(): void {
    this.photosphere = undefined;
  }

  public checkAllCategories(check: boolean): void {
    const categories = this.filtersFormControls.categories.value as Record<string, boolean>;
    Object.keys(categories).forEach((pinType) => {
      categories[pinType] = check;
    });
    this.filtersFormControls.categories.setValue(categories);
  }

  public keyPressForm(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'escape' && this.displayFilters) {
      this.toggleFilters();
    }
  }

  public keyPressPhotosphere(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'escape' && this.photosphere) {
      this.closePhotosphere();
    }
  }

  private initGoogleMap(): void {
    this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);
    google.maps.event.addListenerOnce(this.map, 'projection_changed', () => {
      requestAnimationFrame(() => {
        this.openPointOfInterestFromQueryParams();
      });
    });
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      requestAnimationFrame(() => {
        this.mapLoaded = true;
      });
    });
  }

  private openPointOfInterestFromQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      this.paramsChanged.next();
      const poiId: string | undefined = 'poi' in params ? params['poi'] : undefined;
      const trailIndex: number = 'trail' in params ? parseInt(params['trail'], 10) : 0;
      const latitude: number | undefined = 'lat' in params ? parseFloat(params['lat']) : undefined;
      const longitude: number | undefined = 'lng' in params ? parseFloat(params['lng']) : undefined;
      const zoom: number | undefined = 'zoom' in params ? parseInt(params['zoom'], 10) : undefined;

      if (poiId !== undefined) {
        const poi = this.pointsOfInterest.get(poiId);
        // If the POI already exists, open it
        if (poi) {
          this.openPointOfInterest(poi, true, trailIndex);
        }
        // Otherwise, open it as soon as it has been added
        else {
          this.pointOfInterestAdded.pipe(
            takeUntil(this.paramsChanged),
            filter((addedPoi) => addedPoi.id === poiId),
            take(1),
          ).subscribe((addedPoi) => {
            this.openPointOfInterest(addedPoi, true, trailIndex);
          });
        }
      }

      if (latitude !== undefined && longitude !== undefined) {
        this.map.setCenter(new google.maps.LatLng(latitude, longitude));
      }

      if (zoom !== undefined) {
        this.map.setZoom(zoom);
      }
    });
  }

  private async initAllPointsOfInterest(): Promise<void> {
    try {
      await Promise.all(Object.entries(JURA_POINTS_OF_INTEREST).map(([id, poi]) => this.addPointOfInterest(id, poi)));
      this.pointOfInterestAdded.complete();
    }
    catch (error) {
      console.error(error);
    }
  }

  private initFormControls(): void {
    this.filtersForm.valueChanges.subscribe((filters: PinFilters) => {
      if (filters.isActivity || filters.isIndoor) {
        if (this.filtersFormControls.isLandscape.enabled) {
          this.filtersFormControls.isLandscape.disable();
        }
      }
      else if (this.filtersFormControls.isLandscape.disabled) {
        this.filtersFormControls.isLandscape.enable();
      }

      if (filters.isLandscape) {
        if (this.filtersFormControls.isActivity.enabled) {
          this.filtersFormControls.isActivity.disable();
        }
      }
      else if (this.filtersFormControls.isActivity.disabled) {
        this.filtersFormControls.isActivity.enable();
      }

      if (filters.isLandscape || filters.hasTrail) {
        if (this.filtersFormControls.isIndoor.enabled) {
          this.filtersFormControls.isIndoor.disable();
        }
      }
      else if (this.filtersFormControls.isIndoor.disabled) {
        this.filtersFormControls.isIndoor.enable();
      }

      if (filters.isIndoor || filters.hasNoTrail) {
        if (this.filtersFormControls.hasTrail.enabled) {
          this.filtersFormControls.hasTrail.disable();
        }
      }
      else if (this.filtersFormControls.hasTrail.disabled) {
        this.filtersFormControls.hasTrail.enable();
      }

      if (filters.hasTrail) {
        if (this.filtersFormControls.hasNoTrail.enabled) {
          this.filtersFormControls.hasNoTrail.disable();
        }
      }
      else if (this.filtersFormControls.hasNoTrail.disabled) {
        this.filtersFormControls.hasNoTrail.enable();
      }

      this.pointsOfInterest.forEach((poi) => {
        this.displayOrHidePoiAccordingToFilters(poi, filters);
      });

      this.pointOfInterestAdded.pipe(
        takeUntil(this.filtersForm.valueChanges),
      ).subscribe((addedPoi) => {
        this.displayOrHidePoiAccordingToFilters(addedPoi, filters);
      });
    });
  }

  private displayOrHidePoiAccordingToFilters(poi: PointOfInterest, filters: PinFilters): void {
    if (this.isPoiMatchingFilters(poi, filters)) {
      poi.marker.display();
    }
    else {
      poi.marker.hide();
      if (poi.infoWindow.isOpen()) {
        this.closePointOfInterst(poi);
      }
    }
  }

  private async addPointOfInterest(id: string, serializedPoi: SerializedPointOfInterest): Promise<void> {
    let trails: Array<Trail> | undefined;
    if (serializedPoi.trails) {
      trails = await Promise.all(serializedPoi.trails.map(async (serializedTrail): Promise<Trail> => {
        const parsedTrail = await TrailParserBrowserService.parseTrail(serializedTrail);
        const trailMetadata = TrailMetadataService.getTrailMetadata(parsedTrail);
        const trailPolyline = TrailPolylineService.getTrailPolyline(parsedTrail);
        return {
          ...serializedTrail,
          ...trailMetadata,
          ...trailPolyline,
        };
      }));
    }

    const zIndex = 10000000 - Math.round(serializedPoi.latitude * 100000) + Math.round(serializedPoi.longitude * 1000);
    const position = new google.maps.LatLng(serializedPoi.latitude, serializedPoi.longitude);
    const marker = new Marker(zIndex, position, this.map, serializedPoi.name, serializedPoi.type);
    const content = this.createContent(id, serializedPoi, trails);
    const infoWindow = new InfoWindow(zIndex, position, this.map, content);
    const poi: PointOfInterest = {
      id: id,
      name: serializedPoi.name,
      type: serializedPoi.type,
      position: position,
      content: content,
      marker: marker,
      infoWindow: infoWindow,
      trails: trails,
      photospheres: serializedPoi.photospheres,
      isWinterExclusive: serializedPoi.isWinterExclusive,
      isSummerExclusive: serializedPoi.isSummerExclusive,
      isIndoor: serializedPoi.isIndoor,
      isLandscape: serializedPoi.isLandscape,
      isActivity: serializedPoi.isActivity,
    };
    if (serializedPoi.isAccessibleWithoutWalkingMuch !== undefined) {
      poi.isAccessibleWithoutWalkingMuch = serializedPoi.isAccessibleWithoutWalkingMuch;
    }
    this.pointsOfInterest.set(id, poi);
    this.pointOfInterestCountByPinType[poi.type]++;

    marker.onFocus.subscribe(() => {
      this.focusPointOfInterest(poi);
    });

    marker.onClick.subscribe(() => {
      if (infoWindow.isOpen()) {
        this.closePointOfInterst(poi);
      }
      else {
        this.openPointOfInterest(poi);
      }
    });

    infoWindow.onSelfClose.subscribe(() => {
      this.closePointOfInterst(poi);
    });

    this.pointOfInterestAdded.next(poi);
  }

  private focusPointOfInterest(poi: PointOfInterest): void {
    requestAnimationFrame(() => {
      const bounds = new google.maps.LatLngBounds(poi.position);
      const center = bounds.getCenter();
      bounds.extend(new google.maps.LatLng(center.lat() - 0.01, center.lng() - 0.01));
      bounds.extend(new google.maps.LatLng(center.lat() + 0.01, center.lng() + 0.01));
      this.map.panToBounds(bounds);
    });
  }

  private openPointOfInterest(poi: PointOfInterest, centerViewport: boolean = false, trailIndex: number = 0): void {
    poi.infoWindow.open();
    if (poi.trails) {
      this.displayTrail(poi.trails[trailIndex]);
      const selectTrailElement = poi.content.querySelectorAll('.select-trail')[trailIndex];
      if (selectTrailElement) {
        selectTrailElement.setAttribute('disabled', 'true');
        selectTrailElement.innerHTML = '<span class="material-icons" aria-hidden="true">check_box</span>';
      }
    }
    requestAnimationFrame(() => {
      if (centerViewport) {
        const bounds = new google.maps.LatLngBounds(poi.position);
        const center = bounds.getCenter();
        bounds.extend(new google.maps.LatLng(center.lat() - 0.006, center.lng() - 0.006));
        bounds.extend(new google.maps.LatLng(center.lat() + 0.006, center.lng() + 0.006));
        if (poi.trails) {
          poi.trails[trailIndex].masterPolyline.getPath().forEach((point) => bounds.extend(point));
        }
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
          this.map.panToBounds(poi.infoWindow.getBounds());
          poi.infoWindow.focus();
        });
        this.map.fitBounds(bounds);
      }
      else {
        this.map.panToBounds(poi.infoWindow.getBounds());
      }
    });
  }

  private closePointOfInterst(poi: PointOfInterest): void {
    poi.infoWindow.close();
    if (poi.trails) {
      poi.trails.forEach((trail) => {
        poi.content.querySelectorAll('.select-trail').forEach((_selectTrailElement) => {
          _selectTrailElement.removeAttribute('disabled');
          _selectTrailElement.textContent = 'Voir';
        });
        this.hideTrail(trail);
      });
      const selectTrailElement = poi.content.querySelector('.select-trail');
      if (selectTrailElement) {
        selectTrailElement.setAttribute('disabled', 'true');
        selectTrailElement.innerHTML = '<span class="material-icons" aria-hidden="true">check_box</span>';
      }
    }
  }

  private displayTrail(trail: Trail): void {
    trail.masterPolyline.setMap(this.map);
    trail.elevationPolylines.forEach((polyline) => {
      polyline.setMap(this.map);
    });
  }

  private hideTrail(trail: Trail): void {
    trail.masterPolyline.setMap(null);
    trail.elevationPolylines.forEach((polyline) => {
      polyline.setMap(null);
    });
  }

  private createContent(id: string, serializedPoi: SerializedPointOfInterest, trails?: Array<Trail>): HTMLElement {
    const contentTemplate = this.contentTemplate.content.cloneNode(true) as DocumentFragment;
    const contentElement = contentTemplate.querySelector('.content') as HTMLElement;

    const permalinkElement = contentElement.querySelector('.permalink') as HTMLLinkElement;
    permalinkElement.href = `/?poi=${id}`;

    const titleElement = contentElement.querySelector('.title') as HTMLElement;
    titleElement.textContent = serializedPoi.name;

    if (serializedPoi.description) {
      const descriptionTemplate = this.descriptionTemplate.content.cloneNode(true) as DocumentFragment;
      const descriptionElement = descriptionTemplate.querySelector('.description') as HTMLElement;
      descriptionElement.innerHTML = serializedPoi.description;
      contentElement.appendChild(descriptionElement);
    }

    if (trails) {
      const trailsTemplate = this.trailsTemplate.content.cloneNode(true) as DocumentFragment;
      const trailsElement = trailsTemplate.querySelector('.trails') as HTMLElement;
      trails.forEach((trailPromise) => {
        const trail = trailPromise;
        const trailTemplate = this.trailTemplate.content.cloneNode(true) as DocumentFragment;
        const trailElement = trailTemplate.querySelector('.trail') as HTMLElement;
        const startingPointElement = trailElement.querySelector('.starting-point') as HTMLElement;
        const selectTrailElement = trailElement.querySelector('.select-trail') as HTMLElement;
        const topologyElement = trailElement.querySelector('.topology') as HTMLElement;
        if (trails.length === 1) {
          selectTrailElement.remove();
        }
        else {
          selectTrailElement.addEventListener('click', () => {
            trails.forEach((_trail) => {
              trailsElement.querySelectorAll('.select-trail').forEach((_selectTrailElement) => {
                _selectTrailElement.removeAttribute('disabled');
                _selectTrailElement.textContent = 'Voir';
              });
              this.hideTrail(_trail);
            });
            selectTrailElement.setAttribute('disabled', 'true');
            selectTrailElement.innerHTML = '<span class="material-icons" aria-hidden="true">check_box</span>';
            this.displayTrail(trail);
          }, { passive: true });
        }
        startingPointElement.textContent = `${trail.startingPoint}`;
        selectTrailElement.setAttribute('title', 'Voir la tracé GPS');
        selectTrailElement.setAttribute('aria-label', `Voir la tracé GPS : ${trail.startingPoint}`);
        topologyElement.innerHTML = `
          <div class="length">
            <span class="material-icons" aria-hidden="true">straighten</span>
            Distance ${Math.round(trail.length * 100) / 100}km
          </div>
          <div class="duration">
            <span class="material-icons" aria-hidden="true">timer</span>
            Durée ${trail.duration}
          </div>
          <div class="min-elevation">
            <span class="material-icons" aria-hidden="true">arrow_downward</span>
            Altitude min ${Math.round(trail.minElevation)}m
          </div>
          <div class="max-elevation">
            <span class="material-icons" aria-hidden="true">arrow_upward</span>
            Altitude max ${Math.round(trail.maxElevation)}m
          </div>
          <div class="positive-elevation" aria-hidden="true">
            <span class="material-icons">trending_up</span>
            Dénivelé positif ${Math.round(trail.positiveElevation)}m
          </div>
          <div class="negative-elevation" aria-hidden="true">
            <span class="material-icons">trending_down</span>
            Dénivelé négatif ${Math.round(trail.negativeElevation)}m
          </div>`;
        trailsElement.appendChild(trailElement);
      });
      contentElement.appendChild(trailsElement);
    }

    if (serializedPoi.photospheres) {
      const photospheresTemplate = this.photospheresTemplate.content.cloneNode(true) as DocumentFragment;
      const photospheresElement = photospheresTemplate.querySelector('.photospheres') as HTMLElement;
      serializedPoi.photospheres.forEach((photosphere, photosphereIndex) => {
        const photosphereTemplate = this.photosphereTemplate.content.cloneNode(true) as DocumentFragment;
        const photosphereElement = photosphereTemplate.querySelector('.photosphere') as HTMLElement;
        const labelElement = photosphereElement.querySelector('.label') as HTMLElement;
        const selectPhotosphereElement = photosphereElement.querySelector('.select-photosphere') as HTMLElement;
        selectPhotosphereElement.addEventListener('click', () => {
          this.photosphere = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps/embed?pb=${photosphere}`);
          requestAnimationFrame(() => {
            const closePhotosphereButton = document.querySelector('.close-photosphere-button') as HTMLButtonElement;
            closePhotosphereButton.focus();
          });
        }, { passive: true });
        labelElement.textContent = `Photo ${photosphereIndex + 1}`;
        selectPhotosphereElement.setAttribute('title', 'Voir la photo');
        selectPhotosphereElement.setAttribute('aria-label', `Voir la photo ${photosphereIndex + 1}`);
        photospheresElement.appendChild(photosphereElement);
      });
      contentElement.appendChild(photospheresElement);
    }

    return contentElement;
  }

  private isPoiMatchingFilters(poi: PointOfInterest, filters: PinFilters): boolean {
    if (!filters.categories[poi.type]) {
      return false;
    }
    if (filters.hasPhotosphere && !poi.photospheres) {
      return false;
    }
    if (filters.hasTrail && (!poi.trails && poi.isAccessibleWithoutWalkingMuch !== false || poi.type === PinType.ViaFerrata)) {
      return false;
    }
    if (filters.hasNoTrail && (poi.trails && poi.isAccessibleWithoutWalkingMuch === undefined || poi.isAccessibleWithoutWalkingMuch === false)) {
      return false;
    }
    if (filters.isIndoor && !poi.isIndoor) {
      return false;
    }
    if (filters.isLandscape && !poi.isLandscape) {
      return false;
    }
    if (filters.isActivity && !poi.isActivity) {
      return false;
    }
    if (filters.season === 'winter' && !poi.isWinterExclusive) {
      return false;
    }
    if (filters.season === 'not-winter' && poi.isWinterExclusive) {
      return false;
    }
    if (filters.season === 'summer' && !poi.isSummerExclusive) {
      return false;
    }
    if (filters.season === 'not-summer' && poi.isSummerExclusive) {
      return false;
    }
    if (filters.season === 'all-year' && (poi.isSummerExclusive || poi.isWinterExclusive)) {
      return false;
    }
    return true;
  }

}
