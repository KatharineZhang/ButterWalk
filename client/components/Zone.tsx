type Coordinate = {
    latitude: number;
    longitude: number;
    };

  
  export class Zone {
    public static coordinates: Coordinate[];
  
    // Checks if a given point is inside of the polygon
    // uses a ray casting algorithm: Given a point and a polygon, check if the point is inside or outside the polygon
    isPointInside(point: Coordinate): boolean {
      let inside = false;
      for (let i = 0, j = Zone.coordinates.length - 1; i < Zone.coordinates.length; j = i++) {
        const xi = Zone.coordinates[i].latitude;
        const yi = Zone.coordinates[i].longitude;
        const xj = Zone.coordinates[j].latitude;
        const yj = Zone.coordinates[j].longitude;
  
        const intersect = ((yi > point.longitude) !== (yj > point.longitude)) &&
          (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      return inside;
    }
}