"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Search } from "lucide-react";

export default function HomePortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/wiki");
  };

  const spawnHearts = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement("div");
      heart.innerText = "❤️";
      heart.style.position = "fixed";
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top + rect.height / 2}px`;
      heart.style.pointerEvents = "none";
      heart.style.fontSize = `${Math.random() * 12 + 12}px`;
      heart.style.zIndex = "9999";
      heart.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      
      const angle = (Math.random() * Math.PI) - Math.PI; // Upward fountain
      const velocity = Math.random() * 80 + 50;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity - 30; // Extra upward float

      document.body.appendChild(heart);
      heart.getBoundingClientRect();

      heart.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      heart.style.opacity = "0";

      setTimeout(() => {
        heart.remove();
      }, 800);
    }
  };

  const categories = [
    { name: "Academics", path: "/wiki" },
    { name: "Hostels", path: "/wiki" },
    { name: "Clubs", path: "/wiki" },
    { name: "Research", path: "/wiki" },
    { name: "Map", path: "/wiki" },
    { name: "Careers", path: "/wiki" },
    { name: "Services", path: "/wiki" },
    { name: "History", path: "/wiki" },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-screen overflow-x-hidden bg-white select-none">
      {/* Left Column: Navigation & Search Portal */}
      <aside className="w-full lg:w-[400px] border-r border-gray-100 flex flex-col p-8 md:p-12 shrink-0 bg-white z-10 gap-6 overflow-y-auto h-auto lg:h-screen">
        
        {/* Brand Crest (Untouched at the top) */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 bg-gray-950 text-white rounded-full flex items-center justify-center font-display font-black text-4xl shadow-lg cursor-pointer hover:scale-135 transition-transform duration-300">
            mI
          </div>
          
          <div className="text-center mt-8">
            <span className="block text-2xl font-sans font-extrabold text-gray-800 tracking-tight">1,248</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1.5 block">
              articles & campus pages
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="my-4 w-full">
          <div className="relative flex items-center h-12 bg-slate-50 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] rounded-full px-5 transition-all focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100/50">
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 placeholder:font-semibold placeholder:tracking-widest bg-transparent focus:outline-none h-full pr-10"
            />
            <button
              type="submit"
              className="absolute right-5 text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Photo and tagline text from image (Shown below search bar on mobile screens) */}
        <div className="lg:hidden w-auto -mx-8 md:-mx-12 h-[480px] md:h-[580px] overflow-hidden relative shadow-sm flex-shrink-0 flex items-center justify-center">
          {/* Background Image - Zoomed in further */}
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-150"
            style={{ backgroundImage: `url('/homepage_bg.png')` }}
          />
          {/* Tagline overlay styled exactly like desktop */}
          <div className="relative z-10 flex flex-col items-center text-center w-full px-6">
            <h2 className="text-6xl md:text-7xl font-display font-bold tracking-tight text-white mb-3 leading-none">
              Welcome to <br/> meta IITGN
            </h2>
            <p className="text-lg md:text-xl font-sans font-medium text-white/95 tracking-wide mt-2 w-full max-w-md border-t border-white/20 pt-3">
              the collaborative campus encyclopedia that anyone can edit.
            </p>
          </div>
        </div>

        {/* Bottom Footer Block */}
        <div className="flex flex-col gap-6 mt-4 lg:mt-auto">
          {/* Categories / Knowledge Branches */}
          <div className="flex flex-col gap-6">
            <nav className="grid grid-cols-2 gap-y-3 gap-x-4">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.path}
                  className="text-sm font-sans font-semibold text-gray-600 hover:text-indigo-600 hover:translate-x-0.5 transition-all duration-150"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
            
            <div className="border-t border-gray-100 pt-4">
              <Link
                href="/wiki"
                className="text-xs font-sans font-extrabold tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors uppercase"
              >
                BROWSE ALL
              </Link>
            </div>
          </div>

          {/* Credits */}
          <div className="text-xs text-gray-400 font-medium font-sans flex flex-col items-start gap-2 pt-4 border-t border-gray-100">
            <span>Made with</span>
            <Heart 
              onClick={spawnHearts}
              className="w-9 h-9 text-red-500 fill-red-500 my-0.5 cursor-pointer hover:scale-160 origin-left transition-transform duration-200" 
            />
            <span>by <span className="font-semibold text-gray-600">Technical Council, IITGN</span></span>
          </div>

          {/* Footer info */}
          <div className="text-[10px] text-gray-400 font-medium pt-2 border-t border-gray-100">
            © {new Date().getFullYear()} meta IITGN · Technical Council IITGN
          </div>
        </div>
      </aside>

      {/* Right Column: Immersive visual backdrop (Desktop only) */}
      <main className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/homepage_bg.png')` }}
        />

        {/* Huge Semi-Transparent letter W */}
        <div className="absolute right-0 bottom-0 select-none pointer-events-none text-[70vw] font-display font-black text-white/[0.04] leading-none translate-x-[15%] translate-y-[20%] font-extralight">
          M
        </div>

        {/* Centered Welcome Content */}
        <div className="relative text-center text-white px-8 max-w-4xl z-10 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white mb-6 leading-none">
            Welcome to <br/> meta IITGN
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl font-sans font-medium text-white/95 tracking-wide mt-4 max-w-2xl border-t border-white/20 pt-6">
            the collaborative campus encyclopedia that anyone can edit.
          </p>
        </div>
      </main>
    </div>
  );
}
