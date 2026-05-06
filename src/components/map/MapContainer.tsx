"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import { useQuery } from "convex/react";
import maplibregl from "maplibre-gl";
import { api } from "../../../convex/_generated/api";
import LandmarkMarker from "./LandmarkMarker";
import PhotoMarker from "./PhotoMarker";
import { useMapStore } from "@/stores/mapStore";
import { useSupercluster, type PointFeature } from "@/lib/useSupercluster";
import "maplibre-gl/dist/maplibre-gl.css";

type PhotoProps = {
  _id: string;
  url: string | null;
  loveCount: number;
};

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function add3DBuildings(map: maplibregl.Map) {
  if (map.getLayer("3d-buildings")) return;
  const layers = map.getStyle().layers ?? [];
  const labelLayer = layers.find(
    (l) => l.type === "symbol" && (l.layout as { "text-field"?: unknown } | undefined)?.["text-field"]
  );
  const buildingSource = map.getStyle().sources?.openmaptiles ? "openmaptiles" : null;
  if (!buildingSource) return;
  map.addLayer(
    {
      id: "3d-buildings",
      source: buildingSource,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#aab",
        "fill-extrusion-height": [
          "case",
          ["has", "render_height"],
          ["get", "render_height"],
          ["case", ["has", "height"], ["get", "height"], 5],
        ],
        "fill-extrusion-base": [
          "case",
          ["has", "render_min_height"],
          ["get", "render_min_height"],
          0,
        ],
        "fill-extrusion-opacity": 0.7,
      },
    },
    labelLayer?.id
  );
}

function remove3DBuildings(map: maplibregl.Map) {
  if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
}

type BBox = { west: number; south: number; east: number; north: number };

function expandBBox(b: BBox, factor: number): BBox {
  const dx = (b.east - b.west) * factor;
  const dy = (b.north - b.south) * factor;
  return {
    west: b.west - dx,
    east: b.east + dx,
    south: b.south - dy,
    north: b.north + dy,
  };
}

function bboxContains(outer: BBox, inner: BBox): boolean {
  return (
    inner.west >= outer.west &&
    inner.east <= outer.east &&
    inner.south >= outer.south &&
    inner.north <= outer.north
  );
}

const ClusterMarker = memo(function ClusterMarker({
  count,
  coverUrl,
}: {
  count: number;
  coverUrl: string | null;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 48,
        height: 48,
        borderRadius: 10,
        border: "2px solid white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        overflow: "hidden",
        background: coverUrl ? `center/cover no-repeat url('${coverUrl}')` : "#d1d5db",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          background: "#2563eb",
          color: "white",
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: 8,
          border: "2px solid white",
        }}
      >
        {count}
      </div>
    </div>
  );
});

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const { bounds, zoom, setBounds, setZoom, selectLandmark, selectPhoto } = useMapStore();
  const [is3D, setIs3D] = useState(false);
  const [styleSpec, setStyleSpec] = useState<string | maplibregl.StyleSpecification>(MAP_STYLE);

  const [queryBounds, setQueryBounds] = useState<BBox | null>(null);
  if (bounds && (!queryBounds || !bboxContains(queryBounds, bounds))) {
    setQueryBounds(expandBBox(bounds, 1));
  }

  const landmarksQuery = useQuery(api.landmarks.getInBBox, queryBounds ?? "skip");
  const photosQuery = useQuery(api.photos.getInBBox, queryBounds ?? "skip");

  const [cachedLandmarks, setCachedLandmarks] = useState<typeof landmarksQuery>(undefined);
  const [cachedPhotos, setCachedPhotos] = useState<typeof photosQuery>(undefined);
  if (landmarksQuery !== undefined && landmarksQuery !== cachedLandmarks) {
    setCachedLandmarks(landmarksQuery);
  }
  if (photosQuery !== undefined && photosQuery !== cachedPhotos) {
    setCachedPhotos(photosQuery);
  }
  const landmarks = landmarksQuery ?? cachedLandmarks;
  const photos = photosQuery ?? cachedPhotos;

  const photoPoints = useMemo<PointFeature<PhotoProps>[]>(
    () =>
      (photos ?? []).map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
        properties: { _id: p._id, url: p.url, loveCount: p.loveCount },
      })),
    [photos]
  );

  const { clusters: photoClusters, index: photoIndex } = useSupercluster<PhotoProps>({
    points: photoPoints,
    bounds: queryBounds,
    zoom,
    radius: 60,
    maxZoom: 18,
  });

  function expandCluster(clusterId: number, lng: number, lat: number) {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const targetZoom = Math.min(photoIndex.getClusterExpansionZoom(clusterId), 20);
    map.easeTo({ center: [lng, lat], zoom: targetZoom, duration: 500 });
  }

  const updateBounds = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    setBounds({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
    });
    setZoom(map.getZoom());
  }, [setBounds, setZoom]);

  function handleMoveEnd() {
    updateBounds();
  }

  function handleLoad() {
    updateBounds();
    if (is3D) {
      const map = mapRef.current?.getMap();
      if (map) add3DBuildings(map);
    }
  }

  function toggle3D() {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const next = !is3D;
    setIs3D(next);
    map.easeTo({ pitch: next ? 60 : 0, bearing: next ? -20 : 0, duration: 600 });
    if (next) add3DBuildings(map);
    else remove3DBuildings(map);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(MAP_STYLE, { method: "HEAD" })
      .then((r) => {
        if (!r.ok && !cancelled) setStyleSpec(FALLBACK_STYLE);
      })
      .catch(() => {
        if (!cancelled) setStyleSpec(FALLBACK_STYLE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -0.09, latitude: 51.505, zoom: 13 }}
        mapStyle={styleSpec}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass visualizePitch />

        {landmarks?.map((l) => (
          <Marker
            key={l._id}
            longitude={l.longitude}
            latitude={l.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectLandmark(l._id);
            }}
          >
            <LandmarkMarker name={l.name} category={l.category} photoCount={l.photoCount} />
          </Marker>
        ))}

        {photoClusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties;
          if ("cluster" in props && props.cluster) {
            const leaves = photoIndex.getLeaves(props.cluster_id, 1) as PointFeature<PhotoProps>[];
            const coverUrl = leaves[0]?.properties.url ?? null;
            return (
              <Marker
                key={`cluster-${props.cluster_id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  expandCluster(props.cluster_id, lng, lat);
                }}
              >
                <ClusterMarker count={props.point_count} coverUrl={coverUrl} />
              </Marker>
            );
          }
          const photo = props as PhotoProps;
          return (
            <Marker
              key={photo._id}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                selectPhoto(photo._id);
              }}
            >
              <PhotoMarker url={photo.url} loveCount={photo.loveCount} />
            </Marker>
          );
        })}
      </Map>

      <button
        onClick={toggle3D}
        className="absolute bottom-4 right-16 z-[500] bg-white/95 backdrop-blur text-gray-700 px-3 py-2 rounded-lg text-sm font-medium shadow hover:bg-white transition-colors"
        title={is3D ? "Switch to 2D" : "Switch to 3D"}
      >
        {is3D ? "2D" : "3D"}
      </button>
    </div>
  );
}
