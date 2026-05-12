import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { useProviderOnboarding } from '../../../context/ProviderOnboardingContext';

const ProfessionalInfo = () => {
  const navigate = useNavigate();
  const { onboardingData, updateData, files, updateFiles } = useProviderOnboarding();

  // We can treat files.profileImage as part of formData for compatibility with rendering logic below
  const formData = { ...onboardingData, profileImage: files.profileImage };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateFiles({ profileImage: file });
    }
  };


  const categories = [
    'Plumbing', 'Electrical', 'Cleaning', 'Moving', 'Painting', 'Landscaping', 'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate
    navigate('/provider/onboarding/step-2');
  };

  const handleChange = (e) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const SidebarContent = (
    <>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                <h3 className="font-semibold text-gray-900">Pro Tip</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
                Providers with clear business descriptions and professional profile photos get <strong>3x more bookings</strong>. Make sure your profile stands out!
            </p>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">star</span>
                <h3 className="font-semibold text-gray-900">Provider Spotlight</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div>
                   <p className="text-sm font-bold text-gray-900">John D.</p>
                   <p className="text-xs text-gray-500">Electrician · 5.0 Rating</p>
                </div>
            </div>
            <p className="text-gray-600 text-xs italic">
                "TaskMate helped me grow my electrical business by 200% in just 3 months. The platform is easy to use and the customers are great!"
            </p>
        </div>
    </>
  );

  return (
    <OnboardingLayout title="Professional Information" step={1} sidebar={SidebarContent}>
      <div className="bg-surface-light rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-primary transition-colors cursor-pointer relative">
                  {formData.profileImage ? (
                    <img 
                      src={URL.createObjectURL(formData.profileImage)} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                       <span className="material-symbols-outlined text-gray-400 text-3xl mb-1">add_a_photo</span>
                       <p className="text-xs text-gray-500 font-medium">Upload Photo</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {formData.profileImage && (
                  <button 
                    type="button"
                    onClick={() => updateFiles({ profileImage: null })}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-100 text-red-500 hover:text-red-600"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                  placeholder="e.g. Green Leaf Landscaping"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                  placeholder="e.g. 08012345678"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 appearance-none bg-gray-50/50"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Years of Experience */}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                    placeholder="e.g. 5"
                    min="0"
                    required
                  />
               </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Description
                  <span className="ml-2 text-xs font-normal text-gray-400">Tell customers about your services</span>
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 resize-none bg-gray-50/50"
                  placeholder="We provide professional landscaping services..."
                  required
                />
              </div>

              {/* Address */}
               <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">location_on</span>
                    <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                    placeholder="123 Main St, City, State"
                    required
                    />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                Next Step
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default ProfessionalInfo;
