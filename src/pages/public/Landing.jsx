import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../../components/public/landing/Reveal';
import LandingNavbar from '../../components/public/landing/LandingNavbar';
import HeroSection from '../../components/public/landing/HeroSection';
import LandingFooter from '../../components/public/landing/LandingFooter';

const AccordionItem = ({ title, content, isOpen, onClick }) => {
  return (
    <div className="border-b border-black/10 py-6">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left focus:outline-none group">
        <h4 className="text-xl font-bold font-serif text-[#1a2b3c] group-hover:text-[#7AC142] transition-colors">{title}</h4>
        <span className="material-icons text-[#1a2b3c] transform transition-transform duration-300">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="pt-4 text-[#1a2b3c]/70 leading-relaxed font-sans text-lg">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepCard = ({ num, title, desc, delay = 0, className = '' }) => (
  <Reveal delay={delay} className={className}>
    <div className="group bg-[#1a2b3c] p-8 md:p-10 rounded-3xl shadow-xl border border-white/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden h-full">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7AC142]/10 rounded-full blur-3xl group-hover:bg-[#7AC142]/20 transition-colors"></div>
      <div className="absolute top-20 right-20 w-12 h-12 bg-white/5 rounded-full"></div>
      <div className="absolute bottom-10 left-20 w-24 h-24 bg-[#7AC142]/5 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex items-center gap-6 mb-6 relative z-10">
        <div className="h-14 w-14 bg-[#7AC142] rounded-xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform shrink-0">
          <span className="text-2xl font-bold text-[#1a2b3c] font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>{num}</span>
        </div>
        <h4 className="text-2xl md:text-3xl font-bold text-white font-serif">{title}</h4>
      </div>

      <p className="text-white/80 text-lg leading-relaxed font-sans relative z-10">{desc}</p>
    </div>
  </Reveal>
);

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  const smoothHorizontalScroll = (distance = 0, duration = 520) => {
    if (!scrollRef.current) return;
    const start = scrollRef.current.scrollLeft;
    const end = start + distance;
    const startTime = performance.now();

    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOut(progress);
      scrollRef.current.scrollLeft = start + (end - start) * eased;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    { question: 'How does TaskMate verify its service workers?', answer: 'We conduct thorough background checks, verify identities, and collect professional references before any artisan is allowed to accept jobs on our platform. We also continuously monitor their trust scores based on customer reviews.' },
    { question: 'Is my payment secure on the platform?', answer: 'Absolutely. We use a secure escrow system. Your payment is held safely until the job is completed to your satisfaction, ensuring both you and the service provider are protected.' },
    { question: 'How do digital reputations and trust scores work?', answer: 'Every completed job and verified customer review contributes to a worker\'s digital reputation. A higher trust score indicates a consistent history of quality work, reliability, and professionalism.' },
    { question: 'What if I am not satisfied with the work?', answer: 'We have a dispute resolution process in place. If the work does not meet the agreed-upon standards, our support team will step in to mediate and ensure a fair outcome, which may include holding funds in escrow.' }
  ];

  const categories = [
    { title: 'Plumbing', icon: 'plumbing', color: 'from-blue-400 to-blue-600' },
    { title: 'Electrical', icon: 'electrical_services', color: 'from-yellow-400 to-orange-500' },
    { title: 'Carpentry', icon: 'handyman', color: 'from-amber-600 to-amber-800' },
    { title: 'Cleaning', icon: 'cleaning_services', color: 'from-cyan-400 to-blue-400' },
    { title: 'Painting', icon: 'format_paint', color: 'from-rose-400 to-pink-600' },
    { title: 'HVAC', icon: 'ac_unit', color: 'from-emerald-400 to-teal-600' },
    { title: 'Moving', icon: 'local_shipping', color: 'from-indigo-500 to-purple-600' },
    { title: 'Roofing', icon: 'roofing', color: 'from-slate-600 to-slate-800' },
    { title: 'Appliance Repair', icon: 'kitchen', color: 'from-red-400 to-red-600' },
    { title: 'Landscaping', icon: 'grass', color: 'from-green-500 to-emerald-700' }
  ];

  return (
    <div className="bg-white text-[#1a2b3c] font-sans selection:bg-[#7AC142] selection:text-white min-h-screen flex flex-col overflow-x-hidden">
      <LandingNavbar isScrolled={isScrolled} />
      <HeroSection />

      <section id="about" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <Reveal className="w-full lg:w-1/2">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop" alt="Smiling Electrician" className="rounded-2xl shadow-xl w-full h-[500px] object-cover" />
              </div>
            </Reveal>
            <div className="w-full lg:w-1/2 flex flex-col gap-10">
              <Reveal>
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-6 leading-tight">Our Purpose and Aspiration</h2>
                <p className="text-lg text-[#1a2b3c]/70 leading-relaxed font-sans">We believe in the dignity of local labor. Our aspiration is to formalize the informal sector by providing a platform where skills are recognized and payments are secure.</p>
              </Reveal>
              <StepCard num="1" title="Find & Compare" desc="Search for the exact service you need. Browse through profiles of verified local artisans, check their trust scores, and read authentic customer reviews to make an informed decision." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <StepCard num="2" title="Negotiate & Hire" desc="Communicate directly with the artisan through our platform. Discuss the scope of work, negotiate pricing fairly, and officially hire them for your project with clear terms." delay={0.1} />
            <StepCard num="3" title="Secure Pay & Review" desc="Funds are held safely in escrow. Once the job is completed to your satisfaction, release the payment. Leave a review to help the artisan build their digital reputation." delay={0.2} />
          </div>
        </div>
      </section>

      <section id="services" className="py-24 md:py-32 bg-white w-full relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div className="max-w-3xl">
                <h2 className="text-4xl md:text-6xl font-bold font-serif text-[#1a2b3c] mb-6 leading-tight">Connect with artisans and handymen that offer a wide variety of services</h2>
                <p className="text-xl text-[#1a2b3c]/70 font-sans">Scroll to discover verified professionals for every task.</p>
              </div>
              <div className="flex gap-3 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => smoothHorizontalScroll(-360)}
                  className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border border-[#1a2b3c]/20 flex items-center justify-center hover:bg-[#1a2b3c] hover:text-white transition-all shadow-sm"
                  aria-label="Scroll services left"
                >
                  <span className="material-icons">arrow_back</span>
                </button>
                <button
                  type="button"
                  onClick={() => smoothHorizontalScroll(360)}
                  className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border border-[#1a2b3c]/20 flex items-center justify-center hover:bg-[#1a2b3c] hover:text-white transition-all shadow-sm"
                  aria-label="Scroll services right"
                >
                  <span className="material-icons">arrow_forward</span>
                </button>
              </div>
            </div>
          </Reveal>

          <div ref={scrollRef} className="flex gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-12 -mx-4 px-4">
            {categories.map((category, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: 36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55, delay: idx * 0.045, ease: [0.22, 1, 0.36, 1] }} className="min-w-[320px] md:min-w-[400px] h-[500px] snap-center">
                <Link to="/login" className="group block h-full bg-white/40 backdrop-blur-xl border border-[#1a2b3c]/10 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                  <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/80 backdrop-blur-sm border border-[#1a2b3c]/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-700">
                      <span className="material-icons text-6xl md:text-7xl text-[#1a2b3c] group-hover:text-[#7AC142]">{category.icon}</span>
                    </div>
                  </div>
                  <div className="p-10 bg-white/60">
                    <h3 className="text-3xl font-bold font-serif text-[#1a2b3c] mb-6">{category.title}</h3>
                    <div className="flex items-center gap-2 text-[#7AC142] font-bold text-lg">Book Now <span className="material-icons">arrow_forward</span></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 md:py-32 bg-white px-6 w-full">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-16 text-center">Frequently Asked Questions</h2>
          </Reveal>
          <div className="border-t border-black/10">
            {faqs.map((faq, index) => (
              <Reveal key={index} delay={index * 0.05}>
                <AccordionItem title={faq.question} content={faq.answer} isOpen={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Landing;
