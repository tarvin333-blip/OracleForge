import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[calc(100vh-8rem)] overflow-hidden rounded-md bg-black">
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-4">
        <h1 className="md:text-7xl text-5xl lg:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Oracle Forge
        </h1>
        <p className="mt-4 text-lg md:text-2xl text-neutral-300 max-w-2xl">
          The ultimate platform to create, share, and explore custom divination decks. Your journey into personalized spirituality starts here.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/studio" passHref>
              <button className="px-8 py-3 font-semibold bg-indigo-600 text-white w-full sm:w-fit transition-all duration-300 rounded-lg shadow-[3px_3px_0px_rgba(168,85,247,0.5)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-indigo-700">
                  Start Your Journey
              </button>
            </Link>
            <button className="px-8 py-3 font-medium bg-gray-800 text-gray-300 w-full sm:w-fit transition-all duration-300 rounded-lg shadow-[3px_3px_0px_rgba(107,114,128,0.4)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-gray-700">
                Learn More
            </button>
        </div>
      </div>
    </div>
  );
}
