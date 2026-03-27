"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, LocateFixed } from "lucide-react";
import type { FeatureCollection, Point } from "geojson";
import type * as maplibregl from "maplibre-gl";
import { Beef, Coffee, CupSoda, IceCreamBowl, Leaf, MoonStar, Sandwich, Soup, UtensilsCrossed } from "lucide";
import type { Store } from "@/modules/shared/types";
import { isStoreOpenNow } from "@/modules/shared/lib/utils";

const maplibreModulePromise = import("maplibre-gl");
const pmtilesModulePromise = import("pmtiles");

type LucideIconNode = [tag: string, attrs: Record<string, string | number | undefined>][];

interface MapClientProps {
  stores: Store[];
  selectedStore: Store | null;
  onStoreSelect: (store: Store) => void;
  area1Signal?: number;
}

type StoreProperties = {
  storeId: string;
  category: string;
  openNow: "open" | "closed";
};

const UNIFIED_FLYTO_ZOOM = 17;
const AREA_1_CENTER: [number, number] = [120.99771371419024, 24.797725784185676];
const AREA_2_CENTER: [number, number] = [120.99379987883572, 24.792979725489644];
const AREA_FOCUS_ZOOM = 17;
const STORE_SOURCE_ID = "stores-source";
const CLUSTER_LAYER_ID = "stores-clusters";
const CLUSTER_COUNT_LAYER_ID = "stores-cluster-count";
const STORE_HALO_LAYER_ID = "stores-halo";
const STORE_LAYER_ID = "stores-unclustered";
const STORE_PIN_ICON_LAYER_ID = "stores-pin-icon";
const CATEGORY_ICON_FALLBACK = "store-icon-default";
const PMTILES_STYLE_LIGHT = process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT_URL?.trim();
const PMTILES_STYLE_DARK = process.env.NEXT_PUBLIC_MAP_STYLE_DARK_URL?.trim();
const PMTILES_URL = process.env.NEXT_PUBLIC_PM_TILES_URL?.trim();

const MAP_DEFAULT_BOUNDS: [number, number, number, number] = [120.975, 24.781, 121.03, 24.815];

const CATEGORY_ICON_CONFIG: Array<{ category: string; id: string; icon: LucideIconNode }> = [
  { category: "早餐", id: "store-icon-breakfast", icon: Sandwich },
  { category: "飲料", id: "store-icon-drink", icon: CupSoda },
  { category: "甜點", id: "store-icon-dessert", icon: IceCreamBowl },
  { category: "素食", id: "store-icon-vegan", icon: Leaf },
  { category: "宵夜", id: "store-icon-night", icon: MoonStar },
  { category: "麵食", id: "store-icon-noodle", icon: Soup },
  { category: "日式", id: "store-icon-japanese", icon: Beef },
  { category: "中式", id: "store-icon-main", icon: UtensilsCrossed },
  { category: "便當", id: "store-icon-bento", icon: UtensilsCrossed },
  { category: "小吃", id: "store-icon-snack", icon: Coffee },
  { category: "正餐", id: "store-icon-meal", icon: UtensilsCrossed },
];

