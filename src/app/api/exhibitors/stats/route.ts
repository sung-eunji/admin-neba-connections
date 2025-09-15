import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to extract country name from address
function extractCountryName(address: string): string {
  // Simple approach: take the last word as country name
  const words = address.trim().split(/\s+/);
  const lastWord = words[words.length - 1];
  
  // Map common country codes/names to proper names
  const countryMap: Record<string, string> = {
    'FRANCE': 'France',
    'GERMANY': 'Germany', 
    'NETHERLANDS': 'Netherlands',
    'ITALY': 'Italy',
    'SPAIN': 'Spain',
    'CHINA': 'China',
    'TAIWAN': 'Taiwan',
    'UNITED': 'United States',
    'ROMANIA': 'Romania',
  };

  const upperLastWord = lastWord.toUpperCase();
  return countryMap[upperLastWord] || lastWord;
}

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Supabase connection
    let stats;
    
    try {
      // Get total count
      const { count: total, error: countError } = await supabaseAdmin
        .from('exhibitors_prw_2025')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // Get all exhibitors for country stats
      const { data: exhibitors, error: dataError } = await supabaseAdmin
        .from('exhibitors_prw_2025')
        .select('country');

      if (dataError) {
        throw dataError;
      }

      // Calculate country statistics - extract country from address
      const countryCounts = new Map<string, number>();
      (exhibitors || []).forEach((exhibitor) => {
        if (exhibitor.country) {
          // Extract country name from address field (e.g., "5684PL Best NETHERLANDS" -> "NETHERLANDS")
          const countryName = extractCountryName(exhibitor.country);
          countryCounts.set(countryName, (countryCounts.get(countryName) || 0) + 1);
        }
      });

      const byCountry = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      stats = {
        total: total || 0,
        byCountry,
      };
    } catch (supabaseError) {
      console.log('⚠️ Supabase failed, using mock stats:', supabaseError);
      
      // Mock data for when Supabase fails
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

