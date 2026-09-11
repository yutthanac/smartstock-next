import { NextRequest, NextResponse } from 'next/server';

export interface CompetitorItem {
  name: string;
  location: string;
  lat?: number;
  lng?: number;
  rating: number;
  reviews_count: string;
  price_level: string;
  signature_menus: string[];
  review_summary?: string;
  strengths: string[];
  weaknesses: string[];
  opportunity_for_us: string;
}

export interface RecommendedMenuItem {
  name: string;
  category: string;
  estimated_price: string;
  why_sell: string;
  market_gap_filled: string;
  target_customer: string;
}

export interface NeighborhoodAnalysis {
  location_name: string;
  lat: number;
  lng: number;
  neighborhood_summary: {
    market_density: string;
    target_audience: string;
    customer_demands: string;
    gap_in_market: string;
  };
  competitors: CompetitorItem[];
  suggested_positioning: string[];
  recommended_menus?: RecommendedMenuItem[];
  source?: 'gemini' | 'rule_engine';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lat = 13.7445,
      lng = 100.5332,
      locationName = 'สยามสแควร์ กรุงเทพฯ',
      storeType = 'ร้านกาแฟ / คาเฟ่ (Cafe & Coffee Shop)',
      radius = 1500,
      businessDetails = '',
      apiKey: clientApiKey,
    } = body;

    const radiusKm = (radius / 1000).toFixed(1);
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // First try reverse geocoding if locationName is generic or default
    let resolvedLocationName = locationName;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: { 'User-Agent': 'SmartStockApp/1.0' },
          next: { revalidate: 3600 },
        }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData?.display_name) {
          resolvedLocationName = geoData.display_name;
        }
      }
    } catch {
      // Keep default locationName if lookup fails
    }

    // 1. Fetch real nearby cafes & shops from Google Places API
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let realPlacesContext = '';
    let realPlacesList: any[] = [];

    if (googleApiKey) {
      try {
        const radiusMeters = Math.min(Math.max(radius, 500), 50000);
        const gRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.rating,places.userRatingCount,places.primaryType,places.formattedAddress',
          },
          body: JSON.stringify({
            includedTypes: ['cafe', 'coffee_shop', 'bakery', 'restaurant', 'tea_house'],
            maxResultCount: 15,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radiusMeters,
              },
            },
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.places) && gData.places.length > 0) {
            realPlacesList = gData.places.map((p: any) => ({
              name: p.displayName?.text,
              lat: p.location?.latitude,
              lng: p.location?.longitude,
              rating: p.rating,
              reviews_count: p.userRatingCount ? `${p.userRatingCount}` : undefined,
              address: p.formattedAddress,
              type: p.primaryType,
            })).filter((p: any) => p.name && p.lat && p.lng);

            if (realPlacesList.length > 0) {
              realPlacesContext = `รายชื่อร้านจริงที่ดึงได้จาก Google Maps API ในพิกัดนี้ (${realPlacesList.length} ร้าน):
${JSON.stringify(realPlacesList, null, 2)}
**สำคัญมาก**: คุณต้องนำรายชื่อร้านจริงเหล่านี้มาวิเคราะห์เท่านั้น ห้ามแต่งชื่อร้านปลอมขึ้นมาเองเด็ดขาด!`;
            }
          }
        }
      } catch (gErr) {
        console.error('Failed to fetch real Google Places for competitor analysis:', gErr);
      }
    }

    if (!apiKey) {
      return NextResponse.json(generateRealPlacesAnalysis(lat, lng, resolvedLocationName, realPlacesList));
    }

    const businessContext = businessDetails.trim()
      ? `ข้อมูลและแนวคิดร้านที่เจ้าของร้านต้องการเปิดหรือขาย: "${businessDetails}"`
      : `ยังไม่ได้ระบุรายละเอียดสินค้าเฉพาะเจาะจง ให้วิเคราะห์โดยรวมสำหรับร้านกาแฟ/คาเฟ่`;

    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ทำเล การตลาด และคู่แข่งร้านอาหาร/คาเฟ่ในประเทศไทย
ร้านของผู้ใช้ตั้งอยู่ที่พิกัด: ละติจูด ${lat}, ลองจิจูด ${lng}
ชื่อสถานที่/ย่าน: "${resolvedLocationName}"
ประเภทร้าน: ${storeType}
${businessContext}
รัศมีการสำรวจ: ${radius} เมตร (ประมาณ ${radiusKm} กิโลเมตร)

