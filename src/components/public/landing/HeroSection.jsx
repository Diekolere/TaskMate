import { Link } from 'react-router-dom';
import Reveal from './Reveal';

const HeroSection = () => {
  return (
    <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 px-6 w-full flex flex-col items-center text-center bg-[#1a2b3c] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2000&auto=format&fit=crop" alt="Group of Artisans" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1a2b3c]/85 backdrop-blur-[1px]"></div>
      </div>

      <Reveal className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-8 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-sm">
          <img alt="TaskMate" className="h-6 w-6" src="/icon.png" />
          <span className="font-bold text-sm tracking-widest uppercase text-white">TaskMate</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-[85px] font-bold tracking-tight leading-[1.1] text-white max-w-5xl font-serif">
          Empowering Workers.<br />
          Building Total Trust.
        </h1>
      </Reveal>

      <Reveal delay={0.2} className="mt-8 md:mt-10 max-w-3xl relative z-10">
        <p className="text-lg md:text-xl text-white/70 font-sans leading-relaxed">
          The trusted workforce platform to find, hire, negotiate with, and securely pay verified local artisans. We enable workers to build digital reputations and financial identities.
        </p>
      </Reveal>

      <Reveal delay={0.4} className="mt-12 relative z-10 flex flex-col sm:flex-row gap-4">
        <Link to="/register" className="bg-[#7AC142] text-[#1a2b3c] px-10 py-4 rounded-full text-lg font-bold hover:bg-white hover:-translate-y-1 shadow-lg transition-all duration-300 flex items-center gap-2">
          Find a Professional <span className="material-icons text-sm">arrow_forward_ios</span>
        </Link>
        <a href="#about" className="bg-white text-[#1a2b3c] px-10 py-4 rounded-full text-lg font-bold hover:bg-[#eaebe4] transition-all duration-300 border border-[#1a2b3c]/10 shadow-sm">
          Learn More
        </a>
      </Reveal>
    </section>
  );
};

export default HeroSection;
