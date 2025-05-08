type Coordinate = {
    latitude: number;
    longitude: number;
};


export class Zone {
    public coordinates: Coordinate[];
    constructor(coordinates: Coordinate[]) {
        this.coordinates = coordinates;
    }

    // Checks if a given point is inside of the polygon
    // uses a ray casting algorithm: Given a point and a polygon, check if the point is inside or outside the polygon
    isPointInside(point: Coordinate): boolean {
        let inside = false;
        for (let i = 0, j = this.coordinates.length - 1; i < this.coordinates.length; j = i++) {
            const xi = this.coordinates[i].latitude;
            const yi = this.coordinates[i].longitude;
            const xj = this.coordinates[j].latitude;
            const yj = this.coordinates[j].longitude;

            const intersect = ((yi > point.longitude) !== (yj > point.longitude)) &&
                (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }
        return inside;
    }
}