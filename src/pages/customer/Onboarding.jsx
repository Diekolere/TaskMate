import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Confetti from 'react-confetti';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { uploadFile, generateFilePath } from '../../lib/supabase';
import { toast } from 'sonner';

// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUserProfile, currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(currentUser?.photoURL || null);
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    phoneNumber: '', 
    location: '',
    photo: null,
    selectedCategories: [],
    consent: false,
  });


  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...', { id: 'locationPromise' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          let locationName = '';
          if (data && data.address) {
            locationName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || data.display_name;
          } else {
             locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setFormData(prev => ({ ...prev, location: locationName }));
          toast.success('Location updated!', { id: 'locationPromise' });
        } catch (error) {
          console.error('Error fetching address:', error);
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          toast.success('Location coordinates updated!', { id: 'locationPromise' });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to retrieve your location', { id: 'locationPromise' });
      }
    );
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSkip = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      navigate('/dashboard'); 
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const isSelected = prev.selectedCategories.includes(category);
      if (isSelected) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, category],
        };
      }
    });
  };

  const categories = [
    { name: 'Plumbing', sub: 'Fix leaks & pipes', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFhoiv6hU1ql1lV3Ka7xz5RJyLQdoV3BT5RKO_KdhujxzkiDLXMdYWkqv5rgi2Ed8HjsKl0_ASBznyNurApEB0JXxxUp5AIy2GTLL0_lrYx00hMAfL3NjlaS7VZqod8ObuCVInOyC7SVX-MfKh9SMGcVuEL-xKBHnXz8XiIsLjR2Uwxmg1av3dpfFN-E7XjKhs58n9phaP0mFYLiX3fpKPXLdPo2aOYoBP3DocI_Rwy33K9Ue_b-pi3VjiepHU5VYJV40yQY6zBfQ' },
    { name: 'House Cleaning', sub: 'Sparkling clean homes', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwoA2UI9YmmQ_ioOKXXUre87UIujPP67WS_HVV66cfRlE23zjmEjTbO336NsjVxygN2uGeyLbzjt5aeQF8KKO9dDVU2lUBqkOjaSvUBIif1f1Z48bP8hIg58N6tIRd2FJPwi6itqtZxzeZ-0O2_00ElOmU3BPZ6ZBXuESumHhy6nv0TZPb59D-nCTzHlU25pT_8zagAwkdXwGSQNbQQHDumcAno1Nf0772YinUNxO59IuGBomiCzxddYEzYfFdU7sSx7FwnuUUJdI' },
    { name: 'Electrical Repairs', sub: 'Wiring & fixtures', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGVwSZVeo4j_wjg-FlaM4nSjRY2-2agfE8FXHqxXFti1EdfBtKha0Ix0kAFvyZhzv1ckiKs-2li4lGUsd1d0t0gk2LZgd1d2tAELpS-RNPMnyOauPOkXxTeZSBKf-LysD4Ac4MwXpb0u1XUZZYHvBVTNHBbw2lQdy9HyLEdUVT46DpABaIZcWIEqdzZq-68v571JK0w2TI8tuehIk8iWux1e4uhUPsFrciuvrgo5tsq1ETFdOlA98aNBXDAcTvN8lpl_XKcuDQPWY' },
    { name: 'Carpentry', sub: 'Furniture & woodwork', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxlnsgLoEBAutVMg-9ypmj0A2ZhK1NGwgvk764Y2tbbHOhQa_EV7nvun6QM0QtVU_HDteAXWHhyFZZhmWmX_QDfnrFtge-XaTlJhb1DQQD43k9neBrAvqR0hB2cduWD8U9KGJgc0__isOjCiKoETpGyLbLcNQKd1xtWtEemqOKvAsAUgGUZBbLiaF8E16yKbmhWGQK21YnCt3UhFNOXccwGCT07MIkD_xrzXBwWm-7jeC2zfqziilYaXrUO3lnATMfEbBctQ2LTlQ' },
    { name: 'AC Servicing', sub: 'Cooling maintenance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcsuiw8fihIG2Ox7C6uaqlZdIrt6uBLRfU1gmrpcyGEKqM_Pymvzj-Z9_PqXBwQMdcmB-Mvdfy7g7blHDAAy6TjufdHeOqOpI7FaKBDshufkFX2Nu95PKnUPrXFKxtfPKwc4qRhUtQ8AgMJspCTKnjg3byk03u8eqyKwKL1zv97NWJ1TGFgNpfANVVtECJmZayPsO79IJ-GMCsv7fvqcZmAiDQHqgQZ_2wEaZnRdNl3_DLKoFR9t9YGuB7Kp1objl-oPCf5W6lPkg' },
    { name: 'Laundry', sub: 'Wash & fold', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvhVa8xs41VIPJ0g4KGA2LJJt0eEPfj2Iu65v9gcvu-n7YoISeFq5RB1SfiVVOcbVkZwzGRp-RHTw-dEaFeAYg-QorWVVlgWfTRDZsUt9TvoWmEthm-ErVBFsoZEBP9JvEwrPdto0xwXH4xixRMfUxLRovvw5t_M1F6ONn5qaflI6eamnZxPKAlvEKuNRxnPyHPCpqjAqxLdQI6H_vSFOA9dS1ybF7IJqoEwW_VriAHQ7ENP3YddMln6M5KkpN8H-0-yP9oPWGgNU' },
    { name: 'Painting', sub: 'Fresh wall colors', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7THwV_8P6ZHGSjpHD0qpeSM4AX6M-YDPE9ads5jM_FDNPY2Eufhiu7dH0NQmtMB-T4CRob0X8A4E_rf9OrTW8JkCxLFZTeEVZIT3oHGTzekL-JVxElUQGbRRUEsPTLsoVNduAW8Vd09U0dwvssn7v-BPtKWhacXSYh6WKzDrCd6x5jemRmPTH1VomYgVCi5TQHqx10mcuwDOb2aQIzvFZRI9jMgCL67B0bFfB36ko8qz5Ejr6yhWyu0f1hCZ8gbNMXGoxmjUNPwc' },
    { name: 'Gardening', sub: 'Lawn & plants', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvzPlqWesT97x5nPQi4pjOQt7nGcEmXPkGTeY2GIBPFvI7SdBJfxZSqh9mjLmaRswxzEi5ql8a-B7cP_wiRG6ASZY3ZQyFBxFII8foQf2ttI69M06DMVLLAseLEMalq_ddPA8B4PSvXrEPG_fuO9NJwTcoMUixVtmbeGHWdDhCLkcGB-z9MqqnaOF58lUjS0Hga8cg1sDPEGY4kvNI6MtTFGLqGh5b9pXkox0dV3NJkf_9W-5CYQBOpsxL2ro-rOPUbQ-mVLTHFR4' },
  ];

  const handleFinish = async () => {
    setLoading(true);
    try {
        let photoURL = previewUrl;
        
        if (formData.photo) {
            try {
                const path = generateFilePath(currentUser.id, formData.photo.name);
                photoURL = await uploadFile('avatars', path, formData.photo);
            } catch (err) {
                console.error('Photo upload error:', err);
                // Continue with existing photoURL or null if upload fails
            }
        }

        await updateUserProfile({
            full_name: formData.displayName,
            phone_number: formData.phoneNumber,
            location_name: formData.location,
            preferences: formData.selectedCategories,
            avatar_url: photoURL,
            onboarding_completed: true
        });
        
        setStep(4); // Success State
        setTimeout(() => navigate('/customer/dashboard'), 3000); 
    } catch (error) {
        console.error(error);
        toast.error("Failed to save profile");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top Navigation */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="TaskMate" className="h-8 w-8" />
          <span className="font-display font-bold text-xl text-gray-900">TaskMate</span>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors">
            Exit
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 flex justify-center min-h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="w-full max-w-[800px]">
          {/* Progress Bar */}
          {step < 3 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-gray-900 font-display font-bold">Step {step} of 3: {step === 1 ? 'Profile Setup' : 'Service Preferences'}</p>
                    <p className="text-gray-500 text-sm font-medium">{step === 1 ? '33%' : '66%'}</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                        className="bg-green-700 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: step === 1 ? '33%' : '66%' }}
                    />
                </div>
            </div>
           )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-extrabold text-gray-900 mb-2">Welcome to TaskMate!</h1>
                    <p className="text-gray-500 text-lg max-w-lg mx-auto">Let's set up your profile so we can match you with the best professionals in your area.</p>
                 </div>

                 <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Photo Upload */}
                    <div className="p-8 border-b border-gray-100 flex flex-col items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <div 
                            className="relative group cursor-pointer mb-4"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <div 
                                className="w-32 h-32 rounded-full bg-cover bg-center border-4 border-green-100 group-hover:border-green-700 transition-colors"
                                style={{ backgroundImage: `url("${previewUrl || 'https://ui-avatars.com/api/?name=' + (formData.displayName || 'User')}")` }}
                            ></div>
                            <div className="absolute bottom-1 right-1 bg-green-700 text-white p-2 rounded-full shadow-lg border-2 border-white">
                                <span className="material-icons-outlined text-sm block">add_a_photo</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Upload Profile Photo</h3>
                        <p className="text-gray-500 text-sm mt-1">JPG or PNG (Max 5MB)</p>
                    </div>

                    {/* Fields */}
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Display Name</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-700/50 focus:border-green-700 transition-all font-medium"
                                placeholder="e.g. Ade wale"
                                value={formData.displayName}
                                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
                            <input 
                                type="tel" 
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-700/50 focus:border-green-700 transition-all font-medium"
                                placeholder="e.g. 08012345678"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-900">Primary Location</label>
                                <button 
                                    onClick={handleUseCurrentLocation}
                                    className="text-green-700 text-xs font-bold flex items-center hover:underline"
                                >
                                    <span className="material-icons-outlined text-sm mr-1">my_location</span>
                                    Use Current Location
                                </button>
                            </div>
                            <div className="relative">
                                <span className="material-icons-outlined absolute left-4 top-3.5 text-gray-400">search</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3 rounded-t-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-700/50 focus:border-green-700 transition-all font-medium"
                                    placeholder="Enter neighborhood or city (e.g. Lekki, Abuja)"
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                            <div className="h-64 w-full bg-gray-200 rounded-b-xl overflow-hidden relative border-x border-b border-gray-200 z-0">
                                <MapContainer 
                                    center={mapCenter} 
                                    zoom={13} 
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <ChangeView center={mapCenter} />
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={mapCenter}>
                                        <Popup>
                                            Your Location
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50 flex flex-col gap-3">
                        <button 
                            onClick={handleNext}
                            className="w-full py-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                        >
                            Continue
                            <span className="material-icons-outlined">arrow_forward</span>
                        </button>
                        <button onClick={handleSkip} className="text-gray-500 font-semibold hover:text-gray-900 transition-colors text-sm">
                            Skip for now
                        </button>
                    </div>
                 </div>
              </motion.div>
            )}

            {step === 2 && (
               <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                  <div className="mb-8">
                     <h1 className="text-3xl font-display font-extrabold text-gray-900 mb-2">What services do you need?</h1>
                     <p className="text-gray-500 text-lg">Select at least 3 categories to help us personalize your experience.</p>
                  </div>

                  {/* Search */}
                  <div className="relative mb-8">
                     <span className="material-icons-outlined absolute left-4 top-4 text-gray-400">search</span>
                     <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700/50 focus:border-green-700 transition-all text-lg"
                        placeholder="Search for services..."
                    />
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                     {categories.map((cat, idx) => (
                        <div 
                            key={idx}
                            onClick={() => handleCategoryToggle(cat.name)}
                            className={`
                                cursor-pointer rounded-xl p-3 border-2 transition-all hover:shadow-lg group flex flex-col gap-3
                                ${formData.selectedCategories.includes(cat.name) ? 'border-green-700 bg-green-50' : 'border-transparent bg-white'}
                            `}
                        >
                             <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                {formData.selectedCategories.includes(cat.name) && (
                                    <div className="absolute top-2 right-2 h-6 w-6 bg-green-700 rounded-full flex items-center justify-center shadow-md">
                                        <span className="material-icons-outlined text-white text-xs font-bold">check</span>
                                    </div>
                                )}
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                 <p className="text-xs text-gray-500">{cat.sub}</p>
                             </div>
                        </div>
                     ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <button onClick={handleSkip} className="text-gray-500 font-semibold hover:text-gray-900">
                          Skip for now
                      </button>
                      <button 
                         onClick={handleNext}
                         className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                      >
                          Next Step
                          <span className="material-icons-outlined">arrow_forward</span>
                      </button>
                  </div>
              </motion.div>
            )}

            {step === 3 && (
                <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-12"
                >
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <span className="material-icons-outlined text-4xl text-green-700">verified_user</span>
                        </div>
                        <h2 className="text-2xl font-display font-extrabold text-gray-900 mb-4">You're almost done!</h2>
                        <p className="text-gray-500 mb-8">
                            By clicking "Agree & Finish", you agree to TaskMate's Terms of Service and Privacy Policy. We're excited to have you on board.
                        </p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full py-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Agree & Finish'}
                            </button>
                             <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600">
                                Back
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {step === 4 && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <Confetti numberOfPieces={200} recycle={false} />
                    <div className="mb-6 relative">
                        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse"></div>
                        <span className="material-icons-outlined text-6xl text-green-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">check_circle</span>
                    </div>
                    <h2 className="text-3xl font-display font-extrabold text-gray-900 mb-2">Setup Complete!</h2>
                    <p className="text-gray-500">Redirecting you to your dashboard...</p>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
