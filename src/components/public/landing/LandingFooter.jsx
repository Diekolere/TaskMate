import { Link } from 'react-router-dom';

const LandingFooter = () => {
  return (
    <footer className="bg-[#1a2b3c] text-white pt-24 pb-12 px-6 w-full font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#7AC142] rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 mb-24 text-[#1a2b3c] relative overflow-hidden shadow-2xl">
          <div className="absolute -left-10 -bottom-10 opacity-20">
            <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" fill="currentColor" />
              <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight">Ready to elevate your workforce experience?</h2>
            <p className="text-lg font-medium opacity-90">Join thousands of customers and professionals building trust and value on TaskMate.</p>
          </div>
          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link to="/register" className="w-full md:w-auto text-center inline-block shrink-0 whitespace-nowrap px-4 sm:px-10 py-3 sm:py-5 rounded-full text-[12px] sm:text-lg font-bold transition-all duration-300 shadow-lg bg-[#1a2b3c] text-white hover:bg-white hover:text-[#1a2b3c]">
              Get Started Free
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img alt="TaskMate" className="h-10 w-10 filter brightness-0 invert" src="/icon.png" />
              <span className="font-bold text-2xl tracking-tight font-serif text-white">TaskMate</span>
            </Link>
            <p className="text-white/70 font-medium max-w-sm text-lg leading-relaxed mb-6">
              The trusted platform connecting you with verified local artisans.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xl mb-6 font-serif text-white">Platform</h4>
            <ul className="space-y-4 text-white/70 font-medium">
              <li><Link to="/login" className="hover:text-[#7AC142] transition-colors">Find a Pro</Link></li>
              <li><Link to="/register" className="hover:text-[#7AC142] transition-colors">Become a Tasker</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xl mb-6 font-serif text-white">Company</h4>
            <ul className="space-y-4 text-white/70 font-medium">
              <li><a href="#about" className="hover:text-[#7AC142] transition-colors">About Us</a></li>
              <li><a href="#faq" className="hover:text-[#7AC142] transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm font-medium text-white/50">
          <p>© {new Date().getFullYear()} TaskMate Inc.</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
