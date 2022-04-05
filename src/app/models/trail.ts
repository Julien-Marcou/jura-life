import { SerializedTrail } from './serialized-trail';
import { TrailMetadata } from './trail-metadata';
import { TrailPolyline } from './trail-polyline';

export type Trail = SerializedTrail & TrailMetadata & TrailPolyline;
