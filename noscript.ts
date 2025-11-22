import type { SerializedPointOfInterest } from './src/app/models/serialized-point-of-interest';
import type { SerializedTrail } from './src/app/models/serialized-trail';

import { JURA_POINTS_OF_INTEREST } from './src/app/constants/jura-points-of-interest.constants';
import { PINS } from './src/app/constants/pins.constants';
import { TrailMetadataService } from './src/app/services/trail-metadata.service';
import { TrailParserNodeJsService } from './src/app/services/trail-parser-nodejs.service';

type HtmlValue = string | number;

const html = (strings: TemplateStringsArray, ...values: HtmlValue[] | HtmlValue[][]): string => {
  let result = '';
  for (let i = 0; i < values.length; i++) {
    result += strings[i];
    const value = values[i];
    if (value instanceof Array) {
      result += value.join('');
    }
    else {
      result += `${value}`;
    }
  }
  result += strings[values.length];
  return result;
};

const renderTrailContent = (serializedTrail: SerializedTrail): string => {
  const parsedTrail = TrailParserNodeJsService.parseTrail(serializedTrail);
  const trailMetadata = TrailMetadataService.getTrailMetadata(parsedTrail);
  return html`
    <li>
      <h4>${serializedTrail.startingPoint}</h4>
      <p>
        Longueur : ${Math.round(trailMetadata.length * 100) / 100}km<br>
        Temps de marche : ${serializedTrail.duration}<br>
        Altitude min : ${Math.round(trailMetadata.minElevation)}m<br>
        Altitude max : ${Math.round(trailMetadata.maxElevation)}m<br>
        Altitude de départ : ${Math.round(trailMetadata.startingElevation)}m<br>
        Altitude d'arrivée : ${Math.round(trailMetadata.endingElevation)}m<br>
        Dénivelé positif : ${Math.round(trailMetadata.positiveElevation)}m<br>
        Dénivelé négatif : ${Math.round(trailMetadata.negativeElevation)}m
      </p>
    </li>
  `;
};

const renderPoiContent = (id: string, poi: SerializedPointOfInterest): string => html`
  <article>
    <h2 id="${id}">${poi.name}</h2>
    <p>
      Catégorie : ${PINS[poi.type].label}<br>
      ${poi.description ? html`Description : ${poi.description}` : ''}
    </p>
    <h3>Coordonées GPS</h3>
    <p>
      Latitude : ${poi.latitude}<br>
      Longitude : ${poi.longitude}
    </p>
    ${poi.trails?.length
      ? html`
      <h3>Accès</h3>
      <ul>
        ${poi.trails.map((serializedTrail) => renderTrailContent(serializedTrail))}
      </ul>
    `
      : ''}
  </article>
`;

const renderNoscriptContent = (): string => html`
  <h1>Carte Intéractive des Points d'Intérêt Touristique du Haut-Jura</h1>
  ${Object.entries(JURA_POINTS_OF_INTEREST).map(([id, poi]) => renderPoiContent(id, poi))}
`;

export default (indexHtml: string): string => {
  const noscriptContentTag = '{{NOSCRIPT_CONTENT}}';
  const noscriptContent = renderNoscriptContent();
  return indexHtml.replace(noscriptContentTag, noscriptContent);
};
