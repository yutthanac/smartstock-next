import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, apiKey: clientApiKey } = body;

    if (!image) {
      return NextResponse.json({ error: 'MISSING_IMAGE', message: 'ไม่พบข้อมูลรูปภาพ' }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'NO_API_KEY',
          message: 'ยังไม่ได้ระบุ GEMINI_API_KEY กรุณาใส่ API Key ในไฟล์ .env.local หรือระบุในหน้าจอ',
        },
        { status: 400 }
      );
    }

    // Extract mime type and clean base64 data
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `You are an expert Thai OCR and Receipt / Invoice Parser for a cafe and restaurant inventory management system in Thailand.
Analyze the provided image carefully and adhere strictly to these rules:

CRITICAL STEP 1: VALIDATION
Determine if this image is legitimately a receipt, tax invoice, cash bill, POS thermal slip, or handwritten purchase bill from a vendor/market/store.
- IF IT IS NOT A VALID RECEIPT OR BILL (for example: photo of a person, animal, meme, random object, car, scenery, food without pricing/bill, or blurry unreadable image):
  YOU MUST RETURN:
  {
    "is_receipt": false,
    "error_message": "ภาพที่อัปโหลดไม่ใช่ใบเสร็จหรือบิลเงินสด ไม่พบรายการสินค้าและราคา กรุณาถ่ายภาพใบเสร็จใหม่อีกครั้ง",
    "store_name": "",
    "date": "",
    "items": [],
    "total_amount": 0,
    "confidence": 0
  }

CRITICAL STEP 2: EXTRACTION (ONLY IF VALID RECEIPT)
If it IS a valid receipt/bill, extract:
- store_name: Vendor or store name (e.g. Makro, Lotus, Big C, Ceresia Coffee Roasters, ตลาดสด, โรงคั่ว, etc.)
- date: Date of purchase (YYYY-MM-DD format if possible)
- items: Array of purchased items. For each item:
  - name: Item/ingredient name in Thai or English as printed
  - quantity: Number of units purchased (number, default 1 if not specified)
  - unit: Unit of measurement (e.g. กก., กรัม, ลิตร, มล., ถุง, แก้ว, ชิ้น, กล่อง, ลัง, ขวด, แพ็ค)
  - cost_per_unit: Unit cost in Thai Baht (number)
  - total_price: Line total in Thai Baht (quantity * cost_per_unit)
- total_amount: Grand total amount on the receipt (number)
- confidence: Estimated confidence score from 0 to 100 (number)
- is_receipt: true

Respond ONLY with pure JSON matching this structure without Markdown formatting or backticks.`;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    };

    // Try primary model (gemini-3.5-flash), fallback to gemini-3.5-flash-lite if unavailable
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
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
      return NextResponse.json(
        {
          error: 'GEMINI_API_ERROR',
          message: `Gemini API ตอบกลับผิดพลาด: ${lastError}`,
        },
        { status: 502 }
      );
    }

    const textPart = responseData?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    if (!textPart) {
      return NextResponse.json(
        { error: 'EMPTY_RESPONSE', message: 'AI ไม่สามารถสกัดข้อความจากภาพนี้ได้' },
        { status: 500 }
      );
    }

    const cleanText = textPart.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Scan receipt error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
