import { createContext, useContext, useState, useEffect } from 'react';

const ProviderOnboardingContext = createContext();

export function useProviderOnboarding() {
  return useContext(ProviderOnboardingContext);
}

export function ProviderOnboardingProvider({ children }) {
  const [onboardingData, setOnboardingData] = useState(() => {
    const savedData = localStorage.getItem('providerOnboardingData');
    return savedData ? JSON.parse(savedData) : {
      // Step 1: Professional Info
      businessName: '',
      category: '',
      phoneNumber: '',
      description: '',
      address: '',
      website: '',
      yearsOfExperience: '', // Moved profileImage to files state

      // Step 2: Service Details
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

  // We need separate state for files since they can't be in localStorage
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

  return (
    <ProviderOnboardingContext.Provider value={{ onboardingData, updateData, files, updateFiles }}>
      {children}
    </ProviderOnboardingContext.Provider>
  );
}
