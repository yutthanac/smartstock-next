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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '13.7445');
    const lng = parseFloat(searchParams.get('lng') || '100.5332');
    const radiusKm = parseFloat(searchParams.get('radius') || '1.5');
    const locationName = searchParams.get('locationName') || '';

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let places: QuickNearbyPlace[] = [];

    // 1. FIRST PRIORITY: Google Places API (New) - Production Real Google Maps Data
    if (googleApiKey) {
      try {
        const radiusMeters = Math.min(Math.max(radiusKm * 1000, 500), 50000);
        const googleRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.rating,places.userRatingCount,places.primaryType',
          },
          body: JSON.stringify({
            includedTypes: [
              'cafe',
              'coffee_shop',
              'bakery',
              'restaurant',
              'tea_house',
              'dessert_shop',
              'fast_food_restaurant',
            ],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radiusMeters,
              },
            },
          }),
        });

        if (googleRes.ok) {
          const gData = await googleRes.json();
          if (Array.isArray(gData.places) && gData.places.length > 0) {
            places = gData.places
              .map((p: any) => {
                const pLat = p.location?.latitude;
                const pLng = p.location?.longitude;
                const name = p.displayName?.text;
                if (!pLat || !pLng || !name) return null;
                const dist = calculateDistanceKm(lat, lng, pLat, pLng);
                const rawType = (p.primaryType || '').toLowerCase();
                const lowerName = name.toLowerCase();
                const isCoffeeOrCafe =
                  rawType.includes('cafe') ||
                  rawType.includes('coffee') ||
                  lowerName.includes('coffee') ||
                  lowerName.includes('cafe') ||
                  lowerName.includes('กาแฟ') ||
                  lowerName.includes('คาเฟ่') ||
                  lowerName.includes('roaster') ||
                  lowerName.includes('espresso');

                return {
                  name,
                  lat: Number(pLat.toFixed(6)),
                  lng: Number(pLng.toFixed(6)),
                  type: isCoffeeOrCafe ? 'coffee_shop' : (p.primaryType || 'other'),
                  category: isCoffeeOrCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / เครื่องดื่ม',
                  isCafe: isCoffeeOrCafe,
                  rating: p.rating,
                  userRatingCount: p.userRatingCount,
                  distanceKm: dist,
                };
              })
              .filter(Boolean) as QuickNearbyPlace[];
          }
        }
      } catch (gErr) {
        console.error('Google Places API call error:', gErr);
      }
    }

    // 2. SECOND PRIORITY (Fallback): OpenStreetMap Nominatim
    if (places.length === 0) {
      try {
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
        const minLng = (lng - lngDelta).toFixed(4);
        const minLat = (lat - latDelta).toFixed(4);
        const maxLng = (lng + lngDelta).toFixed(4);
        const maxLat = (lat + latDelta).toFixed(4);

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=cafe+coffee+ร้านอาหาร+ร้านกาแฟ&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=0&limit=15&addressdetails=1`;
        const res = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'SmartStockApp/1.0' },
          next: { revalidate: 300 },
        });

        if (res.ok) {
          const rawData = await res.json();
          if (Array.isArray(rawData) && rawData.length > 0) {
            places = rawData
              .map((item: any) => {
                const pLat = parseFloat(item.lat);
                const pLng = parseFloat(item.lon);
                const name = item.name || item.display_name?.split(',')?.[0] || 'ร้านค้า';
                const dist = calculateDistanceKm(lat, lng, pLat, pLng);
                const lowerName = name.toLowerCase();
                const isCoffeeOrCafe =
                  lowerName.includes('coffee') ||
                  lowerName.includes('cafe') ||
                  lowerName.includes('กาแฟ') ||
                  lowerName.includes('คาเฟ่') ||
                  lowerName.includes('roaster') ||
                  lowerName.includes('espresso');

                return {
                  name,
                  lat: pLat,
                  lng: pLng,
                  type: isCoffeeOrCafe ? 'coffee_shop' : 'other',
                  category: isCoffeeOrCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / สถานที่ใกล้เคียง',
                  isCafe: isCoffeeOrCafe,
                  distanceKm: dist,
                };
              })
              .filter((p) => p.distanceKm <= radiusKm * 1.5)
              .slice(0, 15);
          }
        }
      } catch {
        // continue
      }
    }

    // 3. THIRD PRIORITY (AI Grounding): Gemini Flash
    if (places.length === 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const prompt = `คุณคือระบบค้นหาตำแหน่งร้านค้าและร้านอาหารจริงบน Google Maps ในประเทศไทย
ช่วยดึงรายชื่อร้านจริงทั้งหมดที่มีหมุดบน Google Maps ในรัศมี ${radiusKm} กิโลเมตร รอบพิกัด (${lat}, ${lng})${locationName ? ` ในบริเวณ "${locationName}"` : ''}
ดึงเฉพาะชื่อร้านจริงที่มีหมุดอยู่จริงบน Google Maps ในบริเวณนี้เท่านั้น โดยเน้นร้านกาแฟ คาเฟ่ เบเกอรี่ และร้านอาหารรอบข้าง
ส่งออกเป็น JSON array:
[
  { "name": "ชื่อร้านจริงบน Google Maps", "lat": ละติจูดจริง, "lng": ลองจิจูดจริง, "type": "coffee_shop" หรือ "other" }
]
ส่งเฉพาะ JSON array เท่านั้น ห้ามมีคำอธิบายอื่น`;

          const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
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
                    for (const item of parsed) {
                      const pLat = typeof item.lat === 'number' ? item.lat : lat;
                      const pLng = typeof item.lng === 'number' ? item.lng : lng;
                      const lowerName = (item.name || '').toLowerCase();
                      const isCoffeeOrCafe =
                        item.type === 'coffee_shop' ||
                        item.type === 'cafe' ||
                        lowerName.includes('coffee') ||
                        lowerName.includes('cafe') ||
                        lowerName.includes('กาแฟ') ||
                        lowerName.includes('คาเฟ่');

                      places.push({
                        name: item.name,
                        lat: Number(pLat.toFixed(6)),
                        lng: Number(pLng.toFixed(6)),
                        type: isCoffeeOrCafe ? 'coffee_shop' : (item.type || 'other'),
                        category: isCoffeeOrCafe ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / สถานที่ใกล้เคียง',
                        isCafe: isCoffeeOrCafe,
                        distanceKm: calculateDistanceKm(lat, lng, pLat, pLng),
                      });
                    }
                    break;
                  }
                }
              }
            } catch {
              // try next
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Sort: Cafes/coffee shops first, then by nearest distance
    places.sort((a: any, b: any) => {
      if (a.isCafe && !b.isCafe) return -1;
      if (!a.isCafe && b.isCafe) return 1;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return NextResponse.json({
      success: true,
      center: { lat, lng, radiusKm, locationName },
      count: places.length,
      source: googleApiKey && places.length > 0 ? 'google_places' : 'fallback',
      places,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, places: [] },
      { status: 500 }
    );
  }
}
