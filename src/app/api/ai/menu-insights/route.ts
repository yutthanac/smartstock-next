import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { menus = [], ingredients = [], dashboardKPI = {}, apiKey: clientApiKey } = body;

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // Filter low stock and slow moving / high profit items
    const lowStockIngredients = ingredients.filter((i: any) => i.current_stock <= i.min_stock);

    // If no API key, return sophisticated rule-based analysis
    if (!apiKey) {
      return generateFallbackInsights(menus, ingredients, dashboardKPI);
    }

    const systemPrompt = `คุณคือที่ปรึกษาเชิงกลยุทธ์ธุรกิจร้านอาหารและคาเฟ่ (F&B Business Strategy & Recipe Development Consultant) ในไทย
หน้าที่ของคุณคือวิเคราะห์ข้อมูลเมนู ต้นทุน วัตถุดิบในคลัง และยอดขาย เพื่อให้คำแนะนำที่นำไปปฏิบัติได้จริง (Actionable Business Recommendations)

ข้อมูลร้านค้าปัจจุบัน:
- กำไรเฉลี่ยร้าน: ${dashboardKPI.profit_margin || 0}%
- เมนูทั้งหมด (${menus.length} รายการ):
${menus.slice(0, 15).map((m: any) => `  - ${m.name} (${m.category}): ขาย ${m.price}฿, ทุน ${m.cost_price || 0}฿, มาร์จิ้น ${m.margin_percent || 0}%, ยอดขายสะสม ${m.order_count || 0}`).join('\n')}
- วัตถุดิบคงคลังตัวอย่าง (${ingredients.length} รายการ, ใกล้หมด ${lowStockIngredients.length} รายการ):
${ingredients.slice(0, 15).map((ing: any) => `  - ${ing.name}: เหลือ ${ing.current_stock} ${ing.unit} (จุดสั่งซื้อ ${ing.min_stock}) ทุน ${ing.cost_per_unit}฿/${ing.unit}`).join('\n')}

กรุณาวิเคราะห์และส่งออก JSON ในรูปแบบต่อไปนี้เท่านั้น โดยไม่ต้องใส่ markdown code block หรือคำอธิบายเพิ่มเติม:
{
  "summary": {
    "headline": "ข้อความสรุปภาพรวมสถานะธุรกิจสั้นๆ คมชัด 1 ประโยค",
    "health_score": 85,
    "key_opportunities": ["โอกาสทางธุรกิจข้อ 1", "โอกาสทางธุรกิจข้อ 2"]
  },
  "menu_recommendations": [
    {
      "id": 1,
      "name": "ชื่อเมนูที่มีอยู่",
      "category": "หมวดหมู่",
      "strategy_type": "star",
      "order_count": 120,
      "margin": 65,
      "tag": "เมนูทำกำไรสูงสุด",
      "insight": "คำอธิบายเชิงกลยุทธ์สั้นๆ ชี้ชัด เช่น ควรจัดคู่คอมโบ หรือปรับไซส์",
      "action_step": "คำแนะนำสั้นๆ ที่ควรทำ เช่น 'จัดเซ็ตคู่กับครัวซองต์ ลด 10 บาท'"
    }
  ],
  "new_recipe_ideas": [
    {
      "title": "ไอเดียเมนูใหม่ที่ใช้วัตถุดิบที่มีในคลัง",
      "target_customer": "กลุ่มลูกค้าเป้าหมาย เช่น วัยทำงานสายสุขภาพ",
      "ingredients_used": ["วัตถุดิบ 1", "วัตถุดิบ 2"],
      "estimated_cost": 25,
      "suggested_price": 75,
      "estimated_margin": 66,
      "why_launch": "เหตุผลทางธุรกิจที่ควรเปิดตัวเมนูนี้เพื่อระบายสต็อกหรือเพิ่ม Basket Size"
    }
  ],
  "cost_saving_tips": [
    "เคล็ดลับลดต้นทุนหรือจัดการคลังวัตถุดิบข้อ 1",
    "เคล็ดลับลดต้นทุนหรือจัดการคลังวัตถุดิบข้อ 2"
  ]
}`;

    const requestPayload = {
      contents: [
        {
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    };

    const modelsToTry = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash'
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
      return generateFallbackInsights(menus, ingredients, dashboardKPI, lastError);
    }

    const textPart = responseData?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    if (!textPart) {
      return generateFallbackInsights(menus, ingredients, dashboardKPI);
    }

    const cleanText = textPart.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return NextResponse.json({ ...parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Menu insights AI error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

function generateFallbackInsights(menus: any[], ingredients: any[], dashboardKPI: any, note?: string) {
  if (!menus || menus.length === 0) {
    return NextResponse.json({
      source: 'rule_engine',
      note: 'ยังไม่มีข้อมูลเมนูและวัตถุดิบในระบบ กรุณาเพิ่มเมนูก่อนเริ่มวิเคราะห์',
      summary: {
        headline: 'ยังไม่มีข้อมูลเมนูและยอดขายสำหรับนำมาประมวลผล',
        health_score: 0,
        key_opportunities: ['เริ่มเพิ่มเมนูและสูตรวัตถุดิบ (BOM) เพื่อให้ AI ประมวลผลวิเคราะห์ต้นทุน'],
      },
      menu_recommendations: [],
      new_recipe_ideas: [],
      cost_saving_tips: [
        'ตั้งเกณฑ์จุดสั่งซื้อวัตถุดิบ (Reorder Point) ตามสถิติยอดขายจริง ไม่สั่งตุนเกินความจำเป็น',
        'ตรวจเช็กสต็อกวัตถุดิบสม่ำเสมอเพื่อป้องกันสินค้าหมดอายุ',
      ],
    });
  }

  const sortedByMargin = [...menus].sort((a, b) => (b.margin_percent || 0) - (a.margin_percent || 0));
  const topMargin = sortedByMargin[0];
  const secondMargin = sortedByMargin[1] || topMargin;
  const slowMover = [...menus].sort((a, b) => (a.order_count || 0) - (b.order_count || 0))[0] || topMargin;

  return NextResponse.json({
    source: 'rule_engine',
    note: note || 'วิเคราะห์ด้วยระบบประมวลผลสถิติภายในร้าน (Local Business Rule Engine)',
    summary: {
      headline: `พอร์ตโฟลิโอเมนูมีอัตรากำไรเฉลี่ยอยู่ที่ ${dashboardKPI.profit_margin || 0}%`,
      health_score: 85,
      key_opportunities: [
        `ผลักดันการขายแบบ Bundle สำหรับเมนู "${topMargin.name}" เพื่อเพิ่มมูลค่าตะกร้าต่อบิล`,
        `ทบทวนสัดส่วนการใช้วัตถุดิบในเมนูที่ยอดสั่งน้อยลง เพื่อลดของเสียค้างสต็อก`,
      ],
    },
    menu_recommendations: [
      {
        id: topMargin.id || 1,
        name: topMargin.name,
        category: topMargin.category || 'ทั่วไป',
        strategy_type: 'high_margin',
        order_count: topMargin.order_count || 0,
        margin: Math.round(topMargin.margin_percent || 0),
        tag: 'มาร์จิ้นดีเยี่ยม',
        insight: `มีอัตรากำไรสูงถึง ${Math.round(topMargin.margin_percent || 0)}% ควรกำหนดให้พนักงานหน้าร้านแนะนำเป็นเมนูเปิดบิล (Upselling)`,
        action_step: 'จัดวางไว้ในจุดสายตาของเมนูบอร์ด หรือแนะนำคู่กับเมนูอื่น',
      },
      ...(sortedByMargin.length > 1 ? [{
        id: secondMargin.id || 2,
        name: secondMargin.name,
        category: secondMargin.category || 'ทั่วไป',
        strategy_type: 'star' as const,
        order_count: secondMargin.order_count || 0,
        margin: Math.round(secondMargin.margin_percent || 0),
        tag: 'ดาวเด่นยอดนิยม',
        insight: 'ความถี่ในการสั่งซื้อสม่ำเสมอและทำกำไรได้ดีมาก เป็นเมนูหลักสร้างกระแสเงินสด',
        action_step: 'รักษามาตรฐานรสชาติ และใช้วัตถุดิบล็อตใหม่เสมอเพื่อคงคุณภาพ',
      }] : []),
    ],
    new_recipe_ideas: [
      {
        title: 'ครีมชีส โฟมมัทฉะลาเต้ (Cream Cheese Foam Matcha)',
        target_customer: 'กลุ่ม Gen-Z และคนทำงานที่ชอบเครื่องดื่มหน้าตาสวยงามถ่ายรูปลงโซเชียล',
        ingredients_used: ['ผงมัทฉะพรีเมียม', 'วิปปิ้งครีม', 'นมสดรสจืด'],
        estimated_cost: 28,
        suggested_price: 85,
        estimated_margin: 67,
        why_launch: 'ใช้วัตถุดิบนมและผงชาที่มีในสต็อกอยู่แล้ว ไม่ต้องสต็อกวัตถุดิบใหม่ แต่เพิ่มมูลค่าราคาขายได้สูง',
      },
      {
        title: 'ฮันนี่ เลมอน โคลด์บรูว์ (Honey Lemon Cold Brew)',
        target_customer: 'ลูกค้าสายสดชื่น ดื่มช่วงบ่ายแทนเครื่องดื่มรสหวานจัด',
        ingredients_used: ['เมล็ดกาแฟคั่วกลาง', 'น้ำผึ้งแท้', 'เลมอนสด'],
        estimated_cost: 22,
        suggested_price: 75,
        estimated_margin: 70,
        why_launch: 'ช่วยระบายเมล็ดกาแฟและน้ำผึ้ง กำไรขั้นต้นสูงกว่า 70% และเสิร์ฟได้รวดเร็ว',
      },
    ],
    cost_saving_tips: [
      'ตรวจเช็กการละลายและสเกลน้ำแข็งในเครื่องทำน้ำแข็งเพื่อควบคุมอุณหภูมิและลดการละลายเร็วเกินไป',
      'ใช้ช้อนตวงหรือกระบอกตวงมาตรฐานสำหรับไซรัปและนม เพื่อหลีกเลี่ยงการเทเกินมาตรฐานแก้วละ 5-10 มล.',
    ],
  });
}
