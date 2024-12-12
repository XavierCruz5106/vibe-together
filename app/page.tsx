import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl font-bold mb-8">Vibe</h1>
      <p className="text-2xl mb-8">Connect and share your music taste with friends</p>
      <Link href="/login" className="bg-white text-green-500 px-6 py-3 rounded-full text-xl font-semibold hover:bg-opacity-90 transition duration-300">
        Get Started
      </Link>
    </div>
  );
}

