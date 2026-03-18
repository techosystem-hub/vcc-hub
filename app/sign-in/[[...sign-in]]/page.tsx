import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 text-white text-2xl font-bold mb-4">
            TV
          </div>
          <h1 className="text-2xl font-bold text-white">VCC Intelligence Hub</h1>
          <p className="text-gray-400 mt-1 text-sm">Techosystem VC Committee — Members only</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-2xl rounded-2xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
            },
          }}
        />
      </div>
    </div>
  );
}
