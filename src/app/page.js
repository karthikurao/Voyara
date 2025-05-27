import Header from "@/components/Header";
import GeneratorForm from "@/components/GeneratorForm";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
            Craft Your Perfect Weekend
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Tell us your destination and vibe. Our AI will handle the rest.
          </p>
        </div>

        <div className="mt-12 w-full">
          <GeneratorForm />
        </div>
        
      </main>
    </>
  );
}