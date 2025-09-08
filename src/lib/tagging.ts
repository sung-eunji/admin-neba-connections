// Utility functions for categorizing exhibitors and detecting France-based companies

export type CategoryTag =
  | 'fashion_brand_retail'
  | 'marketplace_ecommerce'
  | 'home_interior'
  | 'payments_pos'
  | 'logistics_fulfillment'
  | 'retail_tech_saas'
  | 'instore_hardware_signage'
  | 'other';

export interface ComputedFields {
  is_france: boolean;
  category_tag: CategoryTag;
  pants_candidate: boolean;
}

// France detection patterns
const FRANCE_PATTERNS = [
  'france',
  'paris',
  'lyon',
  'marseille',
  'bordeaux',
  'lille',
  'toulouse',
  'nantes',
  'french',
  'français',
];

// Category patterns
const CATEGORY_PATTERNS: Record<CategoryTag, RegExp[]> = {
  fashion_brand_retail: [
    /apparel|clothing|fashion|brand|retail|boutique|shoes|footwear|textile/gi,
  ],
  marketplace_ecommerce: [
    /marketplace|e-?commerce|webshop|platform|omni(channel)?/gi,
  ],
  home_interior: [/home|interior|furniture|decor(ation)?|homeware(s)?/gi],
  payments_pos: [
    /payment(s)?|pos|terminal|checkout|acquirer|card processing/gi,
  ],
  logistics_fulfillment: [
    /logistic(s)?|fulfil(l)?ment|warehouse|3pl|shipping|carrier/gi,
  ],
  retail_tech_saas: [
    /saas|software|crm|cdp|analytics?|ai|vision|inventory|pricing|planogram|plm/gi,
  ],
  instore_hardware_signage: [
    /kiosk|signage|digital signage|display|scanner|rfid|handheld|pda|barcode/gi,
  ],
  other: [],
};

// Apparel/retail keywords for pants candidate detection
const APPAREL_KEYWORDS = [
  'apparel',
  'clothing',
  'fashion',
  'retail',
  'marketplace',
  'boutique',
  'shoes',
  'footwear',
];

export function detectFrance(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return FRANCE_PATTERNS.some((pattern) => lowerText.includes(pattern));
}

export function categorizeExhibitor(
  name: string,
  companyInfo: string | null,
  activities: string | null,
  targetMarkets: string | null
): CategoryTag {
  const combinedText = [name, companyInfo, activities, targetMarkets]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check each category in order of specificity
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'other') continue;

    for (const pattern of patterns) {
      if (pattern.test(combinedText)) {
        return category as CategoryTag;
      }
    }
  }

  return 'other';
}

export function isPantsCandidate(
  category: CategoryTag,
  isFrance: boolean,
  name: string,
  companyInfo: string | null,
  activities: string | null,
  targetMarkets: string | null
): boolean {
  // France-based companies are always candidates
  if (isFrance) return true;

  // Check for apparel/retail keywords
  const combinedText = [name, companyInfo, activities, targetMarkets]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hasApparelKeywords = APPAREL_KEYWORDS.some((keyword) =>
    combinedText.includes(keyword)
  );

  // Check category
  const relevantCategories: CategoryTag[] = [
    'fashion_brand_retail',
    'marketplace_ecommerce',
    'home_interior',
  ];

  return hasApparelKeywords || relevantCategories.includes(category);
}

export function computeFields(
  name: string,
  country: string | null,
  address: string | null,
  companyInfo: string | null,
  activities: string | null,
  targetMarkets: string | null
): ComputedFields {
  const is_france = detectFrance(
    [country, address, companyInfo].filter(Boolean).join(' ')
  );
  const category_tag = categorizeExhibitor(
    name,
    companyInfo,
    activities,
    targetMarkets
  );
  const pants_candidate = isPantsCandidate(
    category_tag,
    is_france,
    name,
    companyInfo,
    activities,
    targetMarkets
  );

  return {
    is_france,
    category_tag,
    pants_candidate,
  };
}
