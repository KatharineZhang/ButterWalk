import { Coordinates } from "./campus";

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

export const purple_zone = new Zone([
  { latitude: 47.666588, longitude: -122.311439 },
  { latitude: 47.667353, longitude: -122.316263 },
  { latitude: 47.652854, longitude: -122.316942 },
  { latitude: 47.648566, longitude: -122.304858 },
  { latitude: 47.660993, longitude: -122.301405 },
  { latitude: 47.661138, longitude: -122.311331 },
]);

export const campus_zone = new Zone([
  { latitude: 47.66130610571488, longitude: -122.31211507700384 }, // Top Left (near 45th St)
  { latitude: 47.661238781922194, longitude: -122.30099460866575 }, // Top Right (near Montlake Blvd)
  { latitude: 47.65072081304047, longitude: -122.30258262116902 }, // Bottom Right (near Husky Stadium, lower campus)
  { latitude: 47.65120365623839, longitude: -122.31207971495076 }, // Bottom Left (south of 45th)
]);
