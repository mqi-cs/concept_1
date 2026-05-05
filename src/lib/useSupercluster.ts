"use client";

import { useMemo } from "react";
import Supercluster from "supercluster";

type ClusterProps = { cluster: true; cluster_id: number; point_count: number };

export interface PointFeature<T> {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: T;
}

export type ClusterFeature<T> =
  | PointFeature<T & { cluster?: false }>
  | PointFeature<ClusterProps>;

interface UseSuperclusterArgs<T extends Record<string, unknown>> {
  points: PointFeature<T>[];
  bounds: { west: number; south: number; east: number; north: number } | null;
  zoom: number;
  radius?: number;
  maxZoom?: number;
}

export function useSupercluster<T extends Record<string, unknown>>({
  points,
  bounds,
  zoom,
  radius = 60,
  maxZoom = 18,
}: UseSuperclusterArgs<T>) {
  const index = useMemo(() => {
    const sc = new Supercluster<T, ClusterProps>({ radius, maxZoom });
    sc.load(points as Supercluster.PointFeature<T>[]);
    return sc;
  }, [points, radius, maxZoom]);

  const clusters = useMemo(() => {
    if (!bounds) return [] as ClusterFeature<T>[];
    return index.getClusters(
      [bounds.west, bounds.south, bounds.east, bounds.north],
      Math.floor(zoom)
    ) as ClusterFeature<T>[];
  }, [index, bounds, zoom]);

  return { clusters, index };
}
