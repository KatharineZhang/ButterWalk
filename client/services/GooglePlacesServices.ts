import { PurpleZone } from "./ZoneService";

// Fetch the google places API key from the environment variables
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
  ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
  : "";

// Type of the Google Place API response
type GooglePlaceSearchResponse = {
  business_status: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  place_id: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  rating?: number;
  reference: string;
  types: string[];
  user_ratings_total?: number;
};

export type PlaceSearchResult = {
  name: string;
  coordinates: { latitude: number; longitude: number };
  address: string;
};

// We don't want GooglePlaceResult.types to incluse these tags
const GooglePlaceSearchBadLocationTypes = [
  "bar",
  "casino",
  "drugstore",
  "liquor_store",
  "night_club",
];

// This is used to cache the results of the Google Place API
let previousQuery = "";
let previousResults: PlaceSearchResult[] = [];

/**
 * Fetch Google Place Autocomplete suggestions based on user input.
 * @param query - The user's input query.
 * @param location - The latitude and longitude to restrict the search.
 * @param radius - The radius (in meters) to restrict the search (default: 5000).
 * @returns A promise that resolves to an array of place descriptions.
 */
export const fetchGooglePlaceSuggestions = async (
  query: string
): Promise<PlaceSearchResult[]> => {
  // If the query is basically the same as the previous one, return the cached results
  if (levensteinDistance(query, previousQuery) < 3) {
    console.log(
      "google place search cached results for query:",
      query,
      "previous query:",
      previousQuery
    );
    return previousResults;
  }
  try {
    previousQuery = query;
    const url =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(query)}` +
      `&location=47.65979,-122.30564` + // Source: trust me bro - Snigdha (https://www.calcmaps.com/map-radius/)
      `&radius=1859` + // but basically its just a radius around the purple zone area
      `&key=${GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (Array.isArray(json.results)) {
      // Post-filter results to ensure they are inside the polygon
      const places = (json.results as GooglePlaceSearchResponse[])
        .map((r) => ({
          name: r.name,
          location: {
            latitude: r.geometry.location.lat,
            longitude: r.geometry.location.lng,
          },
          types: r.types,
          formatted_address: r.formatted_address,
        }))
        // filter to places inside the purple zone
        .filter((place) => PurpleZone.isPointInside(place.location))
        // filter out places that could potentially serve alcohol
        .filter((place) => {
          return !place.types.some((type) =>
            GooglePlaceSearchBadLocationTypes.includes(type)
          );
        })
        .map((place) => ({
          name: place.name,
          coordinates: place.location,
          address: place.formatted_address,
        }));
      // remove duplicates from places
      previousResults = Array.from(new Set(places));
      return previousResults;
    }
  } catch (e: unknown) {
    console.log("GOOGLE PLACE SEARCH ERROR", e);
  }
  previousResults = [];
  return [];
};

// Get the distance between two strings
// (number of insertions and deletions of characters to get from one to another)
const levensteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = new Array(b.length + 1)
    .fill(null)
    .map(() => new Array(a.length + 1).fill(0));

  for (let i = 0; i < a.length + 1; i++) {
    matrix[0][i] = i;
  }

  for (let i = 0; i < b.length + 1; i++) {
    matrix[i][0] = i;
  }

  for (let i = 1; i < a.length + 1; i++) {
    for (let j = 1; j < b.length + 1; j++) {
      const min = Math.min(matrix[j - 1][i], matrix[j][i - 1]);
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = min + 1;
      }
    }
  }
  return matrix[b.length][a.length];
};