function buildIconSvg(iconNode: LucideIconNode, stroke: string): string {
  const children = iconNode
    .map(([tag, attrs]) => {
      const attrsText = Object.entries(attrs)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(" ");
      return `<${tag} ${attrsText} />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

async function loadMapImage(map: maplibregl.Map, svgContent: string): Promise<HTMLImageElement | ImageBitmap> {
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  const response = await map.loadImage(dataUrl);
  return response.data;
}

async function ensureCategoryPinIcons(map: maplibregl.Map) {
  if (map.getImage(CATEGORY_ICON_FALLBACK)) return;

  const stroke = "#f8fafc";
  const fallbackImage = await loadMapImage(map, buildIconSvg(UtensilsCrossed, stroke));
  map.addImage(CATEGORY_ICON_FALLBACK, fallbackImage);

  for (const item of CATEGORY_ICON_CONFIG) {
    const image = await loadMapImage(map, buildIconSvg(item.icon, stroke));
    map.addImage(item.id, image);
  }
}

function buildRasterFallbackStyle(isLightMode: boolean): maplibregl.StyleSpecification {
  const tileUrl = isLightMode
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: "carto-base", type: "raster", source: "carto" }],
  };
}

function buildPmtilesFallbackStyle(isLightMode: boolean): maplibregl.StyleSpecification {
  if (!PMTILES_URL) {
    return buildRasterFallbackStyle(isLightMode);
  }

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      nthu_pmtiles: {
        type: "vector",
        url: `pmtiles://${PMTILES_URL}`,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": isLightMode ? "#f6f8fb" : "#262a31",
        },
      },
      {
        id: "land",
        type: "fill",
        source: "nthu_pmtiles",
        "source-layer": "land",
        paint: {
          "fill-color": isLightMode ? "#edf2f7" : "#2f3640",
        },
      },
      {
        id: "ocean",
        type: "fill",
        source: "nthu_pmtiles",
        "source-layer": "ocean",
        paint: {
          "fill-color": isLightMode ? "#c2def6" : "#20384d",
        },
      },
      {
        id: "water-polygons",
        type: "fill",
        source: "nthu_pmtiles",
        "source-layer": "water_polygons",
        paint: {
          "fill-color": isLightMode ? "#a7d1f3" : "#2f4d6c",
        },
      },
      {
        id: "streets",
        type: "line",
        source: "nthu_pmtiles",
        "source-layer": "streets",
        minzoom: 11,
        paint: {
          "line-color": isLightMode ? "#8ea7c2" : "#7089a1",
          "line-opacity": isLightMode ? 0.48 : 0.44,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            [
              "match",
              ["get", "kind"],
              ["motorway", "trunk", "primary"],
              0.85,
              ["secondary", "tertiary"],
              0.65,
              ["residential", "living_street", "service"],
              0.42,
              ["pedestrian", "footway", "path", "steps", "cycleway"],
              0.24,
              0.32,
            ],
            18,
            [
              "match",
              ["get", "kind"],
              ["motorway", "trunk", "primary"],
              3.2,
              ["secondary", "tertiary"],
              2.4,
              ["residential", "living_street", "service"],
              1.8,
              ["pedestrian", "footway", "path", "steps", "cycleway"],
              1.0,
              1.35,
            ],
          ],
        },
      },
      {
        id: "street-labels",
        type: "symbol",
        source: "nthu_pmtiles",
        "source-layer": "street_labels",
        minzoom: 14,
        layout: {
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "name"], ["get", "name_en"]],
          "text-font": ["Open Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9.5, 18, 11.5],
          "symbol-spacing": 360,
        },
        paint: {
          "text-color": isLightMode ? "#53657d" : "#b3c6d9",
          "text-halo-color": isLightMode ? "#ffffff" : "#262a31",
          "text-halo-width": 1,
          "text-opacity": isLightMode ? 0.72 : 0.74,
        },
      },
      {
        id: "buildings",
        type: "fill",
        source: "nthu_pmtiles",
        "source-layer": "buildings",
        paint: {
          "fill-color": isLightMode ? "#dfe5ee" : "#3b4252",
          "fill-outline-color": isLightMode ? "#cfd6e0" : "#4c566a",
          "fill-opacity": isLightMode ? 0.35 : 0.3,
        },
      },
      {
        id: "place-labels",
        type: "symbol",
        source: "nthu_pmtiles",
        "source-layer": "place_labels",
        minzoom: 12,
        layout: {
          "text-field": ["coalesce", ["get", "name"], ["get", "name_en"]],
          "text-font": ["Open Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 16, 13],
        },
        paint: {
          "text-color": isLightMode ? "#2f3746" : "#e5e9f0",
          "text-halo-color": isLightMode ? "#ffffff" : "#262a31",
          "text-halo-width": 1,
          "text-opacity": isLightMode ? 0.82 : 0.84,
        },
      },
    ],
  };
}

