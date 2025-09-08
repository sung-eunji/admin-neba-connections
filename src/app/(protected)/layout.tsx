import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './logout-button';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check authentication (middleware should handle this, but extra safety)
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('neba_admin');

  if (!adminCookie || !adminCookie.value) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation and logout button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Neba Connections Admin
              </h1>
              <p className="text-gray-600 mt-1">
                Internal dashboard for B2B event analysis
              </p>
            </div>
            <LogoutButton />
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex space-x-8">
            <Link
              href="/events/nrf"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              NRF Dashboard
            </Link>
            <Link
              href="/admin-users"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Admin Users
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
