// Plain Google Maps directions link. No API key, no billing: it just opens Maps.
export function mapsDirectionsUrl(fromArea: string, toPlace: string): string {
  const withCity = (s: string) => (/pune/i.test(s) ? s : `${s}, Pune`);
  const q = new URLSearchParams({
    api: "1",
    origin: withCity(fromArea),
    destination: withCity(toPlace),
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
