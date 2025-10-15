import { SparklesCore } from "../components/ui/sparkles";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[calc(100vh-8rem)] overflow-hidden rounded-md">
      <div className="absolute inset-0 w-full h-full bg-black">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <div className="relative z-20 flex flex-col items-center justify-center text-center">
        <h1 className="md:text-7xl text-5xl lg:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Oracle Forge
        </h1>
        <p className="mt-4 text-lg md:text-2xl text-neutral-300 max-w-2xl">
          The ultimate platform to create, share, and explore custom divination decks. Your journey into personalized spirituality starts here.
        </p>
        <div className="mt-8 flex gap-4">
            <button className="px-6 py-2 font-medium bg-indigo-500 text-white w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]">
                Start Your Journey
            </button>
            <button className="px-6 py-2 font-medium bg-gray-700 text-gray-200 w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]">
                Learn More
            </button>
        </div>
      </div>
    </div>
  );
}
