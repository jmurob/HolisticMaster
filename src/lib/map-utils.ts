export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

type BuildOpenStreetMapEmbedUrlOptions = {
  center: GeoCoordinates;
  zoom: number;
};

export function distanceInKilometers(origin: GeoCoordinates, destination: GeoCoordinates) {
  const latitudeDifference = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const longitudeDifference = ((destination.longitude - origin.longitude) * Math.PI) / 180;
  const originLatitude = (origin.latitude * Math.PI) / 180;
  const destinationLatitude = (destination.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;
  const normalizedHaversine = Math.min(1, Math.max(0, haversine));

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(normalizedHaversine), Math.sqrt(1 - normalizedHaversine))
  );
}

export function buildOpenStreetMapEmbedUrl({ center, zoom }: BuildOpenStreetMapEmbedUrlOptions) {
  const longitudeDelta = Math.min(20, Math.max(0.03, 360 / 2 ** (zoom - 1)));
  const latitudeDelta = longitudeDelta * 0.6;
  const halfLongitudeDelta = longitudeDelta / 2;
  const halfLatitudeDelta = latitudeDelta / 2;

  const left = Math.max(-180, center.longitude - halfLongitudeDelta);
  const right = Math.min(180, center.longitude + halfLongitudeDelta);
  const bottom = Math.max(-85, center.latitude - halfLatitudeDelta);
  const top = Math.min(85, center.latitude + halfLatitudeDelta);
  const marker = `${center.latitude},${center.longitude}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${marker}`;
}
