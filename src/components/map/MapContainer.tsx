"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import "maplibre-gl/dist/maplibre-gl.css";

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

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const { bounds, setBounds, setZoom, selectLandmark, selectPhoto } = useMapStore();
  const [is3D, setIs3D] = useState(false);
  const [styleSpec, setStyleSpec] = useState<string | maplibregl.StyleSpecification>(MAP_STYLE);

  const landmarks = useQuery(api.landmarks.getInBBox, bounds ?? "skip");
  const photos = useQuery(api.photos.getInBBox, bounds ?? "skip");

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
            <LandmarkMarker landmark={l} />
          </Marker>
        ))}

        {photos?.map((p) => (
          <Marker
            key={p._id}
            longitude={p.longitude}
            latitude={p.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectPhoto(p._id);
            }}
          >
            <PhotoMarker photo={p} />
          </Marker>
        ))}
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
