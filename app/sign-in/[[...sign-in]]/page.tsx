import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/brama-logo.jpeg"
              alt="BRAMA by Techosystem"
              width={120}
              height={120}
              className="rounded-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white">BRAMA Hub</h1>
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
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-300 text-sm font-medium">🔒 Access is by invitation only.</p>
          <p className="text-gray-400 text-sm">
            Interested in Ukrainian startups?{' '}
            <a
              href="https://techosystem.org/en/vcc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Learn more about BRAMA Hub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
