import { NextRequest, NextResponse } from 'next/server';

export interface QuickNearbyPlace {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  category?: string;
  isCafe?: boolean;
  distanceKm?: number;
  rating?: number;
  userRatingCount?: number;
  source?: string;
}

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Helper to clean and normalize shop names for deduplication
function normalizeShopName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9\u0E00-\u0E7F]/gi, '')
    .trim();
}

function checkIsCafe(name: string, category: string = '', rawType: string = ''): boolean {
  const combined = `${name} ${category} ${rawType}`.toLowerCase();
  return (
    combined.includes('cafe') ||
    combined.includes('café') ||
    combined.includes('coffee') ||
    combined.includes('กาแฟ') ||
    combined.includes('คาเฟ่') ||
    combined.includes('roaster') ||
    combined.includes('espresso') ||
    combined.includes('tea') ||
    combined.includes('ชา') ||
    combined.includes('bakery') ||
    combined.includes('เบเกอรี่') ||
    combined.includes('dessert') ||
    combined.includes('toast') ||
    combined.includes('matcha')
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '13.7445');
    const lng = parseFloat(searchParams.get('lng') || '100.5332');
    const radiusKm = parseFloat(searchParams.get('radius') || '1.5');
    const locationName = searchParams.get('locationName') || '';
    const filter = searchParams.get('filter') || 'coffee';

    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 500), 20000);
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const fsqKey = process.env.FOURSQUARE_API_KEY || 'DZ0MFQAUHBN5DALTQM1IJ1YRSPOHQZ1UGQCKWPV4XO0MQUEC';
    const geminiKey = process.env.GEMINI_API_KEY;

    const aggregatedPlaces: QuickNearbyPlace[] = [];
    const usedSources: string[] = [];

    // Parallel fetch across high-accuracy POI services
    const tasks: Promise<any>[] = [];

    // 1. SOURCE: Google Places API (New)
    if (googleApiKey) {
      tasks.push(
        (async () => {
          try {
            const types = filter === 'all'
              ? ['cafe', 'coffee_shop', 'bakery', 'restaurant', 'tea_house', 'dessert_shop']
              : ['cafe', 'coffee_shop', 'bakery', 'tea_house', 'dessert_shop'];

            const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': googleApiKey,
                'X-Goog-FieldMask': 'places.displayName,places.location,places.rating,places.userRatingCount,places.primaryType',
              },
              body: JSON.stringify({
                includedTypes: types,
                maxResultCount: 20,
                locationRestriction: {
                  circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: radiusMeters,
                  },
                },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.places) && data.places.length > 0) {
                usedSources.push('google_places');
                for (const p of data.places) {
                  const pLat = p.location?.latitude;
                  const pLng = p.location?.longitude;
                  const name = p.displayName?.text;
                  if (!pLat || !pLng || !name) continue;
                  const isCafe = checkIsCafe(name, p.primaryType, p.primaryType);
                  aggregatedPlaces.push({
                    name,
                    lat: Number(pLat.toFixed(6)),
                    lng: Number(pLng.toFixed(6)),
                    type: isCafe ? 'coffee_shop' : (p.primaryType || 'other'),
                    category: isCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / เครื่องดื่ม',
                    isCafe,
                    rating: p.rating,
                    userRatingCount: p.userRatingCount,
                    distanceKm: calculateDistanceKm(lat, lng, pLat, pLng),
                    source: 'google_places',
                  });
                }
              }
            }
          } catch (gErr) {
            console.error('Google Places fetch error:', gErr);
          }
        })()
      );
    }

    // 2. SOURCE: Foursquare Places API (Live POI, precise cafe spots)
    if (fsqKey) {
      tasks.push(
        (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const fsqRes = await fetch(
              `https://places-api.foursquare.com/places/search?ll=${lat},${lng}&radius=${radiusMeters}&query=coffee&limit=20`,
              {
                headers: {
                  Authorization: `Bearer ${fsqKey}`,
                  Accept: 'application/json',
                  'X-Places-Api-Version': '2025-06-17',
                },
                signal: controller.signal,
              }
            );
            clearTimeout(timeoutId);

            if (fsqRes.ok) {
              const fsqData = await fsqRes.json();
              if (Array.isArray(fsqData.results) && fsqData.results.length > 0) {
                usedSources.push('foursquare');
                for (const r of fsqData.results) {
                  const pLat = r.latitude;
                  const pLng = r.longitude;
                  if (!pLat || !pLng || !r.name) continue;
                  const catName = r.categories?.[0]?.name || 'Coffee Shop';
                  const isCafe = checkIsCafe(r.name, catName);
                  aggregatedPlaces.push({
                    name: r.name,
                    lat: Number(pLat.toFixed(6)),
                    lng: Number(pLng.toFixed(6)),
                    type: isCafe ? 'coffee_shop' : 'other',
                    category: isCafe ? 'ร้านกาแฟ / คาเฟ่' : catName,
                    isCafe,
                    distanceKm: calculateDistanceKm(lat, lng, pLat, pLng),
                    source: 'foursquare',
                  });
                }
              }
            }
          } catch (fsqErr) {
            console.error('Foursquare POI fetch error:', fsqErr);
          }
        })()
      );
    }

    // 3. SOURCE: OpenStreetMap Nominatim (Free, No Key, Bounded Viewbox)
    tasks.push(
      (async () => {
        try {
          const latDelta = radiusKm / 111;
          const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
          const minLng = (lng - lngDelta).toFixed(4);
          const minLat = (lat - latDelta).toFixed(4);
          const maxLng = (lng + lngDelta).toFixed(4);
          const maxLat = (lat + latDelta).toFixed(4);

          const queryTerms = filter === 'all'
            ? ['cafe', 'coffee', 'restaurant']
            : ['cafe', 'coffee', 'ร้านกาแฟ'];

          const osmFetches = queryTerms.map((term) =>
            fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                term
              )}&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=25&addressdetails=1`,
              {
                headers: { 'User-Agent': 'SmartStockApp/2.0' },
                next: { revalidate: 300 },
              }
            )
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          );

          const osmResults = await Promise.all(osmFetches);
          const flatOsm = osmResults.flat();

          if (flatOsm.length > 0) {
            usedSources.push('osm');
            for (const item of flatOsm) {
              const pLat = parseFloat(item.lat);
              const pLng = parseFloat(item.lon);
              const name = item.name || item.display_name?.split(',')?.[0];
              if (!name || isNaN(pLat) || isNaN(pLng)) continue;
              const isCafe = checkIsCafe(name, item.type, item.class);
              aggregatedPlaces.push({
                name,
                lat: Number(pLat.toFixed(6)),
                lng: Number(pLng.toFixed(6)),
                type: isCafe ? 'coffee_shop' : 'other',
                category: isCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / ร้านค้า',
                isCafe,
                distanceKm: calculateDistanceKm(lat, lng, pLat, pLng),
                source: 'osm',
              });
            }
          }
        } catch (osmErr) {
          console.error('OSM Nominatim fetch error:', osmErr);
        }
      })()
    );

    // Wait for all primary searches to complete
    await Promise.all(tasks);

    // 4. FALLBACK: Gemini Grounding (if fewer than 5 places found from live services)
    if (aggregatedPlaces.length < 5 && geminiKey) {
      try {
        const prompt = `คุณคือระบบค้นหาตำแหน่งร้านค้าและร้านอาหารจริงบน Google Maps ในประเทศไทย
ช่วยดึงรายชื่อร้านจริงทั้งหมดที่มีหมุดอยู่จริงบนแผนที่ ในรัศมี ${radiusKm} กิโลเมตร รอบพิกัด (${lat}, ${lng})${locationName ? ` ในบริเวณ "${locationName}"` : ''}
ดึงเฉพาะชื่อร้านจริงที่มีหมุดอยู่จริงในบริเวณนี้เท่านั้น โดยเน้นร้านกาแฟ คาเฟ่ เบเกอรี่ และร้านอาหารรอบข้าง
ส่งออกเป็น JSON array:
[
  { "name": "ชื่อร้านจริง", "lat": ละติจูดจริง, "lng": ลองจิจูดจริง, "type": "coffee_shop" หรือ "other" }
]
ส่งเฉพาะ JSON array เท่านั้น ห้ามมีคำอธิบายอื่น`;

        const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const model of modelsToTry) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
                }),
              }
            );
            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const cleanJson = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  usedSources.push('gemini');
                  for (const item of parsed) {
                    const pLat = typeof item.lat === 'number' ? item.lat : lat;
                    const pLng = typeof item.lng === 'number' ? item.lng : lng;
                    const isCafe = checkIsCafe(item.name, item.type);
                    aggregatedPlaces.push({
                      name: item.name,
                      lat: Number(pLat.toFixed(6)),
                      lng: Number(pLng.toFixed(6)),
                      type: isCafe ? 'coffee_shop' : 'other',
                      category: isCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / สถานที่ใกล้เคียง',
                      isCafe,
                      distanceKm: calculateDistanceKm(lat, lng, pLat, pLng),
                      source: 'gemini',
                    });
                  }
                  break;
                }
              }
            }
          } catch {
            // try next model
          }
        }
      } catch (geminiErr) {
        console.error('Gemini grounding error:', geminiErr);
      }
    }

    // 5. Deduplication across all providers (by normalized name & coordinate proximity)
    const uniquePlaces: QuickNearbyPlace[] = [];
    const seenNames = new Set<string>();

    for (const place of aggregatedPlaces) {
      if (!place.name || !place.lat || !place.lng) continue;
      // Skip places that are far outside the requested radius
      if (place.distanceKm && place.distanceKm > radiusKm * 1.35) continue;

      const normName = normalizeShopName(place.name);
      if (normName.length > 2 && seenNames.has(normName)) {
        // If existing item has no rating but this one does, enhance it
        const existing = uniquePlaces.find((p) => normalizeShopName(p.name) === normName);
        if (existing && !existing.rating && place.rating) {
          existing.rating = place.rating;
          existing.userRatingCount = place.userRatingCount;
        }
        continue;
      }

      // Check geo proximity (< 35 meters) with already accepted places
      const isTooClose = uniquePlaces.some(
        (p) => calculateDistanceKm(p.lat, p.lng, place.lat, place.lng) < 0.035
      );
      if (isTooClose && normName.length > 2) {
        continue;
      }

      if (normName.length > 2) {
        seenNames.add(normName);
      }
      uniquePlaces.push(place);
    }

    // Sort: Cafes/coffee shops first, then by nearest distance
    uniquePlaces.sort((a, b) => {
      if (a.isCafe && !b.isCafe) return -1;
      if (!a.isCafe && b.isCafe) return 1;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return NextResponse.json({
      success: true,
      center: { lat, lng, radiusKm, locationName },
      count: uniquePlaces.length,
      sources: Array.from(new Set(usedSources)),
      places: uniquePlaces,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, places: [] },
      { status: 500 }
    );
  }
}
