import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { computeFields, CategoryTag } from '@/lib/tagging';

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

    // Build Supabase query - start simple
    let query = supabaseAdmin
      .from('exhibitors_prw_2025')
      .select('*', { count: 'exact' });

    // Text search - use simpler approach
    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    // Country filter - use simpler approach
    if (country !== 'all') {
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
      // Use the first pattern for now
      query = query.ilike('country', `%${patterns[0]}%`);
    }

    // Get total count and data with pagination
    const {
      data: exhibitors,
      count: total,
      error,
    } = await query
      .order('name', { ascending: true })
      .range(skip, skip + take - 1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      console.error('❌ Query details:', {
        q,
        country,
        take,
        page,
        skip,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch exhibitors',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

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
          crawled_at: exhibitor.crawled_at
            ? typeof exhibitor.crawled_at === 'string'
              ? exhibitor.crawled_at
              : exhibitor.crawled_at instanceof Date
              ? exhibitor.crawled_at.toISOString()
              : null
            : null,
          ...computed,
        };
      }
    );

    // Filter by pants candidate if requested
    const filteredItems = candidate
      ? itemsWithComputed.filter((item) => item.pants_candidate)
      : itemsWithComputed;

    // Get facets for current query (without candidate filter for broader stats)
    let facetsQuery = supabaseAdmin.from('exhibitors_prw_2025').select('*');

    // Apply same filters for facets - use simpler approach
    if (q) {
      facetsQuery = facetsQuery.ilike('name', `%${q}%`);
    }

    if (country !== 'all') {
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
      facetsQuery = facetsQuery.ilike('country', `%${patterns[0]}%`);
    }

    const { data: allExhibitorsForFacets, error: facetsError } =
      await facetsQuery;

    if (facetsError) {
      console.error('❌ Supabase facets query error:', facetsError);
      console.error('❌ Facets query details:', {
        q,
        country,
        error: facetsError.message,
        code: facetsError.code,
        details: facetsError.details,
        hint: facetsError.hint,
      });
    }

    const allItemsWithComputed = (allExhibitorsForFacets || []).map(
      (exhibitor) => {
        const computed = computeFields(
          exhibitor.name,
          exhibitor.country,
          exhibitor.address,
          exhibitor.company_info,
          exhibitor.activities,
          exhibitor.target_markets
        );
        return { ...exhibitor, ...computed };
      }
    );

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
      total: candidate ? filteredItems.length : total || 0,
      items: filteredItems,
      facets: {
        byCountry,
        byCategory,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching exhibitors:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch exhibitors',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
