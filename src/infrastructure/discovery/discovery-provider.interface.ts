export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  boundingBox: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
  city?: string;
  state?: string;
  country?: string;
}

export interface RawPlaceCandidate {
  id: string; // e.g. "node/12345" or "way/67890"
  type: "node" | "way" | "relation";
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface DiscoveryParams {
  locationQuery: string;
  categories: string[];
  radiusMeters: number;
  maxBusinesses: number;
  latitude?: number;
  longitude?: number;
}

export interface DiscoveryResult {
  source: string;
  retrievedAt: string;
  location: GeocodeResult;
  rawCandidates: RawPlaceCandidate[];
}

export interface IDiscoveryProvider {
  name: string;
  geocode(query: string): Promise<GeocodeResult>;
  discover(params: DiscoveryParams): Promise<DiscoveryResult>;
}
