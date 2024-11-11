import { KeyValue, KeyValuePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, first, firstValueFrom, map, Subject, takeUntil } from 'rxjs';
import { ALL_FEATURE_TYPES, FEATURES } from '../../constants/features.constants';
import { JURA_POINTS_OF_INTEREST } from '../../constants/jura-points-of-interest.constants';
import { PINS, ALL_PIN_TYPES } from '../../constants/pins.constants';
import { InfoWindow } from '../../map-overlays/info-window';
import { Marker } from '../../map-overlays/marker';
import { FeatureType } from '../../models/feature-type';
import { Pin } from '../../models/pin';
import { PinFilters } from '../../models/pin-filters';
import { PinType } from '../../models/pin-type';
import { PointOfInterest } from '../../models/point-of-interest';
import { SeasonType } from '../../models/season-type';
import { SerializedPointOfInterest } from '../../models/serialized-point-of-interest';
import { Trail } from '../../models/trail';
import { TrailMetadataService } from '../../services/trail-metadata.service';
import { TrailParserBrowserService } from '../../services/trail-parser-browser.service';
import { TrailPolylineService } from '../../services/trail-polyline.service';
import { SEASONS } from '../../constants/seasons.constants';
import { HttpParams } from '@angular/common/http';

// TODO : use this to transform "svg pin + icon font" markers to simple "webp" markers
// import html2canvas from 'html2canvas';

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    KeyValuePipe,
  ],
})
export class GoogleMapsComponent implements OnInit {

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
  public filtersForm = new FormGroup({
    season: new FormControl(SeasonType.None, {nonNullable: true}),
    features: new FormGroup(GoogleMapsComponent.getFeatureTypeControls()),
    categories: new FormGroup(GoogleMapsComponent.getPinTypeControls()),
  });
  public pointOfInterestCountByPinType = GoogleMapsComponent.getPointOfInterestCountByPinType();
  public seasons = SEASONS;
  public features = FEATURES;
  public pins = PINS;
  public mapLoaded = false;

  private map!: google.maps.Map;
  private pointsOfInterest: Map<string, PointOfInterest> = new Map();
  private contentTemplate = document.createElement('template');
  private descriptionTemplate = document.createElement('template');
  private trailsTemplate = document.createElement('template');
  private trailTemplate = document.createElement('template');
  private photospheresTemplate = document.createElement('template');
  private photosphereTemplate = document.createElement('template');
  private readonly pointOfInterestAdded = new Subject<PointOfInterest>();

  constructor(private readonly route: ActivatedRoute, private readonly sanitizer: DomSanitizer, private readonly router: Router) {
    this.filtersForm = new FormGroup(this.filtersForm.controls);
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
  }

  private static getPointOfInterestCountByPinType(): Record<PinType, number> {
    const iterablePointOfInterestCountByPinType = ALL_PIN_TYPES.map((pinType) => [pinType, 0] as const);
    return Object.fromEntries(iterablePointOfInterestCountByPinType) as Record<PinType, number>;
  }

  private static getFeatureTypeControls(): Record<FeatureType, FormControl<boolean>> {
    const iterableFeatureTypeControls = ALL_FEATURE_TYPES.map((featureType) => [
      featureType,
      new FormControl(false, {nonNullable: true}),
    ] as const);
    return Object.fromEntries(iterableFeatureTypeControls) as Record<FeatureType, FormControl<boolean>>;
  }

  private static getPinTypeControls(): Record<PinType, FormControl<boolean>> {
    const iterablePinTypeControls = ALL_PIN_TYPES.map((pinType) => [
      pinType,
      new FormControl(true, {nonNullable: true}),
    ] as const);
    return Object.fromEntries(iterablePinTypeControls) as Record<PinType, FormControl<boolean>>;
  }

