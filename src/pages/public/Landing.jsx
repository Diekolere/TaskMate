import React, { useState, useEffect } from 'react';
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

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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
      { title: "Plumbing", icon: "plumbing", desc: "Leaks, installations, piping" },
      { title: "Electrical", icon: "electrical_services", desc: "Wiring, repairs, lighting" },
      { title: "Carpentry", icon: "handyman", desc: "Furniture, wood repairs" },
      { title: "Cleaning", icon: "cleaning_services", desc: "Deep clean, post-construction" },
      { title: "Painting", icon: "format_paint", desc: "Interior, exterior, touch-ups" },
      { title: "HVAC", icon: "ac_unit", desc: "AC repair, ventilation" },
      { title: "Moving", icon: "local_shipping", desc: "Relocation, heavy lifting" },
      { title: "Roofing", icon: "roofing", desc: "Repairs, inspections, leaks" },
      { title: "Appliance Repair", icon: "kitchen", desc: "Fridges, washers, ovens" },
      { title: "Landscaping", icon: "grass", desc: "Gardening, lawn care" },
      { title: "Pest Control", icon: "pest_control", desc: "Extermination, prevention" },
      { title: "Security", icon: "security", desc: "CCTV, locks, alarms" },
  ];

  return (
    <div className="bg-[#eaebe4] text-[#1a2b3c] font-sans selection:bg-[#7AC142] selection:text-white min-h-screen flex flex-col overflow-x-hidden">
      
      {/* Glassmorphic Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/70 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <img alt="TaskMate" className="h-10 w-10 transition-transform group-hover:scale-105" src="/icon.png" />
            <span className="font-bold text-2xl tracking-tight text-[#1a2b3c] font-serif">TaskMate</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            <a href="#about" className="text-[15px] font-medium text-[#1a2b3c]/80 hover:text-[#1a2b3c] transition-colors">About</a>
            <a href="#services" className="text-[15px] font-medium text-[#1a2b3c]/80 hover:text-[#1a2b3c] transition-colors">Services</a>
            <a href="#testimonials" className="text-[15px] font-medium text-[#1a2b3c]/80 hover:text-[#1a2b3c] transition-colors">Testimonials</a>
            <a href="#faq" className="text-[15px] font-medium text-[#1a2b3c]/80 hover:text-[#1a2b3c] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden md:block text-[15px] font-medium text-[#1a2b3c]/80 hover:text-[#1a2b3c] transition-colors">
              Log in
            </Link>
            <Link to="/register" className="bg-[#1a2b3c] text-white px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-[#7AC142] hover:text-[#1a2b3c] transition-all duration-300 shadow-md">
              Join TaskMate
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Light Theme */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 px-6 w-full flex flex-col items-center text-center bg-[#f7f8f3] overflow-hidden">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#7AC142]/10 blur-[100px]"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#1a2b3c]/5 blur-[80px]"></div>
        </div>

        <Reveal className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8 bg-white/50 backdrop-blur-sm px-5 py-2 rounded-full border border-[#1a2b3c]/10 shadow-sm">
             <img alt="TaskMate" className="h-6 w-6" src="/icon.png" />
             <span className="font-bold text-sm tracking-widest uppercase text-[#1a2b3c]">TaskMate</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[85px] font-bold tracking-tight leading-[1.1] text-[#1a2b3c] max-w-5xl font-serif">
            Empowering Workers.<br />
            Building Total Trust.
          </h1>
        </Reveal>
        
        <Reveal delay={0.2} className="mt-8 md:mt-10 max-w-3xl relative z-10">
          <p className="text-lg md:text-xl text-[#1a2b3c]/70 font-sans leading-relaxed">
            The trusted workforce platform to find, hire, negotiate with, and securely pay verified local artisans. We enable workers to build digital reputations and financial identities.
          </p>
        </Reveal>
        
        <Reveal delay={0.4} className="mt-12 relative z-10 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="bg-[#7AC142] text-[#1a2b3c] px-10 py-4 rounded-full text-lg font-bold hover:bg-[#1a2b3c] hover:text-white hover:-translate-y-1 shadow-lg transition-all duration-300 flex items-center gap-2">
                Find a Professional <span className="material-icons text-sm">arrow_forward_ios</span>
            </Link>
            <Link to="/about" className="bg-white text-[#1a2b3c] px-10 py-4 rounded-full text-lg font-bold hover:bg-[#eaebe4] transition-all duration-300 border border-[#1a2b3c]/10 shadow-sm">
                Learn More
            </Link>
        </Reveal>
      </section>

      {/* Purpose & How it Works Section */}
      <section id="about" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
            <Reveal className="w-full lg:w-1/2 sticky top-32">
                <div className="relative">
                    <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop" alt="Workers collaborating" className="rounded-2xl shadow-xl w-full h-[600px] object-cover" />
                    <div className="absolute -bottom-10 -right-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white hidden md:block max-w-[280px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-[#7AC142] rounded-full flex items-center justify-center text-white"><span className="material-icons">verified</span></div>
                            <h4 className="text-[#1a2b3c] font-bold text-xl">100% Verified</h4>
                        </div>
                        <p className="text-[#1a2b3c]/70 text-sm">Every artisan undergoes rigorous background checks.</p>
                    </div>
                </div>
            </Reveal>
            <Reveal delay={0.2} className="w-full lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-6 leading-tight">
                    Our Purpose and Aspiration
                </h2>
                <p className="text-lg text-[#1a2b3c]/70 leading-relaxed mb-12 font-sans">
                    We believe in the dignity of local labor. Our aspiration is to formalize the informal sector by providing a platform where skills are recognized, payments are secure, and digital reputations unlock new financial opportunities for every artisan.
                </p>
                
                {/* 3 Step Process */}
                <h3 className="text-2xl font-bold font-serif text-[#1a2b3c] mb-8">How TaskMate Works</h3>
                <div className="space-y-8">
                    <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-[#1a2b3c] text-white flex items-center justify-center font-bold text-xl font-serif shrink-0 z-10">1</div>
                            <div className="w-px h-full bg-[#1a2b3c]/20 my-2"></div>
                        </div>
                        <div className="pb-4">
                            <h4 className="text-xl font-bold text-[#1a2b3c] mb-2">Find & Compare</h4>
                            <p className="text-[#1a2b3c]/70 leading-relaxed">Search for the exact service you need. Browse through profiles of verified local artisans, check their trust scores, and read authentic customer reviews to make an informed decision.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-[#7AC142] text-[#1a2b3c] flex items-center justify-center font-bold text-xl font-serif shrink-0 z-10">2</div>
                            <div className="w-px h-full bg-[#1a2b3c]/20 my-2"></div>
                        </div>
                        <div className="pb-4">
                            <h4 className="text-xl font-bold text-[#1a2b3c] mb-2">Negotiate & Hire</h4>
                            <p className="text-[#1a2b3c]/70 leading-relaxed">Communicate directly with the artisan through our platform. Discuss the scope of work, negotiate pricing fairly, and officially hire them for your project with clear terms.</p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-[#1a2b3c] text-white flex items-center justify-center font-bold text-xl font-serif shrink-0 z-10">3</div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-[#1a2b3c] mb-2">Secure Pay & Review</h4>
                            <p className="text-[#1a2b3c]/70 leading-relaxed">Funds are held safely in escrow. Once the job is completed to your satisfaction, release the payment. Leave a review to help the artisan build their digital reputation and financial identity.</p>
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
      </section>

      {/* Services Grid Section - Glassmorphic Cards */}
      <section id="services" className="py-24 md:py-32 bg-white px-6 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f7f8f3] to-white z-0 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <Reveal>
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#1a2b3c] mb-6">
                        Connecting you with artisans that can complete your every need
                    </h2>
                    <p className="text-lg text-[#1a2b3c]/70 font-sans">
                        Whatever the task, we have a verified professional ready to help. Explore our wide range of service categories.
                    </p>
                </div>
            </Reveal>

            {/* 4 columns x 3 rows grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category, idx) => (
                    <Reveal key={idx} delay={idx * 0.05}>
                        <Link to="/login" className="group block h-full">
                            <div className="h-full p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-[#1a2b3c]/5 shadow-[0_4px_20px_-4px_rgba(26,43,60,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(122,193,66,0.15)] hover:-translate-y-1 hover:bg-white/80 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="h-16 w-16 bg-[#eaebe4] group-hover:bg-[#7AC142] rounded-xl flex items-center justify-center text-[#1a2b3c] group-hover:text-white transition-colors duration-300 mb-5">
                                    <span className="material-icons text-3xl">{category.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold font-serif text-[#1a2b3c] mb-2">{category.title}</h3>
                                <p className="text-sm text-[#1a2b3c]/60 font-sans">
                                    {category.desc}
                                </p>
                            </div>
                        </Link>
                    </Reveal>
                ))}
            </div>
            
            <Reveal delay={0.3} className="mt-12 text-center">
                <Link to="/register" className="inline-flex items-center gap-2 text-[#7AC142] font-bold hover:text-[#1a2b3c] transition-colors">
                    View all service categories <span className="material-icons text-sm">arrow_forward</span>
                </Link>
            </Reveal>
        </div>
      </section>

      {/* Testimonials Section (Replacing Professionals) */}
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

      {/* Footer CTA & Footer */}
      <footer className="bg-[#1a2b3c] text-white pt-24 pb-12 px-6 w-full font-sans">
        <div className="max-w-7xl mx-auto">
            {/* CTA */}
            <div className="bg-[#7AC142] rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 mb-24 text-[#1a2b3c] relative overflow-hidden shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute -left-10 -bottom-10 opacity-20">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
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

            {/* Footer Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-2">
                    <Link to="/" className="flex items-center gap-3 mb-6">
                        <img alt="TaskMate" className="h-10 w-10 filter brightness-0 invert" src="/icon.png" />
                        <span className="font-bold text-2xl tracking-tight font-serif">TaskMate</span>
                    </Link>
                    <p className="text-white/60 font-medium max-w-sm text-lg leading-relaxed mb-6">
                        The trusted platform connecting you with verified local artisans, enabling secure payments and digital reputations.
                    </p>
                    <div className="text-white/80 font-medium">
                        <p className="mb-2">Email: support@taskmate.com</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-xl mb-6 font-serif">Platform</h4>
                    <ul className="space-y-4 text-white/60 font-medium">
                        <li><Link to="/login" className="hover:text-[#7AC142] transition-colors">Find a Professional</Link></li>
                        <li><Link to="/register" className="hover:text-[#7AC142] transition-colors">Become a Tasker</Link></li>
                        <li><a href="#" className="hover:text-[#7AC142] transition-colors">Trust & Safety</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-xl mb-6 font-serif">Company</h4>
                    <ul className="space-y-4 text-white/60 font-medium">
                        <li><a href="#about" className="hover:text-[#7AC142] transition-colors">About Us</a></li>
                        <li><a href="#faq" className="hover:text-[#7AC142] transition-colors">FAQ</a></li>
                        <li><a href="#" className="hover:text-[#7AC142] transition-colors">Legal & Privacy</a></li>
                    </ul>
                </div>
            </div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm font-medium text-white/40">
                <p>© {new Date().getFullYear()} TaskMate Inc. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                    <a href="#" className="hover:text-white transition-colors">Instagram</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
