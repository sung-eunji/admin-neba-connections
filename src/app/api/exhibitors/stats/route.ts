import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic statistics
    const totalExhibitors = await prisma.exhibitors_prw_2025.count();
    
    const countryStats = await prisma.exhibitors_prw_2025.groupBy({
      by: ['country'],
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
      take: 10,
    });

    const stats = {
      total: totalExhibitors,
      byCountry: countryStats.map(stat => ({
        country: stat.country || 'Unknown',
        count: stat._count.country,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

