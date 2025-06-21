import SigninForm from '@/components/signin-form';

export default function SigninPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <SigninForm />
      </div>
    </div>
  );
}
