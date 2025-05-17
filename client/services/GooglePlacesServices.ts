import axios from "axios";
import { calculateDistance } from "../app/(student)/map";
const GOOGLE_PLACES_API_KEY = "AIzaSyAi4GiqY4FUMk7CQWB0MxNQIGWOsr_laBw"; // Replace with your API key

const calculatePolygonCenter = (
  coordinates: { latitude: number; longitude: number }[]
) => {
  const totalPoints = coordinates.length;
  const center = coordinates.reduce(
    (acc, point) => {
      acc.latitude += point.latitude;
      acc.longitude += point.longitude;
      return acc;
    },
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: center.latitude / totalPoints,
    longitude: center.longitude / totalPoints,
  };
};

const calculatePolygonRadius = (
  center: { latitude: number; longitude: number },
  coordinates: { latitude: number; longitude: number }[]
) => {
  return Math.max(
    ...coordinates.map((point) => calculateDistance(center, point))
  );
};

const polygonCoordinates = [
  { latitude: 47.666588, longitude: -122.311439 },
  { latitude: 47.667353, longitude: -122.316263 },
  { latitude: 47.652854, longitude: -122.316942 },
  { latitude: 47.648566, longitude: -122.304858 },
  { latitude: 47.660993, longitude: -122.301405 },
  { latitude: 47.661138, longitude: -122.311331 },
];
/**
 * Fetch Google Place Autocomplete suggestions based on user input.
 * @param query - The user's input query.
 * @param location - The latitude and longitude to restrict the search.
 * @param radius - The radius (in meters) to restrict the search (default: 5000).
 * @returns A promise that resolves to an array of place descriptions.
 */
export const fetchGooglePlaceSuggestions = async (
  query: string
): Promise<string[]> => {
  if (!query.trim()) return [];
  // Calculate the center and radius of the polygon
  const center = calculatePolygonCenter(polygonCoordinates);
  const radius = calculatePolygonRadius(center, polygonCoordinates) * 1609.34; // Convert miles to meters

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/queryautocomplete/json`,
      {
        params: {
          input: query,
          key: GOOGLE_PLACES_API_KEY,
          location: `${center.latitude},${center.longitude}`,
          radius,
        },
      }
    );

    interface Prediction {
      description: string;
      [key: string]: unknown;
    }

    if (response.data.status === "OK") {
      return response.data.predictions.map(
        (prediction: Prediction) => prediction.description
      );
    } else {
      console.error("Google Places API Error:", response.data.status);
      return [];
    }
  } catch (error) {
    console.error("Error fetching Google Place suggestions:", error);
    return [];
  }
};
