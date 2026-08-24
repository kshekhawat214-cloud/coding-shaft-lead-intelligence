import {
  IDiscoveryProvider,
  DiscoveryParams,
  DiscoveryResult,
  GeocodeResult,
  RawPlaceCandidate,
} from "./discovery-provider.interface";
import {
  mapCategoriesToOSMTags,
  buildOverpassQuery,
  getCategorySearchKeywords,
} from "./osm-category-mapping";
import { ExternalProviderError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const log = logger.child("OSMDiscoveryProvider");

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

const USER_AGENT = "CodingShaftLeadIntelligence/1.0 (contact@codingshaft.com)";

export class OSMOverpassProvider implements IDiscoveryProvider {
  public readonly name = "OpenStreetMap Multi-Source Engine";

  /**
   * Free Geocoding using OpenStreetMap Nominatim
   */
  async geocode(query: string): Promise<GeocodeResult> {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1`;

    log.info(`Geocoding location "${query}" via Nominatim`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new ExternalProviderError(
          "Nominatim",
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new NotFoundError(`Location "${query}" could not be found via geocoding`);
      }

      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);

      const bbox: [number, number, number, number] = [
        parseFloat(first.boundingbox?.[0] ?? lat - 0.1),
        parseFloat(first.boundingbox?.[1] ?? lat + 0.1),
        parseFloat(first.boundingbox?.[2] ?? lon - 0.1),
        parseFloat(first.boundingbox?.[3] ?? lon + 0.1),
      ];

      const address = first.address || {};

      return {
        displayName: first.display_name,
        latitude: lat,
        longitude: lon,
        boundingBox: bbox,
        city: address.city || address.town || address.village || address.county || address.state_district,
        state: address.state,
        country: address.country,
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ExternalProviderError) {
        throw err;
      }
      throw new ExternalProviderError(
        "Nominatim",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  /**
   * Multi-Source Free Discovery:
   * 1. Nominatim Structured Category Search (with extratags & contact info)
   * 2. Photon API (Komoot OpenStreetMap Geographic Search by coordinates)
   * 3. Overpass API (fast mirror fallback)
   */
  async discover(params: DiscoveryParams): Promise<DiscoveryResult> {
    const { locationQuery, categories, radiusMeters, maxBusinesses } = params;

    // 1. Geocode location
    let lat = params.latitude;
    let lon = params.longitude;
    let geocodeRes: GeocodeResult;

    if (lat && lon) {
      geocodeRes = {
        displayName: locationQuery,
        latitude: lat,
        longitude: lon,
        boundingBox: [lat - 0.05, lat + 0.05, lon - 0.05, lon + 0.05],
      };
    } else {
      geocodeRes = await this.geocode(locationQuery);
      lat = geocodeRes.latitude;
      lon = geocodeRes.longitude;
    }

    const candidateMap = new Map<string, RawPlaceCandidate>();
    const searchKeywords = getCategorySearchKeywords(categories);

    // ── SOURCE 1: Nominatim Structured Search ──────────────────────────────
    for (const keyword of searchKeywords) {
      if (candidateMap.size >= maxBusinesses * 2) break;
      try {
        const query = `${keyword} in ${locationQuery}`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=25&addressdetails=1&extratags=1`;

        log.debug(`Querying Nominatim for "${query}"`);
        const res = await fetch(nomUrl, {
          headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            for (const item of items) {
              const name = item.name || (item.display_name ? item.display_name.split(",")[0] : "");
              if (!name || name.trim().length < 2) continue;

              const itemLat = parseFloat(item.lat);
              const itemLon = parseFloat(item.lon);
              const extra = item.extratags || {};
              const addr = item.address || {};

              const tags: Record<string, string> = {
                name: name.trim(),
                amenity: item.type || item.class || keyword,
                "addr:street": addr.road || addr.street,
                "addr:housenumber": addr.house_number,
                "addr:city": addr.city || addr.town || addr.village || geocodeRes.city,
                "addr:postcode": addr.postcode,
                "addr:state": addr.state || geocodeRes.state,
                "addr:country": addr.country || geocodeRes.country,
                phone: extra.phone || extra["contact:phone"] || extra["phone:mobile"],
                website: extra.website || extra["contact:website"] || extra.url,
                cuisine: extra.cuisine,
                opening_hours: extra.opening_hours,
              };

              const key = `osm:${item.osm_type || "node"}:${item.osm_id || item.place_id}`;
              candidateMap.set(key, {
                id: key,
                type: (item.osm_type as "node" | "way" | "relation") || "node",
                name: name.trim(),
                lat: itemLat,
                lon: itemLon,
                tags,
              });
            }
          }
        }
      } catch (err) {
        log.warn(`Nominatim search failed for keyword "${keyword}": ${err}`);
      }
    }

    // ── SOURCE 2: Photon Komoot Geographic Search (if candidates < target) ────
    if (candidateMap.size < maxBusinesses) {
      for (const keyword of searchKeywords) {
        if (candidateMap.size >= maxBusinesses * 2) break;
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            keyword
          )}&lat=${lat}&lon=${lon}&limit=25`;

          log.debug(`Querying Photon for "${keyword}" near [${lat}, ${lon}]`);
          const res = await fetch(photonUrl, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(6000),
          });

          if (res.ok) {
            const data = await res.json();
            if (data?.features && Array.isArray(data.features)) {
              for (const f of data.features) {
                const props = f.properties || {};
                const name = props.name;
                if (!name || name.trim().length < 2) continue;

                const coords = f.geometry?.coordinates || [lon, lat];
                const itemLon = coords[0];
                const itemLat = coords[1];

                const tags: Record<string, string> = {
                  name: name.trim(),
                  amenity: props.osm_value || props.osm_key || keyword,
                  "addr:street": props.street,
                  "addr:housenumber": props.housenumber,
                  "addr:city": props.city || geocodeRes.city,
                  "addr:postcode": props.postcode,
                  "addr:state": props.state || geocodeRes.state,
                  "addr:country": props.country || geocodeRes.country,
                };

                const key = `osm:${props.osm_type || "node"}:${props.osm_id || Math.round(itemLat * 10000)}`;
                if (!candidateMap.has(key)) {
                  candidateMap.set(key, {
                    id: key,
                    type: (props.osm_type as "node" | "way" | "relation") || "node",
                    name: name.trim(),
                    lat: itemLat,
                    lon: itemLon,
                    tags,
                  });
                }
              }
            }
          }
        } catch (err) {
          log.warn(`Photon search failed for keyword "${keyword}": ${err}`);
        }
      }
    }

    // ── SOURCE 3: Overpass API (fast mirror fallback) ───────────────────────
    if (candidateMap.size < maxBusinesses) {
      const filters = mapCategoriesToOSMTags(categories);
      const query = buildOverpassQuery(lat, lon, radiusMeters, filters, 8);

      for (const endpoint of OVERPASS_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": USER_AGENT,
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(8000),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.elements && Array.isArray(data.elements)) {
              for (const el of data.elements) {
                const tags = el.tags || {};
                const name = tags.name;
                if (!name) continue;

                const itemLat = el.lat ?? el.center?.lat ?? lat;
                const itemLon = el.lon ?? el.center?.lon ?? lon;
                const key = `osm:${el.type}:${el.id}`;

                if (!candidateMap.has(key)) {
                  candidateMap.set(key, {
                    id: key,
                    type: el.type,
                    name: name.trim(),
                    lat: itemLat,
                    lon: itemLon,
                    tags,
                  });
                }
              }
              break;
            }
          }
        } catch (err) {
          log.debug(`Overpass mirror ${endpoint} skipped`);
        }
      }
    }

    const rawCandidates = Array.from(candidateMap.values());
    log.info(
      `Discovery completed: ${rawCandidates.length} unique candidates discovered from multi-source OSM engine`
    );

    return {
      source: "OpenStreetMap Multi-Source Engine",
      retrievedAt: new Date().toISOString(),
      location: geocodeRes,
      rawCandidates,
    };
  }
}

export const osmDiscoveryProvider = new OSMOverpassProvider();
