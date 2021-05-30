import { KeyValue } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { InfoWindow } from './models/info-window';
import { JuraPointsOfInterest } from './models/jura-points-of-interest';
import { Marker } from './models/marker';
import { Pin } from './models/pin';
import { PinType } from './models/pin-type';
import { Pins } from './models/pins';
import { PointOfInterest } from './models/point-of-interest';
import { SerializedPointOfInterest } from './models/serialized-point-of-interest';
import { SerializedTrail } from './models/serialized-trail';
import { Trail } from './models/trail';

type PinFilters = {
  season: 'none' | 'winter' | 'not-winter' | 'summer' | 'not-summer' | 'all-year',
  isIndoor: boolean,
  isLandscape: boolean,
  isActivity: boolean,
  hasTrail: boolean,
  hasNoTrail: boolean,
  hasPhotosphere: boolean,
  categories: Record<PinType, boolean>,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  @ViewChild('mapElement', {static: true}) mapElement?: ElementRef<HTMLElement>;

  private map!: google.maps.Map;
  private pointsOfInterest: Map<string, PointOfInterest> = new Map();
  private contentTemplate = document.createElement('template');
  private descriptionTemplate = document.createElement('template');
  private trailsTemplate = document.createElement('template');
  private trailTemplate = document.createElement('template');
  private photospheresTemplate = document.createElement('template');
  private photosphereTemplate = document.createElement('template');

  public photosphere?: SafeResourceUrl;
  public displayFilters = false;
  public filtersForm = new FormGroup({
    season: new FormControl('none'),
    isIndoor: new FormControl(false),
    isLandscape: new FormControl(false),
    isActivity: new FormControl(false),
    hasTrail: new FormControl(false),
    hasNoTrail: new FormControl(false),
    hasPhotosphere: new FormControl(false),
    categories: new FormGroup({}),
  });
  public pointOfInterestCountByPinType: Record<string, number>;
  public pins = Pins;

  constructor(private readonly route: ActivatedRoute, private readonly sanitizer: DomSanitizer) {
    this.contentTemplate.innerHTML = `
      <div class="content">
        <a class="permalink">
          <span class="material-icons">link</span>
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
          <button class="select-trail">Voir</button>
        </h3>
        <div class="topology"></div>
      </li>`;
    this.photospheresTemplate.innerHTML = `
      <ul class="photospheres"></ul>`;
    this.photosphereTemplate.innerHTML = `
      <li class="photosphere">
        <h3 class="name">
          <span class="label"></span>
          <button class="select-photosphere">Voir</button>
        </h3>
      </li>`;
    this.pointOfInterestCountByPinType = Object.fromEntries(Object.keys(Pins).map(pinType => [pinType, 0]));
    Object.keys(Pins).forEach(pinType => {
      (this.filtersForm.controls.categories as FormGroup).addControl(pinType, new FormControl(true));
    });
  }

  async ngOnInit(): Promise<void> {
    this.initFormControls();
    this.initGoogleMap();
    await this.initAllPointsOfInterest();
    this.route.queryParams.subscribe(params => {
      if (params.poi && this.pointsOfInterest.has(params.poi)) {
        const poi = this.pointsOfInterest.get(params.poi)!;
        if (params.trail && poi.trails && params.trail in poi.trails) {
          this.openPointOfInterest(poi, true, params.trail);
        }
        else {
          this.openPointOfInterest(poi, true);
        }
      }
      if (params.lat && params.lng) {
        this.map.setCenter(new google.maps.LatLng(parseFloat(params.lat), parseFloat(params.lng)));
      }
      if (params.zoom) {
        this.map.setZoom(parseInt(params.zoom, 10));
      }
    });
  }

  initGoogleMap(): void {
    this.map = new google.maps.Map(this.mapElement!.nativeElement, {
      center: { lat: 46.4789051, lng: 5.8939042 },
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      clickableIcons: false,
      gestureHandling: 'greedy',
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
    });
  }

  async initAllPointsOfInterest(): Promise<void> {
    await Promise.all(Object.entries(JuraPointsOfInterest).map(([id, poi]) => this.addPointOfInterest(id, poi)));
  }

  initFormControls(): void {
    const isLandscapeControl = this.filtersForm.get('isLandscape')!;
    const isActivityControl = this.filtersForm.get('isActivity')!;
    const isIndoorControl = this.filtersForm.get('isIndoor')!;
    const hasTrailControl = this.filtersForm.get('hasTrail')!;
    const hasNoTrailControl = this.filtersForm.get('hasNoTrail')!;

    this.filtersForm.valueChanges.subscribe((filters: PinFilters) => {
      if (filters.isActivity || filters.isIndoor) {
        if (isLandscapeControl.enabled) {
          isLandscapeControl.disable();
        }
      }
      else if (isLandscapeControl.disabled) {
        isLandscapeControl.enable();
      }

      if (filters.isLandscape) {
        if (isActivityControl.enabled) {
          isActivityControl.disable();
        }
      }
      else if (isActivityControl.disabled) {
        isActivityControl.enable();
      }

      if (filters.isLandscape || filters.hasTrail) {
        if (isIndoorControl.enabled) {
          isIndoorControl.disable();
        }
      }
      else if (isIndoorControl.disabled) {
        isIndoorControl.enable();
      }

      if (filters.isIndoor || filters.hasNoTrail) {
        if (hasTrailControl.enabled) {
          hasTrailControl.disable();
        }
      }
      else if (hasTrailControl.disabled) {
        hasTrailControl.enable();
      }

      if (filters.hasTrail) {
        if (hasNoTrailControl.enabled) {
          hasNoTrailControl.disable();
        }
      }
      else if (hasNoTrailControl.disabled) {
        hasNoTrailControl.enable();
      }

      this.pointsOfInterest.forEach(poi => {
        if (this.isPoiMatchingFilters(poi, filters)) {
          poi.marker.display();
        }
        else {
          poi.marker.hide();
          this.closePointOfInterst(poi);
        }
      });
    });
  }

  async addPointOfInterest(id: string, serializedPoi: SerializedPointOfInterest): Promise<void> {
    let trails;
    if (serializedPoi.trails) {
      trails = [];
      for (const serializedTrail of serializedPoi.trails) {
        trails.push(await this.createTrail(serializedTrail));
      }
    }

    const zIndex = 10000000 - Math.round(serializedPoi.latitude * 100000) + Math.round(serializedPoi.longitude * 1000);;
    const position = new google.maps.LatLng(serializedPoi.latitude, serializedPoi.longitude);
    const marker = new Marker(zIndex, position, this.map, serializedPoi.name, serializedPoi.type);
    const content = this.createContent(id, serializedPoi, trails);
    const infoWindow = new InfoWindow(zIndex, position, this.map, content);
    const poi: PointOfInterest = {
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

    marker.onClick.subscribe(() => {
      if (infoWindow.isOpen()) {
        this.closePointOfInterst(poi);
      }
      else {
        this.openPointOfInterest(poi);
      }
    });

    infoWindow.onClose.subscribe(() => {
      this.closePointOfInterst(poi);
    });
  }

  openPointOfInterest(poi: PointOfInterest, centerViewport: boolean = false, trailIndex: number = 0): void {
    poi.infoWindow.open();
    if (poi.trails) {
      this.displayTrail(poi.trails[trailIndex]);
      const selectTrailElement = poi.content.querySelectorAll('.select-trail')[trailIndex];
      if (selectTrailElement) {
        selectTrailElement.textContent = '☑';
      }
    }
    requestAnimationFrame(() => {
      if (centerViewport) {
        const bounds = new google.maps.LatLngBounds(poi.position);
        const center = bounds.getCenter();
        bounds.extend(new google.maps.LatLng(center.lat() - 0.006, center.lng() - 0.006));
        bounds.extend(new google.maps.LatLng(center.lat() + 0.006, center.lng() + 0.006));
        if (poi.trails) {
          poi.trails[trailIndex].masterPolyline.getPath().forEach(point => bounds.extend(point));
        }
        const boundsListener = this.map.addListener('idle', () => {
          boundsListener.remove();
          this.map.panToBounds(poi.infoWindow.getBounds());
        });
        this.map.fitBounds(bounds);
      }
      else {
        this.map.panToBounds(poi.infoWindow.getBounds());
      }
    });
  }

  closePointOfInterst(poi: PointOfInterest): void {
    poi.infoWindow.close();
    if (poi.trails) {
      poi.trails.forEach(trail => {
        poi.content.querySelectorAll('.select-trail').forEach(_selectTrailElement => _selectTrailElement.textContent = 'Voir');
        this.hideTrail(trail);
      });
      const selectedTrailElement = poi.content.querySelector('.select-trail');
      if (selectedTrailElement) {
        selectedTrailElement.textContent = '☑';
      }
    }
  }

  displayTrail(trail: Trail): void {
    trail.masterPolyline.setMap(this.map);
    trail.elevationPolylines.forEach(polyline => {
      polyline.setMap(this.map);
    });
  }

  hideTrail(trail: Trail): void {
    trail.masterPolyline.setMap(null);
    trail.elevationPolylines.forEach(polyline => {
      polyline.setMap(null);
    });
  }

  createContent(id: string, serializedPoi: SerializedPointOfInterest, trails?: Array<Trail>): HTMLElement {
    const contentTemplate = this.contentTemplate.content.cloneNode(true) as DocumentFragment;
    const contentElement = contentTemplate.querySelector('.content') as HTMLElement;

    const permalinkElement = contentElement.querySelector('.permalink')! as HTMLLinkElement;
    permalinkElement.href = `/?poi=${id}`;

    const titleElement = contentElement.querySelector('.title')!;
    titleElement.textContent = serializedPoi.name;

    if (serializedPoi.description) {
      const descriptionTemplate = this.descriptionTemplate.content.cloneNode(true) as DocumentFragment;
      const descriptionElement = descriptionTemplate.querySelector('.description')!;
      descriptionElement.innerHTML = serializedPoi.description;
      contentElement.appendChild(descriptionElement);
    }

    if (trails) {
      const trailsTemplate = this.trailsTemplate.content.cloneNode(true) as DocumentFragment;
      const trailsElement = trailsTemplate.querySelector('.trails')!;
      for (let i = 0; i < trails.length; i++) {
        const trail = trails[i];
        const trailTemplate = this.trailTemplate.content.cloneNode(true) as DocumentFragment;
        const trailElement = trailTemplate.querySelector('.trail')!;
        const startingPointElement = trailElement.querySelector('.starting-point')!;
        const selectTrailElement = trailElement.querySelector('.select-trail')!;
        const topologyElement = trailElement.querySelector('.topology')!;
        if (trails.length === 1) {
          selectTrailElement.remove();
        }
        else {
          selectTrailElement.addEventListener('click', () => {
            trails.forEach(_trail => {
              trailsElement.querySelectorAll('.select-trail').forEach(_selectTrailElement => _selectTrailElement.textContent = 'Voir');
              this.hideTrail(_trail);
            });
            selectTrailElement.textContent = '☑';
            this.displayTrail(trail);
          });
        }
        startingPointElement.textContent = `${trail.startingPoint}`;
        topologyElement.innerHTML = `
          <div class="length">
            <span class="material-icons">straighten</span>
            Distance ${Math.round(trail.length * 100) / 100}km
          </div>
          <div class="duration">
            <span class="material-icons">timer</span>
            Durée ${trail.duration}
          </div>
          <div class="min-elevation">
            <span class="material-icons">arrow_downward</span>
            Altitude min ${Math.round(trail.minElevation)}m
          </div>
          <div class="max-elevation">
            <span class="material-icons">arrow_upward</span>
            Altitude max ${Math.round(trail.maxElevation)}m
          </div>
          <div class="positive-elevation">
            <span class="material-icons">trending_up</span>
            Dénivelé positif ${Math.round(trail.inverted ? trail.negativeElevation : trail.positiveElevation)}m
          </div>
          <div class="negative-elevation">
            <span class="material-icons">trending_down</span>
            Dénivelé négatif ${Math.round(trail.inverted ? trail.positiveElevation : trail.negativeElevation)}m
          </div>`;
        trailsElement.appendChild(trailElement);
      }
      contentElement.appendChild(trailsElement);
    }

    if (serializedPoi.photospheres) {
      const photospheresTemplate = this.photospheresTemplate.content.cloneNode(true) as DocumentFragment;
      const photospheresElement = photospheresTemplate.querySelector('.photospheres')!;
      for (let i = 0; i < serializedPoi.photospheres.length; i++) {
        const photosphere = serializedPoi.photospheres[i];
        const photosphereTemplate = this.photosphereTemplate.content.cloneNode(true) as DocumentFragment;
        const photosphereElement = photosphereTemplate.querySelector('.photosphere')!;
        const labelElement = photosphereElement.querySelector('.label')!;
        const selectPhotosphereElement = photosphereElement.querySelector('.select-photosphere')!;
        selectPhotosphereElement.addEventListener('click', () => {
          this.photosphere = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps/embed?pb=${photosphere}`);
        });
        labelElement.textContent = `Photo ${i + 1}`;
        photospheresElement.appendChild(photosphereElement);
      }
      contentElement.appendChild(photospheresElement);
    }

    return contentElement;
  }

  async createTrail(serializedTrail: SerializedTrail): Promise<Trail> {
    const gpxString = await (await fetch(`/assets/trails/${serializedTrail.gpxFile}`)).text();
    const gpxDocument = new DOMParser().parseFromString(gpxString, 'text/xml');
    const trackPoints = gpxDocument.getElementsByTagName('trkpt');

    const gradient = [
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
    let minElevation = Number.POSITIVE_INFINITY;
    let maxElevation = Number.NEGATIVE_INFINITY;
    const masterPolyline = new google.maps.Polyline({
      zIndex: 0,
      geodesic: true,
      clickable: false,
      strokeColor: '#fff',
      strokeOpacity: 1.0,
      strokeWeight: 7,
    })
    const trailPoints = [];
    for (let i = 0; i < trackPoints.length; i++) {
      const trackPoint = trackPoints[i];
      const latitude = parseFloat(trackPoint.getAttribute('lat')!);
      const longitude = parseFloat(trackPoint.getAttribute('lon')!);
      const elevation = parseFloat(trackPoint.querySelector('ele')!.textContent!);
      const point = new google.maps.LatLng(latitude, longitude);
      if (elevation < minElevation) {
        minElevation = elevation;
      }
      else if (elevation > maxElevation) {
        maxElevation = elevation;
      }
      trailPoints.push({
        elevation: elevation,
        point: point,
      });
      masterPolyline.getPath().push(point);
    }

    let length = 0;
    let positiveElevation = 0;
    let negativeElevation = 0;
    const elevationPolylines = [];
    for (let i = 1; i < trailPoints.length; i++) {
      length += this.distanceInKmBetweenEarthCoordinates(trailPoints[i].point.lat(), trailPoints[i].point.lng(), trailPoints[i - 1].point.lat(), trailPoints[i - 1].point.lng());
      const elevation = trailPoints[i].elevation - trailPoints[i - 1].elevation;
      if (elevation > 0) {
        positiveElevation += elevation;
      }
      else {
        negativeElevation -= elevation;
      }
      const step = (((trailPoints[i - 1].elevation + trailPoints[i].elevation) / 2) - minElevation) * (100 / (maxElevation - minElevation));
      let minColor = gradient[0];
      let maxColor = gradient[gradient.length - 1];
      for (const color of gradient) {
        if (color.step <= step && color.step > minColor.step) {
          minColor = color;
        }
        if (color.step >= step && color.step < maxColor.step) {
          maxColor = color;
        }
      }
      let color = {
        red: maxColor.red,
        green: maxColor.green,
        blue: maxColor.blue,
      };
      if (minColor !== maxColor) {
        const multiplier = (step - minColor.step) * 100 / (maxColor.step - minColor.step);
        color = {
          red: Math.round(minColor.red + (maxColor.red - minColor.red) * multiplier / 100),
          green: Math.round(minColor.green + (maxColor.green - minColor.green) * multiplier / 100),
          blue: Math.round(minColor.blue + (maxColor.blue - minColor.blue) * multiplier / 100),
        };
      }
      elevationPolylines.push(new google.maps.Polyline({
        zIndex: 1,
        path: [trailPoints[i - 1].point, trailPoints[i].point],
        geodesic: true,
        clickable: false,
        strokeColor: `#${color.red.toString(16).padStart(2, '0')}${color.green.toString(16).padStart(2, '0')}${color.blue.toString(16).padStart(2, '0')}`,
        strokeOpacity: 1.0,
        strokeWeight: 3,
      }));
    }

    return {
      startingPoint: serializedTrail.startingPoint,
      masterPolyline: masterPolyline,
      elevationPolylines: elevationPolylines,
      startingElevation: trailPoints[0].elevation,
      endingElevation: trailPoints[trailPoints.length - 1].elevation,
      minElevation: minElevation,
      maxElevation: maxElevation,
      positiveElevation: positiveElevation,
      negativeElevation: negativeElevation,
      length: length,
      duration: serializedTrail.duration,
      inverted: serializedTrail.inverted,
    };
  }

  isPoiMatchingFilters(poi: PointOfInterest, filters: PinFilters): boolean {
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

  distanceInKmBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  comparePin(pinA: KeyValue<string, Pin>, pinB: KeyValue<string, Pin>): number {
    return pinA.value.label.localeCompare(pinB.value.label);
  }

  toggleFilters(): void {
    this.displayFilters = !this.displayFilters;
  }

  closePhotosphere(): void {
    this.photosphere = undefined;
  }

  checkAllCategories(check: boolean): void {
    const categoriesGroup = (this.filtersForm.controls.categories as FormGroup);
    const categories = categoriesGroup.value as Record<string, boolean>;
    for (let pinType in categories) {
      categories[pinType] = check;
    }
    categoriesGroup.setValue(categories);
  }

}
