import { LocationType } from "../api";

// Default locations for new users
export const defaultCampusLocations: LocationType[] = [
  {
    name: "Alder Hall",
    address: "Alder Hall, 1315 NE Campus Pkwy, Seattle, WA 98105",
    coordinates: { latitude: 47.65546, longitude: -122.31419 },
  },
  {
    name: "Allen Library",
    address: "Allen Library, 4130 George Washington Ln NE, Seattle, WA 98195",
    coordinates: { latitude: 47.65554, longitude: -122.30703 },
  },
  {
    name: "Bagley Hall",
    address: "Bagley Hall, 3940 15th Ave NE, Seattle, WA 98195",
    coordinates: { latitude: 47.65348, longitude: -122.30884 },
  },
  {
    name: "Husky Union Building (HUB)",
    address: "Husky Union Building, 4001 E Stevens Way NE, Seattle, WA 98195",
    coordinates: { latitude: 47.65557, longitude: -122.30509 },
  },
  {
    name: "Odegaard Undergraduate Library",
    address: "Odegaard Library, 4130 George Washington Ln NE, Seattle, WA 98195",
    coordinates: { latitude: 47.65603, longitude: -122.30857 },
  },
];