${realPlacesContext || 'ค้นหาร้านกาแฟ/คาเฟ่จริงที่มีอยู่จริงบน Google Maps รอบพิกัดนี้เท่านั้น ห้ามแต่งชื่อร้านขึ้นมาเอง'}

หน้าที่ของคุณคือ:
1. วิเคราะห์สภาพแวดล้อม กลุ่มลูกค้าเป้าหมายในย่านนี้ (neighborhood_summary)
2. วิเคราะห์และสรุปรีวิวจริงจาก Google Maps ของแต่ละร้านคู่แข่งด้านบน:
   - ชื่อร้าน (name) ต้องตรงกับชื่อร้านจริง
   - ที่ตั้งหรือจุดสังเกต (location)
   - ละติจูดจริง (lat)
   - ลองจิจูดจริง (lng)
   - เรตติ้ง Google Maps จริง (rating)
   - จำนวนรีวิว (reviews_count)
   - ระดับราคา (price_level เช่น ฿, ฿฿, ฿฿฿)
   - สรุปภาพรวมรีวิวลูกค้า (review_summary): สรุป 1-2 ประโยคกระชับว่าลูกค้าส่วนใหญ่ใน Google Maps รีวิวชมหรือบ่นอะไรเกี่ยวกับร้านนี้มากที่สุด
   - เมนูเด่น/Signature ที่ลูกค้าชอบสั่งในรีวิว (signature_menus)
   - สิ่งที่ลูกค้าชมในรีวิว Google Maps (strengths)
   - สิ่งที่ลูกค้าบ่นหรือ Pain Points ในรีวิว Google Maps เช่น ที่นั่งน้อย รอคิวนาน กาแฟหวานเกิน ที่จอดรถหายาก (weaknesses)
   - โอกาสทางธุรกิจที่ร้านเราสามารถแย่งชิงความได้เปรียบ (opportunity_for_us)
3. เสนอแนะจุดยืนทางการตลาด (suggested_positioning) 3-4 ข้อเพื่อให้ร้านเราชนะคู่แข่งแถวนั้น
4. แนะนำว่าในทำเลนี้ "ควรขายอะไรดีที่สุด" (recommended_menus) จำนวน 3-4 เมนู/สินค้า โดยนำรายละเอียดที่ผู้ใช้ระบุมาวิเคราะห์ผสมผสานกับช่องว่างในตลาด (Market Gap) และรีวิวบ่นของคู่แข่งแถวนั้นเพื่อให้ตอบโจทย์ลูกค้าที่สุด

