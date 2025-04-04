export type LocationName =
  | "HUB"
  | "Alder Hall"
  | "Communication Building"
  | "Flagpole"
  | "Meany Hall"
  | "IMA"
  | "Okanogan Lane"
  | "UW Tower";

type LocationType = {
  // currently these are the locations we support
  name: LocationName;
  latitude: number;
  longitude: number;
};

export class LocationService {
  // keep track of all the locations we care about
  // TODO: putting this in api and importing it causes the "None of these files exist" error for some reason
  // TODO: Replace this with google maps place search autocomplete api
  public static Locations: LocationType[] = [
    {
      name: "HUB",
      latitude: 47.65495783716224,
      longitude: -122.3049647918257,
    },
    { name: "Alder Hall", latitude: 47.655731, longitude: -122.313911 },
    {
      name: "Communication Building",
      latitude: 47.657212074889294,
      longitude: -122.30487145010869,
    },
    {
      name: "Flagpole",
      latitude: 47.65705056924482,
      longitude: -122.30974602770755,
    },
    {
      name: "Meany Hall",
      latitude: 47.65601509591645,
      longitude: -122.31049478782538,
    },
    {
      name: "IMA",
      latitude: 47.65385698436546,
      longitude: -122.30181598139033,
    },
    {
      name: "Okanogan Lane",
      latitude: 47.65350367544575,
      longitude: -122.30925903139357,
    },
    {
      name: "UW Tower",
      latitude: 47.660855088183816,
      longitude: -122.31464458754253,
    },
  ];

  /**
   * Function that abstracts getting the coordinates associated with a
   * string location name (out of the ones permitted)
   *
   * @param location
   * @returns coordinates of the location in the form {latitude: number, longitude: number}
   */
  static getLatAndLong(location: LocationName): {
    latitude: number;
    longitude: number;
  } {
    const loc = LocationService.Locations.find((loc) => loc.name === location);
    if (loc) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    return { latitude: 0, longitude: 0 };
  }
}
