export interface CafeIngredientPreset {
  id: string;
  name: string;
  category: string;
  unit: string;
  package_unit: string;
  package_size: number;
  cost_per_unit: number;
  reorder_point: number;
  supplier: string;
  description: string;
}

export const CAFE_STANDARD_PRESETS: CafeIngredientPreset[] = [
  {
    id: 'preset-coffee-blend',
    name: 'เมล็ดกาแฟคั่ว House Blend',
    category: 'เมล็ดกาแฟ & ชา',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 500,
    cost_per_unit: 0.70, // 350 บาท/ถุง (500g)
    reorder_point: 1000, // 2 ถุง
    supplier: 'โรงคั่วกาแฟ Specialty',
    description: 'มาตรฐานร้านกาแฟ: 1 ถุง 500 กรัม (ชง Double shot 18-20g ได้ ~25 แก้ว)',
  },
  {
    id: 'preset-milk-fresh',
    name: 'นมสดพาสเจอร์ไรส์ Meiji',
    category: 'นมและผลิตภัณฑ์นม',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 2000,
    cost_per_unit: 0.055, // 110 บาท/แกลลอน 2 ลิตร
    reorder_point: 4000, // 2 ขวด
    supplier: 'CP-Meiji Dairy',
    description: 'มาตรฐานร้านกาแฟ: แกลลอน 2,000 มล. (แก้วละ ~120-150 มล. ชงได้ ~14 แก้ว)',
  },
  {
    id: 'preset-milk-oat',
    name: 'นมโอ๊ต Oatly Barista',
    category: 'นมและผลิตภัณฑ์นม',
    unit: 'มล.',
    package_unit: 'กล่อง',
    package_size: 1000,
    cost_per_unit: 0.115, // 115 บาท/กล่อง 1 ลิตร
    reorder_point: 2000, // 2 กล่อง
    supplier: 'Oatly Distribution TH',
    description: 'มาตรฐานบาริสต้า: กล่อง 1,000 มล. สำหรับเครื่องดื่ม Plant-based',
  },
  {
    id: 'preset-milk-condensed',
    name: 'นมข้นหวาน (Sweetened Condensed Milk)',
    category: 'นมและผลิตภัณฑ์นม',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 2000,
    cost_per_unit: 0.075, // 150 บาท/ถุง 2 กก.
    reorder_point: 2000, // 1 ถุง
    supplier: 'Dairy Supplies Co.',
    description: 'ขนาดคาเฟ่ประหยัด: ถุงใหญ่ 2,000 กรัม (2 กก.)',
  },
  {
    id: 'preset-milk-evaporated',
    name: 'นมข้นจืด / ครีมเทียมเหลว',
    category: 'นมและผลิตภัณฑ์นม',
    unit: 'มล.',
    package_unit: 'กล่อง',
    package_size: 1000,
    cost_per_unit: 0.065, // 65 บาท/กล่อง 1 ลิตร
    reorder_point: 2000, // 2 กล่อง
    supplier: 'Dairy Supplies Co.',
    description: 'ขนาดร้านค้า: กล่อง 1,000 มล.',
  },
  {
    id: 'preset-matcha-uji',
    name: 'ผงมัทฉะอุจิพรีเมียม (Ceremonial Uji Matcha)',
    category: 'ผงชาและเครื่องดื่ม',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 100,
    cost_per_unit: 2.50, // 250 บาท/ถุง 100 กรัม
    reorder_point: 200, // 2 ถุง
    supplier: 'Kyoto Tea Importer',
    description: 'มาตรฐานคาเฟ่: ถุง 100 กรัม (ใช้แก้วละ 3-5 กรัม ชงได้ ~20-25 แก้ว)',
  },
  {
    id: 'preset-cocoa-dutch',
    name: 'ผงโกโก้ดัทช์แท้ 100%',
    category: 'ผงชาและเครื่องดื่ม',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 500,
    cost_per_unit: 0.40, // 200 บาท/ถุง 500 กรัม
    reorder_point: 500, // 1 ถุง
    supplier: 'Bakery Supplies Co.',
    description: 'มาตรฐานคาเฟ่: ถุง 500 กรัม (แก้วละ 15-20 กรัม ชงได้ ~25-30 แก้ว)',
  },
  {
    id: 'preset-tea-thai',
    name: 'ใบชาไทยสูตรเข้มข้น (Thai Tea)',
    category: 'ผงชาและเครื่องดื่ม',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 500,
    cost_per_unit: 0.16, // 80 บาท/ถุง 500 กรัม
    reorder_point: 500, // 1 ถุง
    supplier: 'ชาไทยตรามือ',
    description: 'มาตรฐานคาเฟ่: ถุง 500 กรัม ชงชาไทยเย็นรสเข้มข้น',
  },
  {
    id: 'preset-tea-green',
    name: 'ใบชาเขียวกลิ่นมะลิพรีเมียม',
    category: 'ผงชาและเครื่องดื่ม',
    unit: 'กรัม',
    package_unit: 'ถุง',
    package_size: 500,
    cost_per_unit: 0.18, // 90 บาท/ถุง 500 กรัม
    reorder_point: 500, // 1 ถุง
    supplier: 'ชาไทยตรามือ',
    description: 'มาตรฐานคาเฟ่: ถุง 500 กรัม ชงชาเขียวนมและชาเขียวใส',
  },
  {
    id: 'preset-syrup-vanilla',
    name: 'น้ำเชื่อมวานิลลา Monin',
    category: 'ไซรัปและสารให้ความหวาน',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 750,
    cost_per_unit: 0.40, // 300 บาท/ขวด 750 มล.
    reorder_point: 750, // 1 ขวด
    supplier: 'Monin Thailand',
    description: 'มาตรฐานขวดแก้ว Monin/Torani/Davinci: 1 ขวด = 750 มล. (ใช้แก้วละ 15-20 มล.)',
  },
  {
    id: 'preset-syrup-caramel',
    name: 'น้ำเชื่อมคาราเมล Monin',
    category: 'ไซรัปและสารให้ความหวาน',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 750,
    cost_per_unit: 0.40,
    reorder_point: 750,
    supplier: 'Monin Thailand',
    description: 'มาตรฐานขวดแก้ว Monin: 1 ขวด = 750 มล.',
  },
  {
    id: 'preset-syrup-sugar',
    name: 'น้ำเชื่อมสำเร็จรูปมิตรผล',
    category: 'ไซรัปและสารให้ความหวาน',
    unit: 'มล.',
    package_unit: 'แกลลอน',
    package_size: 5000,
    cost_per_unit: 0.035, // 175 บาท/แกลลอน 5 ลิตร
    reorder_point: 5000, // 1 แกลลอน
    supplier: 'มิตรผล',
    description: 'ขนาดประหยัดสำหรับคาเฟ่: แกลลอน 5,000 มล. (5 ลิตร)',
  },
  {
    id: 'preset-honey',
    name: 'น้ำผึ้งดอกลำไยแท้ 100%',
    category: 'ไซรัปและสารให้ความหวาน',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 1000,
    cost_per_unit: 0.22, // 220 บาท/ขวด 1 ลิตร
    reorder_point: 1000, // 1 ขวด
    supplier: 'Northern Honey Farm',
    description: 'ขนาดมาตรฐาน: ขวด 1,000 มล. (1 ลิตร)',
  },
  {
    id: 'preset-yuzu',
    name: 'น้ำส้มยูซุแท้ 100% (Yuzu Purée)',
    category: 'น้ำผลไม้และเพียวเร่',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 1000,
    cost_per_unit: 0.75, // 750 บาท/ขวด 1 ลิตร
    reorder_point: 1000, // 1 ขวด
    supplier: 'Japan Gourmet Supply',
    description: 'ขนาดร้านกาแฟ: ขวด 1,000 มล.',
  },
  {
    id: 'preset-soda',
    name: 'โซดาสิงห์ (Singha Soda)',
    category: 'น้ำผลไม้และเพียวเร่',
    unit: 'มล.',
    package_unit: 'ขวด',
    package_size: 325,
    cost_per_unit: 0.034, // 11 บาท/ขวด 325 มล.
    reorder_point: 1950, // 6 ขวด
    supplier: 'Singha Corporation',
    description: 'มาตรฐานขวดแก้ว: 1 ขวด = 325 มล. (1 แก้วใช้ 100-150 มล.)',
  },
  {
    id: 'preset-cups-16oz',
    name: 'แก้วพลาสติกเย็น 16 oz (PET)',
    category: 'บรรจุภัณฑ์',
    unit: 'ใบ',
    package_unit: 'แถว',
    package_size: 50,
    cost_per_unit: 1.80, // 90 บาท/แถว 50 ใบ
    reorder_point: 100, // 2 แถว
    supplier: 'Thai Packaging Supply',
    description: 'มาตรฐานบรรจุภัณฑ์: 1 แถว = 50 ใบ (1 ลัง = 20 แถว / 1,000 ใบ)',
  },
  {
    id: 'preset-lids',
    name: 'ฝาแก้ว PET 98 mm (ฝาเรียบ/โดม/ฮาล์ฟ)',
    category: 'บรรจุภัณฑ์',
    unit: 'ชิ้น',
    package_unit: 'แถว',
    package_size: 50,
    cost_per_unit: 0.70, // 35 บาท/แถว 50 ชิ้น
    reorder_point: 100, // 2 แถว
    supplier: 'Thai Packaging Supply',
    description: 'มาตรฐานบรรจุภัณฑ์: 1 แถว = 50 ชิ้น',
  },
  {
    id: 'preset-straws',
    name: 'หลอดดูดน้ำพรีเมียม (หุ้มกระดาษ)',
    category: 'บรรจุภัณฑ์',
    unit: 'เส้น',
    package_unit: 'ห่อ',
    package_size: 100,
    cost_per_unit: 0.35, // 35 บาท/ห่อ 100 เส้น
    reorder_point: 200, // 2 ห่อ
    supplier: 'Thai Packaging Supply',
    description: 'มาตรฐานร้านกาแฟ: 1 ห่อ = 100 เส้น',
  },
];

