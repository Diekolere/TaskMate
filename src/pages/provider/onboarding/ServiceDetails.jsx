import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useProviderOnboarding } from '../../../context/ProviderOnboardingContext';

const LocationSelector = ({ center, radius, setCenter }) => {
  useMapEvents({
    click(e) {
      setCenter([e.latlng.lat, e.latlng.lng]);
    },
  });
  return (
    <>
      <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#13ec5b', fillColor: '#13ec5b', fillOpacity: 0.2 }} />
      <div className="leaflet-bottom leaflet-right">

      </div>
    </>
  )
}

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { onboardingData, updateData } = useProviderOnboarding();
  const formData = onboardingData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateData({ [name]: type === 'checkbox' ? checked : value });
  };

  const setFormData = (newStateOrFunction) => {
    // Adapt old setFormData to updateData for specific complex updaters
    if (typeof newStateOrFunction === 'function') {
      const newData = newStateOrFunction(formData);
      updateData(newData);
    } else {
      updateData(newStateOrFunction);
    }
  };

  const handleDayToggle = (day) => {
    updateData({
      availability: {
        ...formData.availability,
        [day]: { ...formData.availability[day], active: !formData.availability[day].active }
      }
    });
  };

  const handleTimeChange = (day, field, value) => {
    updateData({
      availability: {
        ...formData.availability,
        [day]: { ...formData.availability[day], [field]: value }
      }
    });
  };


  const handleSliderChange = (e) => {
    updateData({ radius: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/provider/onboarding/step-3');
  };

  return (
    <OnboardingLayout title="Service Details" step={2}>
      <div className="bg-surface-light rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-10">

            {/* Service Area - Real Map */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Where do you work?</label>
                  <p className="text-xs text-gray-500">Tap on the map to set your center point and adjust the slider for radius.</p>
                </div>
                <span className="text-primary font-bold text-lg">{formData.radius} km</span>
              </div>

              <div className="h-80 rounded-2xl overflow-hidden border border-gray-200 mb-6 relative z-0">
                <MapContainer center={formData.location} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationSelector
                    center={formData.location}
                    radius={formData.radius}
                    setCenter={(coords) => setFormData({ ...formData, location: coords })}
                  />
                </MapContainer>
              </div>

              <input
                type="range"
                name="radius"
                min="1"
                max="50"
                value={formData.radius}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1 km</span>
                <span>50 km</span>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                <p className="text-sm text-gray-700">
                  <strong>Insight:</strong> You will receive requests from customers within a <strong>{formData.radius}km</strong> radius of the selected location.
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            {/* Weekly Availability */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">When do you work?</h3>
              <div className="space-y-3">
                {Object.entries(formData.availability).map(([day, schedule]) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                    <div className="flex items-center gap-3 w-32">
                      <input
                        type="checkbox"
                        checked={schedule.active}
                        onChange={() => handleDayToggle(day)}
                        className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="capitalize font-medium text-gray-700">{day}</span>
                    </div>
                    {schedule.active ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic flex-1">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Rate (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum fee (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                    <input
                      type="number"
                      name="minServiceFee"
                      value={formData.minServiceFee}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 bg-gray-50/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNegotiable"
                    checked={formData.isNegotiable}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">Is base pricing negotiable?</span>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/provider/onboarding/step-1')}
                className="text-gray-500 font-medium hover:text-gray-900 transition-colors"
              >
                Back
              </button>
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

export default ServiceDetails;
