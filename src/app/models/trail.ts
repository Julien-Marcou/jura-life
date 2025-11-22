import type { SerializedTrail } from './serialized-trail';
import type { TrailMetadata } from './trail-metadata';
import type { TrailPolyline } from './trail-polyline';

export type Trail = SerializedTrail & TrailMetadata & TrailPolyline;
