import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, uploadFile, generateFilePath } from '../lib/supabase';
import { toast } from 'sonner';

const ProviderOnboardingContext = createContext();

export function useProviderOnboarding() {
  return useContext(ProviderOnboardingContext);
}

export function ProviderOnboardingProvider({ children }) {
  const { currentUser, updateProviderProfile } = useAuth();

  const [onboardingData, setOnboardingData] = useState(() => {
    const savedData = localStorage.getItem('providerOnboardingData');
    return savedData ? JSON.parse(savedData) : {
      businessName: '',
      category: '',
      phoneNumber: '',
      description: '',
      address: '',
      website: '',
      yearsOfExperience: '',
      radius: 10,
      hourlyRate: '',
      minServiceFee: '',
      emergencyFee: '',
      availability: {
        monday: { active: true, start: '09:00', end: '17:00' },
        tuesday: { active: true, start: '09:00', end: '17:00' },
        wednesday: { active: true, start: '09:00', end: '17:00' },
        thursday: { active: true, start: '09:00', end: '17:00' },
        friday: { active: true, start: '09:00', end: '17:00' },
        saturday: { active: false, start: '10:00', end: '16:00' },
        sunday: { active: false, start: '10:00', end: '16:00' },
      },
      location: [6.5244, 3.3792],
      isNegotiable: false,
    };
  });

  const [files, setFiles] = useState({
    profileImage: null,
    idFront: null,
    businessLicense: null
  });

  useEffect(() => {
    localStorage.setItem('providerOnboardingData', JSON.stringify(onboardingData));
  }, [onboardingData]);

  const updateData = (newData) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const updateFiles = (newFiles) => {
    setFiles(prev => ({ ...prev, ...newFiles }));
  };

  /** Submit the full onboarding data to Supabase */
  const submitOnboarding = async () => {
    if (!currentUser) return;

    try {
      toast.loading('Submitting onboarding...', { id: 'onboard' });

      // Upload profile image if provided
      let avatarUrl = null;
      if (files.profileImage) {
        const path = generateFilePath(currentUser.id, files.profileImage.name);
        avatarUrl = await uploadFile('avatars', path, files.profileImage);
      }

      // Update profiles table
      const profileUpdate = {
        phone_number: onboardingData.phoneNumber,
        location_name: onboardingData.address,
      };
      if (avatarUrl) profileUpdate.avatar_url = avatarUrl;

      await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id);

      // Update provider_profiles
      const categories = onboardingData.category
        ? [onboardingData.category.toLowerCase()]
        : [];

      await supabase.from('provider_profiles').update({
        business_name: onboardingData.businessName,
        bio: onboardingData.description,
        trade_category: categories,
        years_experience: parseInt(onboardingData.yearsOfExperience) || 0,
        hourly_rate_min: parseFloat(onboardingData.hourlyRate) || null,
        min_service_fee: parseFloat(onboardingData.minServiceFee) || null,
        emergency_fee: parseFloat(onboardingData.emergencyFee) || null,
        is_negotiable: onboardingData.isNegotiable,
        service_radius_km: onboardingData.radius,
        website: onboardingData.website,
        address: onboardingData.address,
        coordinates: { lat: onboardingData.location[0], lng: onboardingData.location[1] },
        availability: onboardingData.availability,
      }).eq('id', currentUser.id);

      localStorage.removeItem('providerOnboardingData');
      toast.dismiss('onboard');
      toast.success('Onboarding complete!');
    } catch (error) {
      toast.dismiss('onboard');
      console.error('Onboarding submit error:', error);
      toast.error('Failed to submit onboarding');
      throw error;
    }
  };

  return (
    <ProviderOnboardingContext.Provider value={{ onboardingData, updateData, files, updateFiles, submitOnboarding }}>
      {children}
    </ProviderOnboardingContext.Provider>
  );
}
