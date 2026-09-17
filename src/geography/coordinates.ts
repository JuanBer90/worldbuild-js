export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Converts geographic latitude/longitude to Cartesian coordinates on a sphere.
 * Y is the north pole axis; longitude 0° lies on the positive Z axis at the equator.
 */
export function latLonToCartesian(
  latitude: number,
  longitude: number,
  radius: number,
): Vector3 {
  const latRad = latitude * DEG_TO_RAD;
  const lonRad = longitude * DEG_TO_RAD;
  const cosLat = Math.cos(latRad);

  return {
    x: radius * cosLat * Math.sin(lonRad),
    y: radius * Math.sin(latRad),
    z: radius * cosLat * Math.cos(lonRad),
  };
}
