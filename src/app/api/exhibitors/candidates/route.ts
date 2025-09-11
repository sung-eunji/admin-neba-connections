import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
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

    // Get all exhibitors
    const exhibitors = await prisma.exhibitors_prw_2025.findMany({
      take,
      orderBy: { name: 'asc' },
    });

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
          id: exhibitor.id.toString(),
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

