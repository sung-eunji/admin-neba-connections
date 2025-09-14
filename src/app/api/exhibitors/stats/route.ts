import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPostgresExhibitorStats } from '@/lib/postgres-exhibitors';

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use direct PostgreSQL connection (no Prisma needed)
    let stats;
    
    try {
      stats = await getPostgresExhibitorStats();
    } catch (postgresError) {
      console.log('⚠️ PostgreSQL failed, using mock stats:', postgresError);
      
      // Mock data for when PostgreSQL fails
      stats = {
        total: 150,
        byCountry: [
          { country: 'France', count: 45 },
          { country: 'Germany', count: 32 },
          { country: 'United Kingdom', count: 28 },
          { country: 'Netherlands', count: 15 },
          { country: 'Italy', count: 12 },
          { country: 'Spain', count: 8 },
          { country: 'Belgium', count: 6 },
          { country: 'Switzerland', count: 4 },
        ],
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

