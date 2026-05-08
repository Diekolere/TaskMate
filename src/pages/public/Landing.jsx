import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Reveal = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AccordionItem = ({ title, content, isOpen, onClick }) => {
    return (
        <div className="border-b border-black/10 py-6">
            <button 
                onClick={onClick}
                className="w-full flex justify-between items-center text-left focus:outline-none group"
            >
                <h4 className="text-xl font-bold font-serif text-[#1a2b3c] group-hover:text-[#7AC142] transition-colors">{title}</h4>
                <span className="material-icons text-[#1a2b3c] transform transition-transform duration-300">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-4 text-[#1a2b3c]/70 leading-relaxed font-sans text-lg">
                            {content}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StepCard = ({ num, title, desc, delay = 0, className = "" }) => (
    <Reveal delay={delay} className={className}>
        <div className="group bg-[#1a2b3c] p-8 md:p-10 rounded-3xl shadow-xl border border-white/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden h-full">
            {/* SVG Bubbles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7AC142]/10 rounded-full blur-3xl group-hover:bg-[#7AC142]/20 transition-colors"></div>
            <div className="absolute top-20 right-20 w-12 h-12 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-10 left-20 w-24 h-24 bg-[#7AC142]/5 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex items-center gap-6 mb-6 relative z-10">
                <div className="h-14 w-14 bg-[#7AC142] rounded-xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform shrink-0">
                    <span className="text-2xl font-bold text-[#1a2b3c] font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        {num}
                    </span>
                </div>
                <h4 className="text-2xl md:text-3xl font-bold text-white font-serif">{title}</h4>
            </div>
            
            <p className="text-white/80 text-lg leading-relaxed font-sans relative z-10">
                {desc}
            </p>
        </div>
    </Reveal>
);

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
      {
          question: "How does TaskMate verify its service workers?",
          answer: "We conduct thorough background checks, verify identities, and collect professional references before any artisan is allowed to accept jobs on our platform. We also continuously monitor their trust scores based on customer reviews."
      },
      {
          question: "Is my payment secure on the platform?",
          answer: "Absolutely. We use a secure escrow system. Your payment is held safely until the job is completed to your satisfaction, ensuring both you and the service provider are protected."
      },
      {
          question: "How do digital reputations and trust scores work?",
          answer: "Every completed job and verified customer review contributes to a worker's digital reputation. A higher trust score indicates a consistent history of quality work, reliability, and professionalism."
      },
      {
          question: "What if I am not satisfied with the work?",
          answer: "We have a dispute resolution process in place. If the work does not meet the agreed-upon standards, our support team will step in to mediate and ensure a fair outcome, which may include holding funds in escrow."
      }
  ];

  const categories = [
      { title: "Plumbing", icon: "plumbing", desc: "Expert leak repairs, piping installations, and emergency drainage solutions for your home.", color: "from-blue-400 to-blue-600" },
      { title: "Electrical", icon: "electrical_services", desc: "Certified electricians for wiring, safety inspections, and all electrical maintenance needs.", color: "from-yellow-400 to-orange-500" },
      { title: "Carpentry", icon: "handyman", desc: "Bespoke furniture crafting, cabinet repairs, and professional woodwork by master artisans.", color: "from-amber-600 to-amber-800" },
      { title: "Cleaning", icon: "cleaning_services", desc: "Premium deep cleaning, post-construction maintenance, and regular residential upkeep.", color: "from-cyan-400 to-blue-400" },
      { title: "Painting", icon: "format_paint", desc: "Precision interior and exterior painting with premium finishes and attention to detail.", color: "from-rose-400 to-pink-600" },
      { title: "HVAC", icon: "ac_unit", desc: "Professional AC repair, ventilation systems, and climate control installations.", color: "from-emerald-400 to-teal-600" },
      { title: "Moving", icon: "local_shipping", desc: "Safe relocation, heavy lifting, and careful transportation of your valued possessions.", color: "from-indigo-500 to-purple-600" },
      { title: "Roofing", icon: "roofing", desc: "Durable roof repairs, leak prevention, and comprehensive structural inspections.", color: "from-slate-600 to-slate-800" },
      { title: "Appliance Repair", icon: "kitchen", desc: "Expert repairs for refrigerators, washing machines, ovens, and other household appliances.", color: "from-red-400 to-red-600" },
      { title: "Landscaping", icon: "grass", desc: "Professional lawn care, garden design, and outdoor maintenance services.", color: "from-green-500 to-emerald-700" },
  ];

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white text-[#1a2b3c] font-sans selection:bg-[#7AC142] selection:text-white min-h-screen flex flex-col overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
      
      {/* Glassmorphic Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
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

          <div className="flex items-center gap-6">
            <Link to="/login" className={`hidden md:block text-[15px] font-medium transition-colors ${isScrolled ? 'text-[#1a2b3c]/80 hover:text-[#1a2b3c]' : 'text-white/80 hover:text-white'}`}>
              Log in
            </Link>
            <Link to="/register" className={`px-6 py-3 rounded-full text-[15px] font-semibold transition-all duration-300 shadow-md ${isScrolled ? 'bg-[#1a2b3c] text-white hover:bg-[#7AC142] hover:text-[#1a2b3c]' : 'bg-[#7AC142] text-[#1a2b3c] hover:bg-white hover:text-[#1a2b3c]'}`}>
              Join TaskMate
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
            <Link to="/about" className="bg-white text-[#1a2b3c] px-10 py-4 rounded-full text-lg font-bold hover:bg-[#eaebe4] transition-all duration-300 border border-[#1a2b3c]/10 shadow-sm">
                Learn More
            </Link>
        </Reveal>
      </section>

      {/* Purpose & How it Works Section */}
      <section id="about" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-16">
            {/* Top Row: About Text + Step 1 */}
            <div className="flex flex-col lg:flex-row gap-16 items-start">
                <Reveal className="w-full lg:w-1/2">
                    <div className="relative">
                        <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop" alt="Smiling Electrician" className="rounded-2xl shadow-xl w-full h-[500px] object-cover" />
                        <div className="absolute -bottom-10 -right-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white hidden md:block max-w-[280px]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-[#7AC142] rounded-full flex items-center justify-center text-white"><span className="material-icons">verified</span></div>
                                <h4 className="text-[#1a2b3c] font-bold text-xl">100% Verified</h4>
                            </div>
                            <p className="text-[#1a2b3c]/70 text-sm">Every artisan undergoes rigorous background checks.</p>
                        </div>
                    </div>
                </Reveal>
                
                <div className="w-full lg:w-1/2 flex flex-col gap-10">
                    <Reveal>
                        <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-6 leading-tight">
                            Our Purpose and Aspiration
                        </h2>
                        <p className="text-lg text-[#1a2b3c]/70 leading-relaxed font-sans">
                            We believe in the dignity of local labor. Our aspiration is to formalize the informal sector by providing a platform where skills are recognized and payments are secure.
                        </p>
                    </Reveal>
                    
                    <StepCard 
                        num="1" 
                        title="Find & Compare" 
                        desc="Search for the exact service you need. Browse through profiles of verified local artisans, check their trust scores, and read authentic customer reviews to make an informed decision."
                    />
                </div>
            </div>

            {/* Bottom Row: Step 2 + Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <StepCard 
                    num="2" 
                    title="Negotiate & Hire" 
                    desc="Communicate directly with the artisan through our platform. Discuss the scope of work, negotiate pricing fairly, and officially hire them for your project with clear terms."
                    delay={0.1}
                />
                <StepCard 
                    num="3" 
                    title="Secure Pay & Review" 
                    desc="Funds are held safely in escrow. Once the job is completed to your satisfaction, release the payment. Leave a review to help the artisan build their digital reputation."
                    delay={0.2}
                />
            </div>
        </div>
      </section>

      {/* Services Section with Horizontal Scroll */}
      <section id="services" className="py-24 md:py-32 bg-white w-full relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <Reveal>
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div className="max-w-3xl">
                        <h2 className="text-4xl md:text-6xl font-bold font-serif text-[#1a2b3c] mb-6 leading-tight">
                            Connect with artisans and handymen that offer a wide variety of services
                        </h2>
                        <p className="text-xl text-[#1a2b3c]/70 font-sans">
                            Scroll to discover verified professionals for every task.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={scrollLeft} className="h-14 w-14 rounded-full border border-[#1a2b3c]/20 flex items-center justify-center hover:bg-[#1a2b3c] hover:text-white transition-all shadow-sm">
                            <span className="material-icons">arrow_back</span>
                        </button>
                        <button onClick={scrollRight} className="h-14 w-14 rounded-full border border-[#1a2b3c]/20 flex items-center justify-center hover:bg-[#1a2b3c] hover:text-white transition-all shadow-sm">
                            <span className="material-icons">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </Reveal>

            <div 
              ref={scrollRef}
              className="flex gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-12 -mx-4 px-4"
            >
                {categories.map((category, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="min-w-[320px] md:min-w-[400px] h-[500px] snap-center"
                    >
                        <Link to="/login" className="group block h-full bg-white/40 backdrop-blur-xl border border-[#1a2b3c]/10 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                                <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/80 backdrop-blur-sm border border-[#1a2b3c]/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-700">
                                    <span className={`material-icons text-6xl md:text-7xl text-[#1a2b3c] transition-colors group-hover:text-[#7AC142]`}>
                                        {category.icon}
                                    </span>
                                </div>
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#7AC142]/10 rounded-full blur-3xl group-hover:bg-[#7AC142]/20 transition-colors duration-700"></div>
                                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#1a2b3c]/5 rounded-full blur-3xl"></div>
                            </div>
                            <div className="p-10 bg-white/60">
                                <h3 className="text-3xl font-bold font-serif text-[#1a2b3c] mb-6">{category.title}</h3>
                                <div className="flex items-center gap-2 text-[#7AC142] font-bold text-lg group-hover:gap-4 transition-all">
                                    Book Now <span className="material-icons">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full">
        <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-16 text-center">
                Trusted by Homeowners and Businesses
            </h2>
        </Reveal>

        <div className="flex flex-col">
            {[
                { 
                    name: "Sarah Johnson", role: "Homeowner", 
                    quote: "TaskMate completely changed how I handle home repairs. Finding a reliable plumber used to be a nightmare. The artisan I found here was professional, transparent about pricing, and the escrow payment gave me complete peace of mind.", 
                    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop" 
                },
                { 
                    name: "David Okafor", role: "Restaurant Owner", 
                    quote: "When our commercial AC broke down during peak hours, we needed immediate help. TaskMate connected us with an HVAC specialist within minutes. The quality of service and the verified reviews system is unmatched.", 
                    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop" 
                },
                { 
                    name: "Grace A.", role: "Independent Carpenter", 
                    quote: "As an artisan, TaskMate has been a blessing. It allows me to build a digital reputation. Clients trust me more because they can see my track record, and I know I'll get paid securely when the job is done.", 
                    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
                    isArtisan: true
                }
            ].map((testimonial, idx) => (
                <Reveal key={idx} delay={0.1} className={`group flex flex-col ${idx % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 py-16 border-b border-black/10 last:border-0 relative`}>
                    <div className="w-full md:w-[50%] flex flex-col justify-center">
                        <span className="material-icons text-5xl text-[#7AC142] opacity-30 mb-6">format_quote</span>
                        <h3 className="text-2xl md:text-3xl font-serif text-[#1a2b3c] mb-6 leading-relaxed italic">
                            "{testimonial.quote}"
                        </h3>
                        <div>
                            <p className="font-bold text-[#1a2b3c] text-lg">{testimonial.name}</p>
                            <p className="text-[#1a2b3c]/60 flex items-center gap-2">
                                {testimonial.role} 
                                {testimonial.isArtisan && <span className="bg-[#7AC142]/20 text-[#7AC142] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Pro</span>}
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-[50%] flex items-center justify-center">
                        <div className="overflow-hidden rounded-2xl w-full max-w-[500px] h-[350px] shadow-xl relative">
                            <img src={testimonial.img} alt={testimonial.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#1a2b3c]/10"></div>
                        </div>
                    </div>
                </Reveal>
            ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 md:py-32 bg-white px-6 w-full">
        <div className="max-w-4xl mx-auto">
            <Reveal>
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-16 text-center">
                    Frequently Asked Questions
                </h2>
            </Reveal>
            <div className="border-t border-black/10">
                {faqs.map((faq, index) => (
                    <Reveal key={index} delay={index * 0.1}>
                        <AccordionItem 
                            title={faq.question} 
                            content={faq.answer} 
                            isOpen={openFaq === index} 
                            onClick={() => setOpenFaq(openFaq === index ? null : index)} 
                        />
                    </Reveal>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a2b3c] text-white pt-24 pb-12 px-6 w-full font-sans">
        <div className="max-w-7xl mx-auto">
            <div className="bg-[#7AC142] rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 mb-24 text-[#1a2b3c] relative overflow-hidden shadow-2xl">
                <div className="absolute -left-10 -bottom-10 opacity-20">
                    <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" />
                        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight">Ready to elevate your workforce experience?</h2>
                    <p className="text-lg font-medium opacity-90">Join thousands of customers and professionals building trust and value on TaskMate.</p>
                </div>
                <div className="relative z-10 shrink-0">
                    <Link to="/register" className="bg-[#1a2b3c] text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white hover:text-[#1a2b3c] hover:-translate-y-1 transition-all duration-300 inline-block shadow-lg">
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
    </div>
  );
};

export default Landing;