/**
 * Helper to format numeric values cleanly as integers without any decimal points.
 */
export function formatInteger(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';
  const val = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString();
}

/**
 * Formats a stock amount into package units + base units with NO decimals anywhere.
 * Example: 12000 ml with packSize 2000 -> 6 ขวด (12,000 มล.)
 * Example: 12500 ml with packSize 2000 -> 6 ขวด (12,500 มล.)
 */
export interface FormattedStock {
  packCount: number;
  packText: string;
  baseText: string;
  fullDisplay: string;
  remainder: number;
  remainderText: string | null;
}

export function formatStockUnits(
  quantity: number | string | null | undefined,
  packageSize: number | string | null | undefined,
  packageUnit: string | null | undefined,
  unit: string
): FormattedStock {
  const qty = typeof quantity === 'number' ? quantity : parseFloat(String(quantity || 0)) || 0;
  const packSizeNum = typeof packageSize === 'number' ? packageSize : parseFloat(String(packageSize || 0)) || 0;
  const roundedQty = Math.round(qty);
  const baseText = `${roundedQty.toLocaleString()} ${unit}`;

  if (packSizeNum > 0 && packageUnit && packageUnit.trim() !== '') {
    const fullPacks = Math.floor(roundedQty / packSizeNum);
    const remainder = roundedQty % packSizeNum;
    const packText = `(${fullPacks.toLocaleString()} ${packageUnit})`;
    const remainderText = remainder > 0 ? `เศษ ${remainder.toLocaleString()} ${unit}` : null;
    const fullDisplay = `${baseText} ${packText}`;

    return {
      packCount: fullPacks,
      packText,
      baseText,
      fullDisplay,
      remainder,
      remainderText,
    };
  }

  return {
    packCount: roundedQty,
    packText: '',
    baseText,
    fullDisplay: baseText,
    remainder: 0,
    remainderText: null,
  };
}