  public ngOnInit(): void {
    this.initGoogleMap();
    this.initFormControls();
    this.initAllPointsOfInterest();
    this.updateFiltersFromQueryParams();

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

  public compareKeepOrder(): number {
    return 0;
  }

  public comparePin(pinA: KeyValue<PinType, Pin>, pinB: KeyValue<PinType, Pin>): number {
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
    const categories = this.filtersForm.controls.categories.value as Record<PinType, boolean>;
    Object.keys(categories).forEach((pinType) => {
      categories[pinType as PinType] = check;
    });
    this.filtersForm.controls.categories.setValue(categories);
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
        this.centerMapFromQueryParams();
      });
    });
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      requestAnimationFrame(() => {
        this.mapLoaded = true;
      });
    });
  }

  private openPointOfInterestFromQueryParams(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => {
          const poiId = params.get('poi');
          const trailIndex = params.get('trail');
          return {
            poiId: poiId,
            trailIndex: trailIndex ? parseInt(trailIndex, 10) : 0,
          };
        }),
        distinctUntilChanged((previous, current) => {
          return previous.poiId === current.poiId && previous.trailIndex === current.trailIndex;
        }),
      )
      .subscribe(({ poiId, trailIndex }) => {
        if (poiId !== null) {
          const poi = this.pointsOfInterest.get(poiId);
          // If the POI already exists, open it
          if (poi) {
            this.openPointOfInterest(poi, true, trailIndex);
          }
          // Otherwise, open it as soon as it has been added
          else if (poiId in JURA_POINTS_OF_INTEREST) {
            this.pointOfInterestAdded.pipe(
              filter((addedPoi) => addedPoi.id === poiId),
              first(),
            ).subscribe((addedPoi) => {
              this.openPointOfInterest(addedPoi, true, trailIndex);
            });
          }
        }
      });
  }

  private centerMapFromQueryParams(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => {
          const latitude = params.get('lat');
          const longitude = params.get('lng');
          const zoom = params.get('zoom');
          return {
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            zoom: zoom ? parseInt(zoom, 10) : null,
          };
        }),
        distinctUntilChanged((previous, current) => {
          return previous.latitude === current.latitude && previous.longitude === current.longitude && previous.zoom === current.zoom;
        }),
      )
      .subscribe(({ latitude, longitude, zoom }) => {
        if (latitude !== null && longitude !== null) {
          this.map.setCenter(new google.maps.LatLng(latitude, longitude));
        }
        if (zoom !== null) {
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
    this.filtersForm.valueChanges.subscribe(async (filters) => {
      // resolving the incompatibilities between features will trigger the "valueChanges" again
      const hasIncompatibility = this.resolveFeatureIncompatibilities(filters);

      // so we can only proceed once the incompatibilities are resolved
      if (!hasIncompatibility) {
        this.filterPointsOfInterest(filters);
        this.updateQueryParamsFromFilters(filters);
      }
    });
  }

  private resolveFeatureIncompatibilities(filters: PinFilters): boolean {
    let hasIncompatibility = false;

    ALL_FEATURE_TYPES.forEach((featureType) => {
      const feature = FEATURES[featureType];
      const featureControl = this.filtersForm.controls.features.controls[featureType];
      const shouldDisableFeature = feature.isIncompatibleWith?.some((incompatibleFeatureType) => filters.features?.[incompatibleFeatureType]);
      if (featureControl.enabled && shouldDisableFeature) {
        featureControl.disable({emitEvent: false});
        hasIncompatibility = true;
      }
      else if (featureControl.disabled && !shouldDisableFeature) {
        featureControl.enable({emitEvent: false});
        hasIncompatibility = true;
      }
    });

    if (hasIncompatibility) {
      this.filtersForm.updateValueAndValidity();
    }

    return hasIncompatibility;
  }

  private async updateQueryParamsFromFilters(filters: PinFilters): Promise<void> {
    const queryParams: Record<string, string> = {};

    if (filters.season && filters.season !== SeasonType.None) {
      queryParams['season'] = filters.season;
    }

    const enabledFeatures = ALL_FEATURE_TYPES.filter((feature) => filters.features?.[feature]);
    if (filters.features && enabledFeatures.length !== 0) {
      queryParams['features'] = enabledFeatures.join(',');
    }

    const enabledCategories = ALL_PIN_TYPES.filter((category) => filters.categories?.[category]);
    if (filters.categories && enabledCategories.length !== ALL_PIN_TYPES.length) {
      queryParams['categories'] = enabledCategories.join(',');
    }

    // prevent infinite loop by navigating only if the query params have changed
    const currentHttpParams = new HttpParams({ fromObject: await firstValueFrom(this.route.queryParams) }).toString();
    const newHttpParams = new HttpParams({ fromObject: queryParams }).toString();
    if (currentHttpParams !== newHttpParams) {
      await this.router.navigate([], { queryParams: queryParams, replaceUrl: true });
    }
  }

  private filterPointsOfInterest(filters: PinFilters): void {
    this.pointsOfInterest.forEach((poi) => {
      this.displayOrHidePoiAccordingToFilters(poi, filters);
    });

    this.pointOfInterestAdded.pipe(
      takeUntil(this.filtersForm.valueChanges),
    ).subscribe((addedPoi) => {
      this.displayOrHidePoiAccordingToFilters(addedPoi, filters);
    });
  }

  private updateFiltersFromQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      let filtersHaveChanged = false;

      const season = params.get('season');
      if (season !== null && this.filtersForm.controls.season.value !== season) {
        this.filtersForm.controls.season.setValue(season as SeasonType, {emitEvent: false});
        filtersHaveChanged = true;
      }

      const features = params.get('features');
      if (features !== null) {
        const enabledFeatures = features.split(',') as Array<FeatureType>;
        ALL_FEATURE_TYPES.forEach((feature) => {
          const shouldSelect = enabledFeatures.includes(feature);
          const featureControl = this.filtersForm.controls.features.controls[feature];
          if (featureControl.value !== shouldSelect) {
            featureControl.setValue(shouldSelect, {emitEvent: false});
            filtersHaveChanged = true;
          }
        });
      }

      const categories = params.get('categories');
      if (categories !== null) {
        const enabledCategories = categories.split(',') as Array<PinType>;
        ALL_PIN_TYPES.forEach((category) => {
          const shouldSelected = enabledCategories.includes(category);
          const categoryControl = this.filtersForm.controls.categories.controls[category];
          if (categoryControl.value !== shouldSelected) {
            categoryControl.setValue(shouldSelected, {emitEvent: false});
            filtersHaveChanged = true;
          }
        });
      }

      if (filtersHaveChanged) {
        this.filtersForm.updateValueAndValidity();
      }
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
    if (serializedPoi.trails?.length) {
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
      this.map.panToBounds(
        bounds,
        {
          top: 75,
          bottom: 75,
          left: 50,
          right: 50,
        },
      );
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
        this.map.fitBounds(bounds, 20);
      }
      else {
        this.map.panToBounds(poi.infoWindow.getBounds(), 20);
      }
    });
  }

  private closePointOfInterst(poi: PointOfInterest): void {
    poi.infoWindow.close();
    if (poi.trails) {
      poi.trails.forEach((trail) => {
        poi.content.querySelectorAll('.select-trail').forEach((selectTrailElement) => {
          selectTrailElement.removeAttribute('disabled');
          selectTrailElement.textContent = 'Voir';
        });
        this.hideTrail(trail);
      });
      const firstSelectTrailElement = poi.content.querySelector('.select-trail');
      if (firstSelectTrailElement) {
        firstSelectTrailElement.setAttribute('disabled', 'true');
        firstSelectTrailElement.innerHTML = '<span class="material-icons" aria-hidden="true">check_box</span>';
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
    permalinkElement.href = this.router.createUrlTree([], { queryParams: { poi: id } }).toString();

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
      trails.forEach((trail) => {
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
            trails.forEach((otherTrail) => {
              trailsElement.querySelectorAll('.select-trail').forEach((otherSelectTrailElement) => {
                otherSelectTrailElement.removeAttribute('disabled');
                otherSelectTrailElement.textContent = 'Voir';
              });
              this.hideTrail(otherTrail);
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
    if (!filters.categories) {
      return false;
    }
    if (!filters.categories[poi.type]) {
      return false;
    }
    if (filters.features?.hasPhotosphere && !poi.photospheres) {
      return false;
    }
    if (filters.features?.hasTrail && (!poi.trails && poi.isAccessibleWithoutWalkingMuch !== false || poi.type === PinType.ViaFerrata)) {
      return false;
    }
    if (filters.features?.hasNoTrail && (poi.trails && poi.isAccessibleWithoutWalkingMuch === undefined || poi.isAccessibleWithoutWalkingMuch === false)) {
      return false;
    }
    if (filters.features?.isIndoor && !poi.isIndoor) {
      return false;
    }
    if (filters.features?.isLandscape && !poi.isLandscape) {
      return false;
    }
    if (filters.features?.isActivity && !poi.isActivity) {
      return false;
    }
    if (filters.season === SeasonType.Winter && !poi.isWinterExclusive) {
      return false;
    }
    if (filters.season === SeasonType.NotWinter && poi.isWinterExclusive) {
      return false;
    }
    if (filters.season === SeasonType.Summer && !poi.isSummerExclusive) {
      return false;
    }
    if (filters.season === SeasonType.NotSummer && poi.isSummerExclusive) {
      return false;
    }
    if (filters.season === SeasonType.AllYear && (poi.isSummerExclusive || poi.isWinterExclusive)) {
      return false;
    }
    return true;
  }

}
