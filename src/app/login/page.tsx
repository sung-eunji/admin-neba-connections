import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginForm from './login-form';
import Image from 'next/image';

export default function LoginPage() {
  // Check if already logged in
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('neba_admin');

  if (adminCookie?.value) {
    redirect('/events/nrf');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/NC-logo.png"
            alt="Neba Connections"
            width={200}
            height={200}
          />
        </div>
        {/* <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Neba Connections Admin
        </h2> */}
        {/* <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the exhibitor dashboard
        </p> */}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
