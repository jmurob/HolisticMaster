import { assert, double, integer, property, record } from 'fast-check';

import { buildOpenStreetMapEmbedUrl, distanceInKilometers } from '@/lib/map-utils';

describe('distanceInKilometers', () => {
  it('returns zero for the same coordinates', () => {
    const point = { latitude: 19.4326, longitude: -99.1332 };

    expect(distanceInKilometers(point, point)).toBe(0);
  });

  it('is approximately correct for a known pair of cities', () => {
    const mexicoCity = { latitude: 19.4326, longitude: -99.1332 };
    const puebla = { latitude: 19.0414, longitude: -98.2063 };

    const distance = distanceInKilometers(mexicoCity, puebla);

    expect(distance).toBeGreaterThan(95);
    expect(distance).toBeLessThan(125);
  });

  it('is symmetric and always non-negative (property-based)', () => {
    const coordinateArbitrary = record({
      latitude: double({ min: -85, max: 85, noNaN: true, noDefaultInfinity: true }),
      longitude: double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    });

    assert(
      property(coordinateArbitrary, coordinateArbitrary, (a, b) => {
        const ab = distanceInKilometers(a, b);
        const ba = distanceInKilometers(b, a);

        expect(Number.isFinite(ab)).toBe(true);
        expect(ab).toBeGreaterThanOrEqual(0);
        expect(Math.abs(ab - ba)).toBeLessThan(1e-9);
      }),
      { numRuns: 500 },
    );
  });
});

describe('buildOpenStreetMapEmbedUrl', () => {
  it('includes bbox and marker query params', () => {
    const url = buildOpenStreetMapEmbedUrl({
      center: { latitude: 19.4326, longitude: -99.1332 },
      zoom: 13,
    });

    const parsed = new URL(url);

    expect(parsed.host).toBe('www.openstreetmap.org');
    expect(parsed.searchParams.get('layer')).toBe('mapnik');
    expect(parsed.searchParams.get('marker')).toBe('19.4326,-99.1332');
    expect(parsed.searchParams.get('bbox')).toBeTruthy();
  });

  it('always creates a valid clamped bbox (property-based)', () => {
    const coordinateArbitrary = record({
      latitude: double({ min: -85, max: 85, noNaN: true, noDefaultInfinity: true }),
      longitude: double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    });

    const zoomArbitrary = integer({ min: 1, max: 22 });

    assert(
      property(coordinateArbitrary, zoomArbitrary, (center, zoom) => {
        const url = buildOpenStreetMapEmbedUrl({ center, zoom });
        const parsed = new URL(url);
        const bbox = parsed.searchParams.get('bbox');

        expect(bbox).toBeTruthy();

        const [left, bottom, right, top] = (bbox ?? '').split(',').map(Number);

        expect(Number.isFinite(left)).toBe(true);
        expect(Number.isFinite(bottom)).toBe(true);
        expect(Number.isFinite(right)).toBe(true);
        expect(Number.isFinite(top)).toBe(true);

        expect(left).toBeGreaterThanOrEqual(-180);
        expect(right).toBeLessThanOrEqual(180);
        expect(bottom).toBeGreaterThanOrEqual(-85);
        expect(top).toBeLessThanOrEqual(85);
        expect(left).toBeLessThan(right);
        expect(bottom).toBeLessThan(top);
      }),
      { numRuns: 500 },
    );
  });
});
