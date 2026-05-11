import { Link } from 'react-router-dom';

const LandingNavbar = ({ isScrolled }) => {
  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3 md:py-4' : 'bg-transparent py-4 md:py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img alt="TaskMate" className={`h-10 w-10 transition-transform group-hover:scale-105 ${!isScrolled && 'filter brightness-0 invert'}`} src="/icon.png" />
          <span className={`font-bold text-2xl tracking-tight font-serif transition-colors ${isScrolled ? 'text-[#1a2b3c]' : 'text-white'}`}>TaskMate</span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <a href="#about" className={`text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>About</a>
          <a href="#services" className={`text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>Services</a>
          <a href="#testimonials" className={`text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>Testimonials</a>
          <a href="#faq" className={`text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>FAQ</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className={`hidden md:block text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>
            Log in
          </Link>
          <Link to="/register" className="shrink-0 whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-[12px] sm:text-[15px] font-semibold transition-all duration-300 shadow-md bg-[#7AC142] text-[#1a2b3c] hover:bg-[#8FD353]">
            Join TaskMate
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
