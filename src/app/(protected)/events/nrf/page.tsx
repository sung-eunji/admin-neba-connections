'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/lib/hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CategoryTag,
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

export default function NRFExhibitorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExhibitor, setSelectedExhibitor] =
    useState<ExhibitorWithComputed | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryExhibitors, setCategoryExhibitors] = useState<
    ExhibitorWithComputed[]
  >([]);

  const [data, setData] = useState<ExhibitorsData | null>(null);
  const [allExhibitors, setAllExhibitors] = useState<ExhibitorWithComputed[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchData = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setCurrentPage(1);
        setAllExhibitors([]);
      }

      const params = new URLSearchParams({
        q: debouncedSearchQuery,
        country: selectedCountry,
        candidate: onlyCandidates ? '1' : '0',
        take: '50', // 페이지당 50개씩 로드
        page: isLoadMore ? (currentPage + 1).toString() : '1',
      });

      const response = await fetch(`/api/events/nrf/exhibitors?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
        });
        throw new Error(
          `API Error ${response.status}: ${
            errorData.details || errorData.error || response.statusText
          }`
        );
      }

      const result = await response.json();

      if (isLoadMore) {
        setAllExhibitors((prev) => [...prev, ...result.items]);
        setCurrentPage((prev) => prev + 1);
        setHasMore(result.items.length === 50);
      } else {
        setData(result);
        setAllExhibitors(result.items);
        setCurrentPage(1);
        setHasMore(result.items.length === 50);
      }

      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearchQuery, selectedCountry, onlyCandidates]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setCurrentPage(1);
  };

  const handleCandidateToggle = () => {
    setOnlyCandidates(!onlyCandidates);
    setCurrentPage(1);
  };

  const handleCategoryClick = (category: string | unknown) => {
    if (!data || typeof category !== 'string') return;

    // 해당 카테고리의 전시자들을 필터링
    const filteredExhibitors = allExhibitors.filter(
      (exhibitor) => exhibitor.category_tag === category
    );

    setSelectedCategory(category);
    setCategoryExhibitors(filteredExhibitors);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // 스크롤이 하단 근처에 도달했을 때
    if (
      scrollHeight - scrollTop <= clientHeight + 100 &&
      hasMore &&
      !loadingMore
    ) {
      fetchData(true);
    }
  };

  const formatCategoryName = (category: string | unknown): string => {
    if (typeof category !== 'string') {
      return 'Unknown';
    }
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const extractCountryName = (address: string): string => {
    if (!address) return 'Unknown';

    // 주소에서 마지막 단어(국가명) 추출
    const parts = address.trim().split(' ');
    const lastPart = parts[parts.length - 1];

    // 알려진 국가명 매핑
    const countryMap: Record<string, string> = {
      FRANCE: 'France',
      SPAIN: 'Spain',
      ITALY: 'Italy',
      NETHERLANDS: 'Netherlands',
      CHINA: 'China',
      TAIWAN: 'Taiwan',
      UNITED: 'United States', // "UNITED STATES"의 경우
      STATES: 'United States',
      ROMANIA: 'Romania',
    };

    return countryMap[lastPart] || lastPart;
  };

  const getCountryFlag = (address: string): string => {
    const countryName = extractCountryName(address);

    const flagMap: Record<string, string> = {
      France: '🇫🇷',
      Germany: '🇩🇪',
      'United Kingdom': '🇬🇧',
      UK: '🇬🇧',
      Italy: '🇮🇹',
      Spain: '🇪🇸',
      Netherlands: '🇳🇱',
      Belgium: '🇧🇪',
      Switzerland: '🇨🇭',
      Austria: '🇦🇹',
      Sweden: '🇸🇪',
      Norway: '🇳🇴',
      Denmark: '🇩🇰',
      Finland: '🇫🇮',
      Poland: '🇵🇱',
      'Czech Republic': '🇨🇿',
      Hungary: '🇭🇺',
      Portugal: '🇵🇹',
      Ireland: '🇮🇪',
      Greece: '🇬🇷',
      Turkey: '🇹🇷',
      'United States': '🇺🇸',
      USA: '🇺🇸',
      Canada: '🇨🇦',
      Japan: '🇯🇵',
      China: '🇨🇳',
      'South Korea': '🇰🇷',
      India: '🇮🇳',
      Brazil: '🇧🇷',
      Australia: '🇦🇺',
      Mexico: '🇲🇽',
      Russia: '🇷🇺',
      Israel: '🇮🇱',
      'South Africa': '🇿🇦',
      Singapore: '🇸🇬',
      Thailand: '🇹🇭',
      Malaysia: '🇲🇾',
      Indonesia: '🇮🇩',
      Philippines: '🇵🇭',
      Vietnam: '🇻🇳',
      Taiwan: '🇹🇼',
      'Hong Kong': '🇭🇰',
      'New Zealand': '🇳🇿',
      Chile: '🇨🇱',
      Argentina: '🇦🇷',
      Colombia: '🇨🇴',
      Peru: '🇵🇪',
      Uruguay: '🇺🇾',
      Ecuador: '🇪🇨',
      Venezuela: '🇻🇪',
      Egypt: '🇪🇬',
      Morocco: '🇲🇦',
      Nigeria: '🇳🇬',
      Kenya: '🇰🇪',
      Ghana: '🇬🇭',
      Ethiopia: '🇪🇹',
      Tanzania: '🇹🇿',
      Uganda: '🇺🇬',
      Rwanda: '🇷🇼',
      Senegal: '🇸🇳',
      'Ivory Coast': '🇨🇮',
      Cameroon: '🇨🇲',
      Madagascar: '🇲🇬',
      Mali: '🇲🇱',
      'Burkina Faso': '🇧🇫',
      Niger: '🇳🇪',
      Chad: '🇹🇩',
      Sudan: '🇸🇩',
      'South Sudan': '🇸🇸',
      'Central African Republic': '🇨🇫',
      'Democratic Republic of the Congo': '🇨🇩',
      'Republic of the Congo': '🇨🇬',
      Gabon: '🇬🇦',
      'Equatorial Guinea': '🇬🇶',
      'Sao Tome and Principe': '🇸🇹',
      Angola: '🇦🇴',
      Zambia: '🇿🇲',
      Zimbabwe: '🇿🇼',
      Botswana: '🇧🇼',
      Namibia: '🇳🇦',
      Lesotho: '🇱🇸',
      Swaziland: '🇸🇿',
      Malawi: '🇲🇼',
      Mozambique: '🇲🇿',
      Comoros: '🇰🇲',
      Seychelles: '🇸🇨',
      Mauritius: '🇲🇺',
      Reunion: '🇷🇪',
      Mayotte: '🇾🇹',
      Djibouti: '🇩🇯',
      Somalia: '🇸🇴',
      Eritrea: '🇪🇷',
      Libya: '🇱🇾',
      Tunisia: '🇹🇳',
      Algeria: '🇩🇿',
      Lebanon: '🇱🇧',
      Syria: '🇸🇾',
      Jordan: '🇯🇴',
      Iraq: '🇮🇶',
      Iran: '🇮🇷',
      Afghanistan: '🇦🇫',
      Pakistan: '🇵🇰',
      Bangladesh: '🇧🇩',
      'Sri Lanka': '🇱🇰',
      Maldives: '🇲🇻',
      Nepal: '🇳🇵',
      Bhutan: '🇧🇹',
      Myanmar: '🇲🇲',
      Laos: '🇱🇦',
      Cambodia: '🇰🇭',
      Brunei: '🇧🇳',
      'East Timor': '🇹🇱',
      'Papua New Guinea': '🇵🇬',
      Fiji: '🇫🇯',
      'Solomon Islands': '🇸🇧',
      Vanuatu: '🇻🇺',
      Samoa: '🇼🇸',
      Tonga: '🇹🇴',
      Kiribati: '🇰🇮',
      Tuvalu: '🇹🇻',
      Nauru: '🇳🇷',
      Palau: '🇵🇼',
      'Marshall Islands': '🇲🇭',
      Micronesia: '🇫🇲',
      'Cook Islands': '🇨🇰',
      Niue: '🇳🇺',
      Tokelau: '🇹🇰',
      'American Samoa': '🇦🇸',
      Guam: '🇬🇺',
      'Northern Mariana Islands': '🇲🇵',
      'Puerto Rico': '🇵🇷',
      'US Virgin Islands': '🇻🇮',
      'British Virgin Islands': '🇻🇬',
      Anguilla: '🇦🇮',
      Montserrat: '🇲🇸',
      'Saint Kitts and Nevis': '🇰🇳',
      'Antigua and Barbuda': '🇦🇬',
      Dominica: '🇩🇲',
      'Saint Lucia': '🇱🇨',
      'Saint Vincent and the Grenadines': '🇻🇨',
      Grenada: '🇬🇩',
      Barbados: '🇧🇧',
      'Trinidad and Tobago': '🇹🇹',
      Jamaica: '🇯🇲',
      Cuba: '🇨🇺',
      Haiti: '🇭🇹',
      'Dominican Republic': '🇩🇴',
      Bahamas: '🇧🇸',
      Belize: '🇧🇿',
      'Costa Rica': '🇨🇷',
      'El Salvador': '🇸🇻',
      Guatemala: '🇬🇹',
      Honduras: '🇭🇳',
      Nicaragua: '🇳🇮',
      Panama: '🇵🇦',
      Guyana: '🇬🇾',
      Suriname: '🇸🇷',
      'French Guiana': '🇬🇫',
      Bolivia: '🇧🇴',
      Paraguay: '🇵🇾',
      'French Polynesia': '🇵🇫',
      'New Caledonia': '🇳🇨',
      'Wallis and Futuna': '🇼🇫',
      'French Southern Territories': '🇹🇫',
      'Saint Pierre and Miquelon': '🇵🇲',
      Greenland: '🇬🇱',
      'Faroe Islands': '🇫🇴',
      Iceland: '🇮🇸',
      Liechtenstein: '🇱🇮',
      Monaco: '🇲🇨',
      'San Marino': '🇸🇲',
      'Vatican City': '🇻🇦',
      Andorra: '🇦🇩',
      Malta: '🇲🇹',
      Cyprus: '🇨🇾',
      Luxembourg: '🇱🇺',
      Estonia: '🇪🇪',
      Latvia: '🇱🇻',
      Lithuania: '🇱🇹',
      Slovenia: '🇸🇮',
      Slovakia: '🇸🇰',
      Croatia: '🇭🇷',
      'Bosnia and Herzegovina': '🇧🇦',
      Serbia: '🇷🇸',
      Montenegro: '🇲🇪',
      'North Macedonia': '🇲🇰',
      Albania: '🇦🇱',
      Kosovo: '🇽🇰',
      Moldova: '🇲🇩',
      Romania: '🇷🇴',
      Bulgaria: '🇧🇬',
      Ukraine: '🇺🇦',
      Belarus: '🇧🇾',
      Georgia: '🇬🇪',
      Armenia: '🇦🇲',
      Azerbaijan: '🇦🇿',
      Kazakhstan: '🇰🇿',
      Uzbekistan: '🇺🇿',
      Turkmenistan: '🇹🇲',
      Tajikistan: '🇹🇯',
      Kyrgyzstan: '🇰🇬',
      Mongolia: '🇲🇳',
      'North Korea': '🇰🇵',
      Macau: '🇲🇴',
      Unknown: '❓',
    };

    return flagMap[countryName] || '🌍';
  };

  const getKPIs = () => {
    if (!data)
      return { total: 0, france: 0, topCategory: { name: '', count: 0 } };

    const france = data.items.filter((item) => item.is_france).length;
    const topCategory = data.facets.byCategory[0] || {
      value: 'other',
      count: 0,
    };

    return {
      total: data.total,
      france,
      topCategory: {
        name: formatCategoryName(topCategory.value),
        count: topCategory.count,
      },
    };
  };

  const kpis = getKPIs();

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading exhibitors data...</div>
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
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              NRF Europe 2025 — Exhibitors Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Explore and analyze exhibitor data from all countries for B2B
              opportunities
            </p>
          </div>
          <div className="mt-2">
            <Link
              href="/events/nrf/fashion-brand-retail"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              View Fashion Brand Retail
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🌍 All Countries</option>
              {data?.facets.byCountry.map((country) => (
                <option key={country.value} value={country.value}>
                  {getCountryFlag(country.value)}{' '}
                  {extractCountryName(country.value)} ({country.count})
                </option>
              ))}
            </select>
          </div>

          {/* Candidate Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={onlyCandidates}
                onChange={handleCandidateToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Only pants candidates
              </span>
            </label>
          </div>

          {/* Refresh */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
                setOnlyCandidates(false);
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-gray-900">{kpis.total}</div>
          <div className="text-sm text-gray-600">Total Exhibitors</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-blue-600">{kpis.france}</div>
          <div className="text-sm text-gray-600">France-based</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-green-600">
            {kpis.topCategory.count}
          </div>
          <div className="text-sm text-gray-600">
            {kpis.topCategory.name || 'Top Category'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Country Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exhibitors by Country
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.facets.byCountry || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="value"
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) =>
                  `${getCountryFlag(value)} ${extractCountryName(value)}`
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  `${getCountryFlag(value)} ${extractCountryName(value)}`
                }
              />
              <Bar dataKey="count" fill="#3B82F6" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exhibitors by Category
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Click bars to view companies)
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.facets.byCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="value"
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={formatCategoryName}
              />
              <YAxis />
              <Tooltip labelFormatter={(value) => formatCategoryName(value)} />
              <Bar
                dataKey="count"
                fill="#10B981"
                fillOpacity={0.8}
                onClick={(data) => {
                  if (data && data.value) {
                    handleCategoryClick(data.value);
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Exhibitors ({allExhibitors.length} loaded)
          </h3>
        </div>

        <div className="overflow-auto max-h-[600px]" onScroll={handleScroll}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🇫🇷
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crawled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allExhibitors.map((exhibitor) => (
                <tr
                  key={exhibitor.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedExhibitor(exhibitor)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {exhibitor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <span className="mr-2">
                        {getCountryFlag(exhibitor.country || 'Unknown')}
                      </span>
                      {extractCountryName(exhibitor.country || 'Unknown')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {exhibitor.booth || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatCategoryName(exhibitor.category_tag)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {exhibitor.is_france && <span className="text-lg">🇫🇷</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {exhibitor.pants_candidate && (
                      <span className="text-green-600">✅</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {exhibitor.website_url && (
                        <a
                          href={exhibitor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🌐
                        </a>
                      )}
                      {exhibitor.linkedin_url && (
                        <a
                          href={exhibitor.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          💼
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exhibitor.crawled_at
                      ? new Date(exhibitor.crawled_at).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loadingMore && (
            <div className="text-center py-4 text-gray-500">
              Loading more exhibitors...
            </div>
          )}

          {!hasMore && allExhibitors.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              All exhibitors loaded
            </div>
          )}
        </div>

        {allExhibitors.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No exhibitors found matching your criteria.
          </div>
        )}
      </div>

      {/* Side Panel */}
      {selectedExhibitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedExhibitor.name}
              </h3>
              <button
                onClick={() => setSelectedExhibitor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {selectedExhibitor.address && (
                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-gray-600">{selectedExhibitor.address}</p>
                  </div>
                )}

                {selectedExhibitor.email && (
                  <div>
                    <h4 className="font-medium text-gray-900">Email</h4>
                    <p className="text-gray-600">{selectedExhibitor.email}</p>
                  </div>
                )}

                {selectedExhibitor.activities && (
                  <div>
                    <h4 className="font-medium text-gray-900">Activities</h4>
                    <p className="text-gray-600">
                      {selectedExhibitor.activities}
                    </p>
                  </div>
                )}

                {selectedExhibitor.target_markets && (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Target Markets
                    </h4>
                    <p className="text-gray-600">
                      {selectedExhibitor.target_markets}
                    </p>
                  </div>
                )}

                {selectedExhibitor.press_release && (
                  <div>
                    <h4 className="font-medium text-gray-900">Press Release</h4>
                    <p className="text-gray-600">
                      {selectedExhibitor.press_release}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatCategoryName(selectedCategory)} -{' '}
                {categoryExhibitors.length} Companies
              </h3>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryExhibitors([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {categoryExhibitors.map((exhibitor) => (
                  <div
                    key={exhibitor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedExhibitor(exhibitor)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-lg">
                          {exhibitor.name}
                        </h4>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-1">
                              {getCountryFlag(exhibitor.country || 'Unknown')}
                            </span>
                            {extractCountryName(exhibitor.country || 'Unknown')}
                          </div>
                          {exhibitor.booth && (
                            <div>Booth: {exhibitor.booth}</div>
                          )}
                          {exhibitor.is_france && (
                            <div className="text-blue-600">🇫🇷 France</div>
                          )}
                          {exhibitor.pants_candidate && (
                            <div className="text-green-600">✅ Candidate</div>
                          )}
                        </div>
                        {exhibitor.activities && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {exhibitor.activities}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {exhibitor.website_url && (
                          <a
                            href={exhibitor.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐
                          </a>
                        )}
                        {exhibitor.linkedin_url && (
                          <a
                            href={exhibitor.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            💼
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
