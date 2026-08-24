export interface OSMTagFilter {
  key: string;
  value?: string;
  isExact?: boolean;
}

export const CATEGORY_TO_OSM_TAGS: Record<string, OSMTagFilter[]> = {
  // Food & Hospitality
  "restaurants & cafes": [
    { key: "amenity", value: "restaurant" },
    { key: "amenity", value: "cafe" },
    { key: "amenity", value: "fast_food" },
    { key: "amenity", value: "bar" },
  ],
  restaurants: [{ key: "amenity", value: "restaurant" }],
  cafes: [{ key: "amenity", value: "cafe" }],
  bakeries: [{ key: "shop", value: "bakery" }],

  // Healthcare & Dental
  "dental & clinics": [
    { key: "amenity", value: "dentist" },
    { key: "healthcare", value: "dentist" },
    { key: "amenity", value: "clinic" },
    { key: "amenity", value: "doctors" },
  ],
  dentists: [
    { key: "amenity", value: "dentist" },
    { key: "healthcare", value: "dentist" },
  ],
  doctors: [
    { key: "amenity", value: "doctors" },
    { key: "amenity", value: "clinic" },
  ],
  veterinary: [{ key: "amenity", value: "veterinary" }],

  // Professional Services
  "law firms": [
    { key: "office", value: "lawyer" },
    { key: "amenity", value: "lawyer" },
    { key: "office", value: "notary" },
  ],
  "real estate": [
    { key: "office", value: "estate_agent" },
    { key: "office", value: "property_management" },
  ],
  "accounting & tax": [
    { key: "office", value: "accountant" },
    { key: "office", value: "tax_advisor" },
    { key: "office", value: "financial" },
  ],

  // Retail & E-Commerce
  "e-commerce & retail": [
    { key: "shop" }, // Matches any shop with a name
  ],
  retail: [{ key: "shop" }],
  supermarkets: [{ key: "shop", value: "supermarket" }],
  clothing: [
    { key: "shop", value: "clothes" },
    { key: "shop", value: "boutique" },
  ],

  // Fitness & Wellness
  "gyms & fitness": [
    { key: "leisure", value: "fitness_centre" },
    { key: "leisure", value: "sports_centre" },
    { key: "amenity", value: "gym" },
  ],
  "salons & spas": [
    { key: "shop", value: "hairdresser" },
    { key: "shop", value: "beauty" },
    { key: "amenity", value: "spa" },
  ],

  // Technology & Business Services
  "tech & digital agencies": [
    { key: "office", value: "it" },
    { key: "office", value: "company" },
    { key: "office", value: "advertising_agency" },
    { key: "office", value: "consulting" },
  ],

  // Home & Trade Services
  "home & trade services": [
    { key: "craft", value: "plumber" },
    { key: "craft", value: "electrician" },
    { key: "craft", value: "hvac" },
    { key: "craft", value: "painter" },
    { key: "craft", value: "carpenter" },
  ],

  // Auto Services
  "auto services": [
    { key: "shop", value: "car_repair" },
    { key: "shop", value: "car" },
    { key: "amenity", value: "car_wash" },
  ],
};

/**
 * Normalizes input category string to standard OSM tag queries
 */
export function mapCategoriesToOSMTags(categories: string[]): OSMTagFilter[] {
  const result: OSMTagFilter[] = [];
  const seenKeys = new Set<string>();

  for (const rawCat of categories) {
    const normalized = rawCat.toLowerCase().trim();
    const mapped = CATEGORY_TO_OSM_TAGS[normalized];

    if (mapped && mapped.length > 0) {
      for (const filter of mapped) {
        const keyId = `${filter.key}:${filter.value || "*"}`;
        if (!seenKeys.has(keyId)) {
          seenKeys.add(keyId);
          result.push(filter);
        }
      }
    } else {
      // Fallback: match any shop or office or amenity with that keyword as value
      const sanitized = normalized.replace(/[^a-z0-9_]/g, "");
      if (sanitized) {
        result.push({ key: "shop", value: sanitized });
        result.push({ key: "amenity", value: sanitized });
        result.push({ key: "office", value: sanitized });
      }
    }
  }

  // If no filters matched, provide a safe default business search
  if (result.length === 0) {
    result.push({ key: "shop" });
    result.push({ key: "office" });
    result.push({ key: "amenity" });
  }

  return result;
}

export const CATEGORY_SEARCH_KEYWORDS: Record<string, string[]> = {
  "restaurants & cafes": ["restaurant", "cafe", "bistro", "bakery", "fast food", "bar"],
  restaurants: ["restaurant", "bistro", "eatery"],
  cafes: ["cafe", "coffee shop"],
  bakeries: ["bakery", "patisserie"],
  "dental & clinics": ["dentist", "dental", "clinic", "doctor", "medical"],
  dentists: ["dentist", "dental surgery"],
  doctors: ["doctor", "clinic", "physician"],
  veterinary: ["veterinary", "vet"],
  "law firms": ["lawyer", "solicitor", "attorney", "law firm", "legal"],
  "real estate": ["estate agent", "real estate", "realtor", "property management"],
  "accounting & tax": ["accountant", "accounting", "tax advisor", "bookkeeper"],
  "e-commerce & retail": ["shop", "store", "boutique", "retail", "supermarket"],
  retail: ["shop", "store", "boutique"],
  supermarkets: ["supermarket", "grocery"],
  clothing: ["clothing store", "boutique", "fashion"],
  "gyms & fitness": ["gym", "fitness", "crossfit", "sports club"],
  "salons & spas": ["hairdresser", "hair salon", "beauty salon", "spa", "barber"],
  "tech & digital agencies": ["software", "digital agency", "web design", "IT services"],
  "home & trade services": ["plumber", "electrician", "contractor", "carpenter", "roofing", "painter"],
  "auto services": ["car repair", "auto repair", "mechanic", "car wash", "garage"],
};

export function getCategorySearchKeywords(categories: string[]): string[] {
  const terms = new Set<string>();

  for (const raw of categories) {
    const norm = raw.toLowerCase().trim();
    const mapped = CATEGORY_SEARCH_KEYWORDS[norm];

    if (mapped && mapped.length > 0) {
      mapped.forEach((t) => terms.add(t));
    } else {
      // Fallback clean words
      const cleaned = norm.replace(/&/g, " ").replace(/[^a-z0-9\s]/g, "").trim();
      if (cleaned) {
        cleaned.split(/\s+/).forEach((w) => {
          if (w.length >= 3) terms.add(w);
        });
      }
    }
  }

  if (terms.size === 0) {
    terms.add("business");
    terms.add("shop");
    terms.add("restaurant");
  }

  return Array.from(terms);
}

/**
 * Builds Overpass QL query fragment for a given center coordinate and radius
 */
export function buildOverpassQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
  filters: OSMTagFilter[],
  timeoutSeconds = 25
): string {
  const parts = filters.map((f) => {
    const tagMatch = f.value ? `["${f.key}"="${f.value}"]` : `["${f.key}"]`;
    return `  nwr${tagMatch}["name"](around:${radiusMeters},${lat},${lon});`;
  });

  return `[out:json][timeout:${timeoutSeconds}];
(
${parts.join("\n")}
);
out center;`;
}