function resolveMapStyle(isLightMode: boolean): string | maplibregl.StyleSpecification {
  const styleUrl = isLightMode ? PMTILES_STYLE_LIGHT : PMTILES_STYLE_DARK;
  if (styleUrl) return styleUrl;
  if (PMTILES_URL) return buildPmtilesFallbackStyle(isLightMode);
  return buildRasterFallbackStyle(isLightMode);
}

async function ensureStoreLayers(
  map: maplibregl.Map,
  data: FeatureCollection<Point, StoreProperties>,
  onStoreSelect: (storeId: string) => void
) {
  const existing = map.getSource(STORE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }

  await ensureCategoryPinIcons(map);

  map.addSource(STORE_SOURCE_ID, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 22,
    clusterMaxZoom: 15,
    clusterMinPoints: 8,
  });

  map.addLayer({
    id: CLUSTER_LAYER_ID,
    type: "circle",
    source: STORE_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#d8dee9",
      "circle-opacity": 0.62,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#eceff4",
      "circle-radius": ["step", ["get", "point_count"], 18, 15, 24, 50, 30, 120, 34],
    },
  });

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: STORE_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 14,
    },
    paint: {
      "text-color": "#262a31",
    },
  });

  map.addLayer({
    id: STORE_HALO_LAYER_ID,
    type: "circle",
    source: STORE_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 22,
      "circle-color": "#eceff4",
      "circle-opacity": ["case", ["==", ["get", "openNow"], "closed"], 0.12, 0.25],
      "circle-blur": 0.8,
    },
  });

  map.addLayer({
    id: STORE_LAYER_ID,
    type: "circle",
    source: STORE_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": 16,
      "circle-stroke-width": 2.4,
      "circle-stroke-color": "#ffffff",
      "circle-color": [
        "match",
        ["get", "category"],
        "正餐",
        "#d08770",
        "中式",
        "#d08770",
        "便當",
        "#d08770",
        "麵食",
        "#bf616a",
        "早餐",
        "#ebcb8b",
        "飲料",
        "#4c566a",
        "甜點",
        "#b48ead",
        "小吃",
        "#434c5e",
        "宵夜",
        "#434c5e",
        "素食",
        "#a3be8c",
        "日式",
        "#b48ead",
        "#4c566a",
      ],
      "circle-opacity": ["case", ["==", ["get", "openNow"], "closed"], 0.45, 1],
    },
  });

  map.addLayer({
    id: STORE_PIN_ICON_LAYER_ID,
    type: "symbol",
    source: STORE_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": [
        "match",
        ["get", "category"],
        "早餐",
        "store-icon-breakfast",
        "飲料",
        "store-icon-drink",
        "甜點",
        "store-icon-dessert",
        "素食",
        "store-icon-vegan",
        "宵夜",
        "store-icon-night",
        "麵食",
        "store-icon-noodle",
        "日式",
        "store-icon-japanese",
        "中式",
        "store-icon-main",
        "便當",
        "store-icon-bento",
        "小吃",
        "store-icon-snack",
        "正餐",
        "store-icon-meal",
        CATEGORY_ICON_FALLBACK,
      ],
      "icon-size": 0.8,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-opacity": ["case", ["==", ["get", "openNow"], "closed"], 0.65, 0.98],
    },
  });

  const handleStoreClick = (event: maplibregl.MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const coordinates = (feature.geometry as Point).coordinates;
    const storeId = String(feature.properties?.storeId ?? "");
    if (!storeId) return;
    map.easeTo({ center: [coordinates[0], coordinates[1]], zoom: UNIFIED_FLYTO_ZOOM, duration: 360 });
    onStoreSelect(storeId);
  };

  map.on("click", CLUSTER_LAYER_ID, async (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const source = map.getSource(STORE_SOURCE_ID) as maplibregl.GeoJSONSource;
    const clusterId = Number(feature.properties?.cluster_id);
    if (!Number.isFinite(clusterId)) return;

    try {
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const coordinates = (feature.geometry as Point).coordinates;
      map.easeTo({ center: [coordinates[0], coordinates[1]], zoom, duration: 360 });
    } catch {
      // Ignore expansion failures and keep map responsive.
    }
  });

  map.on("click", STORE_LAYER_ID, handleStoreClick);
  map.on("click", STORE_PIN_ICON_LAYER_ID, handleStoreClick);

  map.on("mouseenter", CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", STORE_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", STORE_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", STORE_PIN_ICON_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", STORE_PIN_ICON_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
}

