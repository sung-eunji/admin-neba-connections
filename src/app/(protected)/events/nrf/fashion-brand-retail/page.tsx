'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ExhibitorWithComputed,
  FacetCount,
} from '@/app/api/events/nrf/exhibitors/route';

interface ExhibitorsData {
  total: number;
  items: ExhibitorWithComputed[];
  facets: {
    byCountry: FacetCount[];
    byCategory: FacetCount[];
  };
}

export default function FashionBrandRetailPage() {
  const [all, setAll] = useState<ExhibitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtered, setFiltered] = useState<ExhibitorWithComputed[]>([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ take: '1000', page: '1' });
        const res = await fetch(
          `/api/events/nrf/exhibitors?${params.toString()}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || err?.details || `HTTP ${res.status}`);
        }
        const data: ExhibitorsData = await res.json();
        setAll(data);
        setFiltered(
          (data.items || []).filter(
            (it) => it.category_tag === 'fashion_brand_retail'
          )
        );
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((it) => {
      if (it.country) set.add(it.country);
    });
    return ['all', ...Array.from(set).sort()];
  }, [filtered]);

  function computeLeadScore(it: ExhibitorWithComputed): number {
    let score = 0;
    if (it.pants_candidate) score += 30;
    if (it.is_france) score += 20;
    if (it.booth) score += 10;
    if (it.linkedin_url) score += 10;
    if (it.website_url) score += 5;
    // Keyword bumps
    const text = [it.activities, it.company_info, it.target_markets]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const keywords = ['apparel', 'retail', 'brand', 'fashion', 'boutique'];
    keywords.forEach((k) => {
      if (text.includes(k)) score += 3;
    });
    return score;
  }

  const visible = useMemo(() => {
    let list = filtered;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((it) => {
        const t = [
          it.name,
          it.country,
          it.address,
          it.company_info,
          it.activities,
          it.target_markets,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return t.includes(q);
      });
    }
    if (country !== 'all') {
      list = list.filter((it) => (it.country || '') === country);
    }
    if (onlyCandidates) {
      list = list.filter((it) => it.pants_candidate);
    }
    if (sortBy === 'score') {
      list = [...list].sort(
        (a, b) => computeLeadScore(b) - computeLeadScore(a)
      );
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filtered, search, country, onlyCandidates, sortBy]);

  function downloadCSV() {
    const rows = [
      [
        'Name',
        'Country',
        'Booth',
        'Address',
        'Activities',
        'Company Info',
        'Website',
        'LinkedIn',
        'Lead Score',
      ],
      ...visible.map((ex) => [
        ex.name,
        ex.country || '',
        ex.booth || '',
        (ex.address || '').replace(/\n/g, ' '),
        (ex.activities || '').replace(/\n/g, ' '),
        (ex.company_info || '').replace(/\n/g, ' '),
        ex.website_url || '',
        ex.linkedin_url || '',
        String(computeLeadScore(ex)),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fashion_brand_retail_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !all) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">
            Loading Fashion Brand Retail companies...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Fashion Brand Retail
        </h1>
        <p className="text-gray-600 mt-1">
          Strategic targets for wholesale pants outreach
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, activities, markets..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? '🌍 All' : c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Lead score (desc)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-2">
            <label className="inline-flex items-center text-sm">
              <input
                type="checkbox"
                checked={onlyCandidates}
                onChange={(e) => setOnlyCandidates(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Only pants candidates
            </label>
            <button
              onClick={downloadCSV}
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="text-sm text-gray-700">
          Total loaded: {all?.total ?? 0} • In category: {filtered.length} •
          Showing: {visible.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visible.map((ex) => (
          <div key={ex.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {ex.name}
                </h3>
                <div className="mt-1 text-sm text-gray-600 flex items-center flex-wrap gap-2">
                  <span className="mr-2">
                    {ex.country || 'Unknown country'}
                  </span>
                  {ex.booth && (
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 ml-2">
                      Booth: {ex.booth}
                    </span>
                  )}
                  <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Lead score: {computeLeadScore(ex)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {ex.website_url && (
                  <a
                    href={ex.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    title="Website"
                  >
                    🌐
                  </a>
                )}
                {ex.linkedin_url && (
                  <a
                    href={ex.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    title="LinkedIn"
                  >
                    💼
                  </a>
                )}
              </div>
            </div>

            {/* Mobile-friendly collapsible details */}
            <details className="mt-3 md:hidden">
              <summary className="cursor-pointer text-sm text-blue-700">
                Details
              </summary>
              {ex.address && (
                <div className="mt-2">
                  <h4 className="font-medium text-gray-900">Address</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.address}
                  </p>
                </div>
              )}
              {ex.activities && (
                <div className="mt-2">
                  <h4 className="font-medium text-gray-900">Activities</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.activities}
                  </p>
                </div>
              )}
              {ex.company_info && (
                <div className="mt-2">
                  <h4 className="font-medium text-gray-900">Company Info</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.company_info}
                  </p>
                </div>
              )}
            </details>

            {/* Desktop expanded details */}
            <div className="hidden md:block">
              {ex.address && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900">Address</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.address}
                  </p>
                </div>
              )}
              {ex.activities && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900">Activities</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.activities}
                  </p>
                </div>
              )}
              {ex.company_info && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900">Company Info</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {ex.company_info}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No companies found.
        </div>
      )}
    </div>
  );
}