กรุณาส่งออก JSON ในโครงสร้างต่อไปนี้เท่านั้น โดยไม่ต้องใส่ markdown หรือข้อความอื่น:
{
  "location_name": "${resolvedLocationName}",
  "lat": ${lat},
  "lng": ${lng},
  "neighborhood_summary": {
    "market_density": "ความหนาแน่นการแข่งขัน เช่น สูงมาก / ปานกลาง",
    "target_audience": "กลุ่มลูกค้าหลัก เช่น นักศึกษา คนทำงานรุ่นใหม่ นักท่องเที่ยว",
    "customer_demands": "สิ่งที่ลูกค้าในย่านนี้มองหาและให้ความสำคัญ",
    "gap_in_market": "ช่องว่างในตลาดที่คู่แข่งแถวนั้นยังทำได้ไม่ดีหรือไม่ครอบคลุม"
  },
  "competitors": [
    {
      "name": "ชื่อร้านจริงแถวนั้น",
      "location": "ซอยหรือจุดสังเกต",
      "lat": 13.7451,
      "lng": 100.5340,
      "rating": 4.6,
      "reviews_count": "1,200+",
      "price_level": "฿฿",
      "review_summary": "ลูกค้าส่วนใหญ่ชื่นชมรสชาติกาแฟและบรรยากาศร้านที่นั่งสบาย แต่บ่นเรื่องหาที่จอดรถยากและกาแฟออกหวานนำ",
      "signature_menus": ["เมนู 1", "เมนู 2"],
      "strengths": ["จุดชมในรีวิว 1", "จุดชมในรีวิว 2"],
      "weaknesses": ["จุดบ่นในรีวิว 1", "จุดบ่นในรีวิว 2"],
      "opportunity_for_us": "สิ่งที่ร้านเราควรนำมาปรับใช้เพื่อชิงลูกค้า"
    }
  ],
  "suggested_positioning": [
    "ข้อเสนอแนะกลยุทธ์ 1",
    "ข้อเสนอแนะกลยุทธ์ 2",
    "ข้อเสนอแนะกลยุทธ์ 3"
  ],
  "recommended_menus": [
    {
      "name": "ชื่อเมนูแนะนำ",
      "category": "หมวดหมู่ เช่น กาแฟสเปเชียลตี้ / เครื่องดื่มสุขภาพ / เบเกอรี่",
      "estimated_price": "ราคาแนะนำ เช่น 85-110 บาท",
      "why_sell": "ทำไมควรขายเมนูนี้ในย่านนี้",
      "market_gap_filled": "อุดช่องโหว่ที่คู่แข่งแถวนั้นยังไม่มี",
      "target_customer": "กลุ่มลูกค้าที่จะสั่งเมนูนี้"
    }
  ]
}`;

    const requestPayload = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    };

    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ];

    let lastError = '';
    let responseData: any = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        if (res.ok) {
          responseData = await res.json();
          break;
        } else {
          lastError = `Model ${model} returned ${res.status}: ${await res.text()}`;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!responseData) {
      return NextResponse.json(generateRealPlacesAnalysis(lat, lng, resolvedLocationName, realPlacesList));
    }

    const textPart = responseData?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    if (!textPart) {
      return NextResponse.json(generateRealPlacesAnalysis(lat, lng, resolvedLocationName, realPlacesList));
    }

    const cleanText = textPart.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return NextResponse.json({
      ...parsed,
      lat,
      lng,
      location_name: parsed.location_name || resolvedLocationName,
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Competitor intelligence API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

function generateRealPlacesAnalysis(
  lat: number,
  lng: number,
  locationName: string,
  realPlaces: any[]
): NeighborhoodAnalysis {
  const competitors: CompetitorItem[] = realPlaces.map((p) => ({
    name: p.name,
    location: p.address || locationName,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating || 4.5,
    reviews_count: p.reviews_count || 'รีวิวบน Google',
    price_level: '฿฿',
    review_summary: `ร้านมีฐานลูกค้ารีวิวจริงบน Google Maps (${p.rating ? p.rating + ' ดาว' : ''}) ลูกค้าชื่นชอบความสะดวกและรสชาติเครื่องดื่ม`,
    signature_menus: ['เครื่องดื่ม Signature', 'กาแฟสด', 'เมนูยอดนิยม'],
    strengths: ['ทำเลดี เข้าถึงสะดวก', 'มีข้อมูลและรีวิวจริงบน Google Maps'],
    weaknesses: ['ที่จอดรถอาจมีจำกัดในช่วงเวลาเร่งด่วน', 'ยังขาดเมนูทางเลือกสุขภาพ'],
    opportunity_for_us: 'ชูจุดขายกาแฟคุณภาพและเมนูซิกเนเจอร์ที่แตกต่าง เพื่อดึงดูดลูกค้าในย่านนี้',
  }));

  return {
    source: 'rule_engine',
    location_name: locationName,
    lat,
    lng,
    neighborhood_summary: {
      market_density: competitors.length > 5 ? 'สูง (มีร้านค้าในบริเวณรอบข้าง)' : 'ปานกลาง',
      target_audience: 'ผู้บริโภค คนทำงาน และผู้พักอาศัยในบริเวณโดยรอบ',
      customer_demands: 'มองหากาแฟคุณภาพดี รสชาติคงที่ และการบริการที่รวดเร็ว',
      gap_in_market: 'ยังขาดร้านที่มีเอกลักษณ์เฉพาะตัวชัดเจนและเมนูทางเลือกพิเศษ',
    },
    competitors,
    suggested_positioning: [
      'ชูจุดขายกาแฟพรีเมียมในราคาที่จับต้องได้ง่ายกว่าร้าน Specialty ชั้นนำ',
      'นำเสนอเมนูทางเลือกเพื่อสุขภาพและขนมสดใหม่',
      'สร้างบรรยากาศร้านที่อบอุ่นและให้บริการรวดเร็ว',
    ],
    recommended_menus: [
      {
        name: 'Specialty Cold Brew Honey Sparkling',
        category: 'กาแฟสดเพื่อความสดชื่น',
        estimated_price: '85 - 100 บาท',
        why_sell: 'ดื่มง่าย สดชื่น เหมาะกับสภาพอากาศและผู้สัญจรไปมาในย่านนี้',
        market_gap_filled: 'เมนูเครื่องดื่มดับร้อนรสชาตินุ่มนวล ไม่หวานเลี่ยน',
        target_customer: 'คนทำงานและผู้สัญจรในพื้นที่',
      },
    ],
  };
}
