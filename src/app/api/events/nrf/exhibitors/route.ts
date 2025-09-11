import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { computeFields, CategoryTag } from '@/lib/tagging';
import type { Prisma } from '@/generated/prisma';

// Re-export types for use in other components
export type { CategoryTag } from '@/lib/tagging';

export interface ExhibitorWithComputed {
  id: string;
  name: string;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  booth: string | null;
  company_info: string | null;
  activities: string | null;
  target_markets: string | null;
  press_release: string | null;
  crawled_at: string | null;
  is_france: boolean;
  category_tag: CategoryTag;
  pants_candidate: boolean;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface ExhibitorsResponse {
  total: number;
  items: ExhibitorWithComputed[];
  facets: {
    byCountry: FacetCount[];
    byCategory: FacetCount[];
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || 'all';
    const candidate = searchParams.get('candidate') === '1';
    const take = parseInt(searchParams.get('take') || '1000');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * take;

    // Build where clause
    const where: Prisma.exhibitors_prw_2025WhereInput = {};

    // Text search across multiple fields
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { company_info: { contains: q, mode: 'insensitive' } },
        { activities: { contains: q, mode: 'insensitive' } },
        { target_markets: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Country filter - filter by country name extracted from address
    if (country !== 'all') {
      // Create a list of possible address patterns for the country
      const countryPatterns: Record<string, string[]> = {
        France: ['FRANCE'],
        Spain: ['SPAIN'],
        Italy: ['ITALY'],
        Netherlands: ['NETHERLANDS'],
        China: ['CHINA'],
        Taiwan: ['TAIWAN'],
        'United States': ['UNITED STATES', 'UNITED'],
        Romania: ['ROMANIA'],
      };

      const patterns = countryPatterns[country] || [country.toUpperCase()];

      where.OR = [
        ...(where.OR ?? []),
        ...patterns.map((pattern) => ({
          country: { contains: pattern, mode: 'insensitive' as const },
        })),
      ];
    }

    // Get total count for pagination
    const total = await prisma.exhibitors_prw_2025.count({ where });

    // Get exhibitors with pagination
    const exhibitors = await prisma.exhibitors_prw_2025.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
    });

    // Compute fields for each exhibitor
    const itemsWithComputed: ExhibitorWithComputed[] = exhibitors.map(
      (exhibitor) => {
        const computed = computeFields(
          exhibitor.name,
          exhibitor.country,
          exhibitor.address,
          exhibitor.company_info,
          exhibitor.activities,
          exhibitor.target_markets
        );

        return {
          id: exhibitor.id.toString(),
          name: exhibitor.name,
          country: exhibitor.country,
          address: exhibitor.address,
          phone: exhibitor.phone,
          email: exhibitor.email,
          website_url: exhibitor.website_url,
          linkedin_url: exhibitor.linkedin_url,
          booth: exhibitor.booth,
          company_info: exhibitor.company_info,
          activities: exhibitor.activities,
          target_markets: exhibitor.target_markets,
          press_release: exhibitor.press_release,
          crawled_at: exhibitor.crawled_at?.toISOString() || null,
          ...computed,
        };
      }
    );

    // Filter by pants candidate if requested
    const filteredItems = candidate
      ? itemsWithComputed.filter((item) => item.pants_candidate)
      : itemsWithComputed;

    // Get facets for current query (without candidate filter for broader stats)
    const allExhibitorsForFacets = await prisma.exhibitors_prw_2025.findMany({
      where,
    });

    const allItemsWithComputed = allExhibitorsForFacets.map((exhibitor) => {
      const computed = computeFields(
        exhibitor.name,
        exhibitor.country,
        exhibitor.address,
        exhibitor.company_info,
        exhibitor.activities,
        exhibitor.target_markets
      );
      return { ...exhibitor, ...computed };
    });

    // Country facets - extract country name from address
    const extractCountryName = (address: string): string => {
      if (!address) return 'Unknown';

      const parts = address.trim().split(' ');
      const lastPart = parts[parts.length - 1];

      const countryMap: Record<string, string> = {
        FRANCE: 'France',
        SPAIN: 'Spain',
        ITALY: 'Italy',
        NETHERLANDS: 'Netherlands',
        CHINA: 'China',
        TAIWAN: 'Taiwan',
        UNITED: 'United States',
        STATES: 'United States',
        ROMANIA: 'Romania',
      };

      return countryMap[lastPart] || lastPart;
    };

    const countryCounts = new Map<string, number>();
    allItemsWithComputed.forEach((item) => {
      const countryName = extractCountryName(item.country || 'Unknown');
      countryCounts.set(countryName, (countryCounts.get(countryName) || 0) + 1);
    });

    const byCountry: FacetCount[] = Array.from(countryCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Category facets
    const categoryCounts = new Map<string, number>();
    allItemsWithComputed.forEach((item) => {
      const category = item.category_tag;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    const byCategory: FacetCount[] = Array.from(categoryCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    const response: ExhibitorsResponse = {
      total: candidate ? filteredItems.length : total,
      items: filteredItems,
      facets: {
        byCountry,
        byCategory,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching exhibitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exhibitors' },
      { status: 500 }
    );
  }
}
