import { Coordinates } from "./campus";

// represents a polygon of map region
export class Zone {
  public coordinates: Coordinates[];
  constructor(coordinates: Coordinates[]) {
    this.coordinates = coordinates;
  }

  // Checks if a given point is inside of the polygon
  // uses a ray casting algorithm: Given a point and a polygon, check if the point is inside or outside the polygon
  isPointInside(point: Coordinates): boolean {
    let inside = false;
    for (
      let i = 0, j = this.coordinates.length - 1;
      i < this.coordinates.length;
      j = i++
    ) {
      const xi = this.coordinates[i].latitude;
      const yi = this.coordinates[i].longitude;
      const xj = this.coordinates[j].latitude;
      const yj = this.coordinates[j].longitude;

      const intersect =
        yi > point.longitude !== yj > point.longitude &&
        point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }
}

// logically groups multiple zones together
export class MulitZone {
  public zones: Zone[];

  constructor(zones: Zone[]) {
    this.zones = zones;
  }
  // Checks if a given point is inside of any of the zones
  isPointInside(point: Coordinates): boolean {
    for (const zone of this.zones) {
      if (zone.isPointInside(point)) {
        return true;
      }
    }
    return false;
  }
}

// Parts of the UW SafeTrip Service Area
const specificLargePolygonCoordinates: {
  latitude: number;
  longitude: number;
}[] = [
  // left side
  { latitude: 47.67197822654261, longitude: -122.31736823645943 },
  { latitude: 47.657826336017735, longitude: -122.31778749627834 },
  { latitude: 47.65538164211254, longitude: -122.31838264706631 },
  { latitude: 47.655782527173024, longitude: -122.32073398057402 },
  { latitude: 47.655624802268186, longitude: -122.32191452559616 },
  { latitude: 47.654468138408575, longitude: -122.3219535518779 },
  { latitude: 47.65440241810187, longitude: -122.3197973498126 },

  // bottom
  { latitude: 47.65365977287074, longitude: -122.31737772029295 },
  { latitude: 47.65363495131938, longitude: -122.31735910126282 },
  { latitude: 47.653251915739446, longitude: -122.31761659332349 },
  { latitude: 47.65153183453685, longitude: -122.3139366026232 },
  { latitude: 47.647855267086754, longitude: -122.30894418096462 },
  { latitude: 47.64770668040322, longitude: -122.30011486410316 },

  // right
  { latitude: 47.65204763837195, longitude: -122.29850097325405 },
  { latitude: 47.6524132447055, longitude: -122.29960112480595 },
  { latitude: 47.65918952197625, longitude: -122.29884680679379 },
  { latitude: 47.660489764540145, longitude: -122.2997174186812 },
  { latitude: 47.66057899568555, longitude: -122.30106118920304 },
  { latitude: 47.661241850848334, longitude: -122.30104226285768 },
  { latitude: 47.66131833364706, longitude: -122.3044679315033 },
  { latitude: 47.66269500392275, longitude: -122.30401369921422 },
  { latitude: 47.666014901802086, longitude: -122.30387212072591 },
  { latitude: 47.66811021020102, longitude: -122.30382920538246 },
  { latitude: 47.66951185231267, longitude: -122.30408669744313 },

  // top
  { latitude: 47.66925175662091, longitude: -122.30648995667599 },
  { latitude: 47.66961300028717, longitude: -122.30782033232272 },
  { latitude: 47.670552222117784, longitude: -122.30803490903993 },
  { latitude: 47.669959791887436, longitude: -122.30964423448701 },
  { latitude: 47.67191441388561, longitude: -122.31734210884817 },
];

const arrowSectionCoordinates: { latitude: number; longitude: number }[] = [
  // arrow section
  { latitude: 47.66490016349351, longitude: -122.30073347435852 },
  { latitude: 47.66568604344422, longitude: -122.30046674791475 },
  { latitude: 47.66566358989555, longitude: -122.29866634441919 },
  { latitude: 47.66602284551541, longitude: -122.2987163556274 },
  { latitude: 47.665416600222606, longitude: -122.29701597454826 },
  { latitude: 47.664462310960005, longitude: -122.29574902394029 },
  { latitude: 47.66447353799392, longitude: -122.29741606421393 },
  { latitude: 47.66494507123801, longitude: -122.29741606421393 },
];

const triangleCoordinates: { latitude: number; longitude: number }[] = [
  { latitude: 47.661094404923574, longitude: -122.29271168996141 },
  { latitude: 47.66100796577077, longitude: -122.29029889185436 },
  { latitude: 47.658535745420586, longitude: -122.29014488346454 },
  { latitude: 47.658432013336444, longitude: -122.2883994550467 },
  { latitude: 47.65748112629489, longitude: -122.28837378698172 },
  { latitude: 47.65649564326909, longitude: -122.28870747182631 },
  { latitude: 47.65787877207353, longitude: -122.29124861025818 },
  { latitude: 47.65848387940428, longitude: -122.29119727412824 },
  { latitude: 47.65879507472935, longitude: -122.29091492541362 },
];

//
export const PurpleZone = new MulitZone([
  new Zone(specificLargePolygonCoordinates),
  new Zone(arrowSectionCoordinates),
  new Zone(triangleCoordinates),
]);

export const CampusZone = new Zone([
  { latitude: 47.66130610571488, longitude: -122.31211507700384 }, // Top Left (near 45th St)
  { latitude: 47.661238781922194, longitude: -122.30099460866575 }, // Top Right (near Montlake Blvd)
  { latitude: 47.65072081304047, longitude: -122.30258262116902 }, // Bottom Right (near Husky Stadium, lower campus)
  { latitude: 47.65120365623839, longitude: -122.31207971495076 }, // Bottom Left (south of 45th)
]);
