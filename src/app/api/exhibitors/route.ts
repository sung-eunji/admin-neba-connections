import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type ExhibitorRow = {
  id: bigint;
  name: string;
  country: string | null;
  address: string | null;
  company_info: string | null;
  activities: string | null;
  target_markets: string | null;
  press_release: string | null;
  [key: string]: any;
};

function isFrance(row: {
  country: string | null;
  address: string | null;
  company_info: string | null;
}) {
  const s = `${row.country ?? ''} ${row.address ?? ''} ${
    row.company_info ?? ''
  }`.toLowerCase();
  return [
    'france',
    'paris',
    'lyon',
    'marseille',
    'bordeaux',
    'lille',
    'toulouse',
    'nantes',
  ].some((k) => s.includes(k));
}
function tagCategory(text: string) {
  const t = (text || '').toLowerCase();
  const hit = (r: RegExp) => r.test(t);
  if (hit(/\b(apparel|clothing|fashion|boutique|footwear|textile)\b/))
    return 'fashion_brand_retail';
  if (hit(/\b(marketplace|e-?commerce|webshop|platform|omni(channel)?)\b/))
    return 'marketplace_ecommerce';
  if (hit(/\b(payment|pos|terminal|checkout)\b/)) return 'payments_pos';
  if (hit(/\b(logistic|warehouse|shipping|fulfil?lment|3pl)\b/))
    return 'logistics_fulfillment';
  if (hit(/\b(saas|software|crm|cdp|analytics|ai|inventory|pricing|plm)\b/))
    return 'retail_tech_saas';
  if (hit(/\b(kiosk|signage|rfid|barcode|handheld|scanner|display)\b/))
    return 'instore_hardware_signage';
  if (hit(/\b(home|interior|furniture|decor)\b/)) return 'home_interior';
  return 'other';
}
function pantsCandidate(row: ExhibitorRow, cat: string) {
  const txt = `${row.name} ${row.company_info ?? ''} ${row.activities ?? ''} ${
    row.target_markets ?? ''
  }`.toLowerCase();
  const apparelSignals = [
    'apparel',
    'clothing',
    'fashion',
    'retail',
    'marketplace',
    'e-commerce',
    'ecommerce',
    'store',
    'footwear',
    'textile',
  ].some((k) => txt.includes(k));
  const catGood = [
    'fashion_brand_retail',
    'marketplace_ecommerce',
    'home_interior',
  ].includes(cat);
  return apparelSignals || catGood || isFrance(row);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const fr = searchParams.get('fr'); // "1"이면 프랑스만
  const take = Number(searchParams.get('take') ?? 50);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { company_info: { contains: q, mode: 'insensitive' as const } },
          { activities: { contains: q, mode: 'insensitive' as const } },
          { target_markets: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const rows = await prisma.exhibitors_prw_2025.findMany({
    where,
    orderBy: { crawled_at: 'desc' },
    take,
  });

  const mapped = rows
    .map((r: ExhibitorRow) => {
      const combined = [
        r.company_info,
        r.activities,
        r.target_markets,
        r.press_release,
      ]
        .filter(Boolean)
        .join(' | ');
      const cat = tagCategory(`${r.name} ${combined}`);
      return {
        ...r,
        is_france: isFrance(r),
        category_tag: cat,
        pants_candidate: pantsCandidate(r, cat),
      };
    })
    .filter((r: ExhibitorRow & { is_france: boolean }) =>
      fr === '1' ? r.is_france : true
    );

  return NextResponse.json({ count: mapped.length, items: mapped });
}