export default function MapClient({
  stores,
  selectedStore,
  onStoreSelect,
  area1Signal = 0,
}: MapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const onStoreSelectRef = useRef(onStoreSelect);
  const storesByIdRef = useRef<Map<string, Store>>(new Map());
  const storeGeojsonRef = useRef<FeatureCollection<Point, StoreProperties>>({
    type: "FeatureCollection",
    features: [],
  });
  const [isLightMode, setIsLightMode] = useState(false);
  const [areaPanelCollapsed, setAreaPanelCollapsed] = useState(false);

  const storeGeojson = useMemo<FeatureCollection<Point, StoreProperties>>(() => {
    return {
      type: "FeatureCollection",
      features: stores.map((store) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [store.lng, store.lat],
        },
        properties: {
          storeId: store.id,
          category: store.category,
          openNow: isStoreOpenNow(store.hours) === false ? "closed" : "open",
        },
      })),
    };
  }, [stores]);

  function focusArea(center: [number, number]) {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.easeTo({
      center,
      zoom: AREA_FOCUS_ZOOM,
      duration: 600,
    });
  }

  useEffect(() => {
    onStoreSelectRef.current = onStoreSelect;
  }, [onStoreSelect]);

  useEffect(() => {
    storeGeojsonRef.current = storeGeojson;
  }, [storeGeojson]);

  useEffect(() => {
    storesByIdRef.current = new Map(stores.map((store) => [store.id, store]));
  }, [stores]);

  useEffect(() => {
    const syncTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("theme-light"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let destroyed = false;
    let protocol: import("pmtiles").Protocol | null = null;

    async function initMap() {
      const [{ default: maplibregl }, { Protocol, PMTiles }] = await Promise.all([
        maplibreModulePromise,
        pmtilesModulePromise,
      ]);

      if (destroyed || !mapRef.current) return;

      protocol = new Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);

      if (PMTILES_URL) {
        protocol.add(new PMTiles(PMTILES_URL));
      }

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: resolveMapStyle(document.documentElement.classList.contains("theme-light")),
        center: [120.9964, 24.7963],
        zoom: 14.6,
        minZoom: 13,
        maxZoom: 20,
        fadeDuration: 0,
        refreshExpiredTiles: false,
        renderWorldCopies: false,
        maxBounds: [
          [MAP_DEFAULT_BOUNDS[0], MAP_DEFAULT_BOUNDS[1]],
          [MAP_DEFAULT_BOUNDS[2], MAP_DEFAULT_BOUNDS[3]],
        ],
      });

      if (destroyed) {
        map.remove();
        maplibregl.removeProtocol("pmtiles");
        return;
      }

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      map.on("load", () => {
        void ensureStoreLayers(map, storeGeojsonRef.current, (storeId) => {
          const store = storesByIdRef.current.get(storeId);
          if (store) {
            onStoreSelectRef.current(store);
          }
        });
      });

      map.on("style.load", () => {
        void ensureStoreLayers(map, storeGeojsonRef.current, (storeId) => {
          const store = storesByIdRef.current.get(storeId);
          if (store) {
            onStoreSelectRef.current(store);
          }
        });
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      destroyed = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      maplibreModulePromise.then(({ default: maplibregl }) => {
        maplibregl.removeProtocol("pmtiles");
      });
      protocol = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const updateLayers = () => {
      void ensureStoreLayers(map, storeGeojson, (storeId) => {
        const store = storesByIdRef.current.get(storeId);
        if (store) {
          onStoreSelectRef.current(store);
        }
      });
    };

    if (map.isStyleLoaded()) {
      updateLayers();
      return;
    }

    map.once("load", updateLayers);
  }, [storeGeojson]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const nextStyle = resolveMapStyle(isLightMode);
    map.setStyle(nextStyle);

    const onStyleReady = () => {
      void ensureStoreLayers(map, storeGeojsonRef.current, (storeId) => {
        const store = storesByIdRef.current.get(storeId);
        if (store) {
          onStoreSelectRef.current(store);
        }
      });
    };

    map.once("style.load", onStyleReady);
  }, [isLightMode]);

  useEffect(() => {
    if (area1Signal === 0 || !mapInstanceRef.current) return;
    focusArea(AREA_1_CENTER);
  }, [area1Signal]);

  useEffect(() => {
    if (!selectedStore || !mapInstanceRef.current) return;
    mapInstanceRef.current.easeTo({
      center: [selectedStore.lng, selectedStore.lat],
      zoom: UNIFIED_FLYTO_ZOOM,
      duration: 800,
    });
  }, [selectedStore]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {!PMTILES_STYLE_LIGHT && !PMTILES_STYLE_DARK && !PMTILES_URL && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1200] -translate-x-1/2 rounded-xl border border-[var(--apricot-cream)]/60 bg-[var(--jet-black)]/75 px-3 py-1.5 text-xs text-[var(--apricot-cream)] backdrop-blur-sm">
          尚未設定 PMTiles，地圖目前使用 fallback raster。
        </div>
      )}

      {!PMTILES_STYLE_LIGHT && !PMTILES_STYLE_DARK && PMTILES_URL && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1200] -translate-x-1/2 rounded-xl border border-[var(--muted-olive)]/60 bg-[var(--jet-black)]/75 px-3 py-1.5 text-xs text-[var(--muted-olive)] backdrop-blur-sm">
          已啟用 PMTiles fallback vector style（建議再設定 light/dark style URL）。
        </div>
      )}

      <div className="absolute right-4 top-4 z-[1100] rounded-2xl border border-[var(--blue-slate)]/70 bg-[var(--jet-black)]/58 p-2 shadow-[0_12px_28px_rgba(38,42,49,0.42)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setAreaPanelCollapsed((v) => !v)}
          className="solid-light-btn flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--blue-slate)]/80 bg-[var(--charcoal-blue)]/70 text-[var(--alice-blue)] shadow-[0_8px_18px_rgba(38,42,49,0.34)] hover:bg-[var(--charcoal-blue)]"
          aria-label={areaPanelCollapsed ? "展開區域選擇" : "收合區域選擇"}
        >
          {areaPanelCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {!areaPanelCollapsed && (
          <div className="mt-2 w-44 rounded-xl border border-[var(--blue-slate)]/65 bg-[var(--jet-black)]/52 p-2 text-[var(--lavender)] backdrop-blur-sm">
            <div className="mb-1 px-1">
              <p className="text-sm font-semibold tracking-wide text-[var(--lavender)]/90">區域選擇</p>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => focusArea(AREA_1_CENTER)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--alice-blue)] hover:bg-[var(--charcoal-blue)]/70"
              >
                <LocateFixed size={15} />
                區域1
              </button>
              <button
                type="button"
                onClick={() => focusArea(AREA_2_CENTER)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--alice-blue)] hover:bg-[var(--charcoal-blue)]/70"
              >
                <LocateFixed size={15} />
                區域2
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
