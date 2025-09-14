import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPostgresExhibitors } from '@/lib/postgres-exhibitors';
import { computeFields } from '@/lib/tagging';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '100');

    // Try to use PostgreSQL first, fallback to mock data
    let exhibitors;
    
    try {
      const result = await getPostgresExhibitors('', take, 0);
      exhibitors = result.items;
    } catch (postgresError) {
      console.log('⚠️ PostgreSQL failed, using mock data:', postgresError);
      
      // Mock data for when PostgreSQL fails
      exhibitors = [
        {
          id: '1',
          name: 'Sample Fashion Brand',
          country: 'France',
          address: 'Paris, France',
          company_info: 'Fashion retail company',
          activities: 'Apparel and clothing retail',
          target_markets: 'European fashion market',
        },
        {
          id: '2',
          name: 'Tech Marketplace',
          country: 'Germany',
          address: 'Berlin, Germany',
          company_info: 'E-commerce platform',
          activities: 'Online marketplace for retail',
          target_markets: 'Global e-commerce',
        },
      ];
    }

    // Filter for pants candidates
    const candidates = exhibitors
      .map((exhibitor) => {
        const computed = computeFields(
          exhibitor.name,
          exhibitor.country,
          exhibitor.address,
          exhibitor.company_info,
          exhibitor.activities,
          exhibitor.target_markets
        );

        return {
          id: exhibitor.id,
          name: exhibitor.name,
          country: exhibitor.country,
          address: exhibitor.address,
          company_info: exhibitor.company_info,
          activities: exhibitor.activities,
          target_markets: exhibitor.target_markets,
          ...computed,
        };
      })
      .filter((item) => item.pants_candidate);

    return NextResponse.json({
      count: candidates.length,
      items: candidates,
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}