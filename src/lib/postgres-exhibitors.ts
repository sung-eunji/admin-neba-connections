import { query, queryCount } from './postgres';

export interface PostgresExhibitor {
  id: string;
  name: string;
  country: string | null;
  address: string | null;
  phone: string | null;
  booth: string | null;
  highlights: string | null;
  company_info: string | null;
  activities: string | null;
  target_markets: string | null;
  star_products: string | null;
  press_release: string | null;
  email: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  crawled_at: Date;
}

// Get exhibitors with search and pagination
export async function getPostgresExhibitors(
  searchQuery?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: PostgresExhibitor[]; total: number }> {
  try {
    let whereClause = '';
    let params: unknown[] = [];
    
    if (searchQuery) {
      whereClause = `WHERE 
        name ILIKE $1 OR 
        company_info ILIKE $1 OR 
        activities ILIKE $1 OR 
        target_markets ILIKE $1`;
      params = [`%${searchQuery}%`];
    }
    
    // Get total count
    const totalResult = await queryCount(
      `SELECT COUNT(*) FROM exhibitors_prw_2025 ${whereClause}`,
      params
    );
    
    // Get items
    const items = await query<PostgresExhibitor>(
      `SELECT * FROM exhibitors_prw_2025 
       ${whereClause} 
       ORDER BY crawled_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    
    return {
      items: items.map(item => ({
        ...item,
        crawled_at: item.crawled_at,
      })),
      total: totalResult,
    };
  } catch (error) {
    console.error('Error fetching exhibitors:', error);
    return { items: [], total: 0 };
  }
}

// Get exhibitor statistics
export async function getPostgresExhibitorStats(): Promise<{
  total: number;
  byCountry: Array<{ country: string; count: number }>;
}> {
  try {
    const total = await queryCount('SELECT COUNT(*) FROM exhibitors_prw_2025');
    
    const countryStats = await query<{ country: string | null; count: string }>(
      `SELECT country, COUNT(*) as count 
       FROM exhibitors_prw_2025 
       GROUP BY country 
       ORDER BY COUNT(*) DESC 
       LIMIT 10`
    );
    
    return {
      total,
      byCountry: countryStats.map(stat => ({
        country: stat.country || 'Unknown',
        count: parseInt(stat.count),
      })),
    };
  } catch (error) {
    console.error('Error fetching exhibitor stats:', error);
    return { total: 0, byCountry: [] };
  }
}

// Get France-only exhibitors
export async function getPostgresFranceExhibitors(
  searchQuery?: string,
  limit: number = 50
): Promise<PostgresExhibitor[]> {
  try {
    let whereClause = `WHERE 
      country ILIKE '%france%' OR 
      address ILIKE '%france%' OR 
      address ILIKE '%paris%' OR 
      address ILIKE '%lyon%' OR 
      address ILIKE '%marseille%' OR 
      company_info ILIKE '%france%'`;
    
    let params: unknown[] = [];
    
    if (searchQuery) {
      whereClause += ` AND (
        name ILIKE $1 OR 
        company_info ILIKE $1 OR 
        activities ILIKE $1 OR 
        target_markets ILIKE $1
      )`;
      params = [`%${searchQuery}%`];
    }
    
    const items = await query<PostgresExhibitor>(
      `SELECT * FROM exhibitors_prw_2025 
       ${whereClause} 
       ORDER BY crawled_at DESC 
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    
    return items;
  } catch (error) {
    console.error('Error fetching France exhibitors:', error);
    return [];
  }
}
