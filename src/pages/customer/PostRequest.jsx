import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import MobileNavBar from '../../components/layout/MobileNavBar';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, setAddress }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Reverse Geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        setAddress(data.display_name);
                    }
                })
                .catch(err => console.error("Geocoding error:", err));
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};


const PostRequest = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check for an existing request passed for editing
    const editingRequest = location.state?.request;
    const providerId = location.state?.providerId || editingRequest?.providerId;
    const providerName = location.state?.providerName || editingRequest?.providerName;
    const initialCategory = location.state?.category || editingRequest?.category;

    const { createRequest, isSimulated } = useData();
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    
    // State initialization
    const [title, setTitle] = useState(editingRequest?.title || '');
    const [description, setDescription] = useState(editingRequest?.description || '');
    const [budget, setBudget] = useState(editingRequest?.budget || '');
    const [category, setCategory] = useState(initialCategory || '');
    const [urgency, setUrgency] = useState(editingRequest?.urgency || 'medium');
    
    // Address handling
    const [mapCenter, setMapCenter] = useState(
        editingRequest?.coordinates 
            ? [editingRequest.coordinates.lat, editingRequest.coordinates.lng] 
            : [6.5244, 3.3792]
    );
    const [markerPos, setMarkerPos] = useState(
        editingRequest?.coordinates 
            ? [editingRequest.coordinates.lat, editingRequest.coordinates.lng] 
            : null
    );
    const [address, setAddress] = useState(editingRequest?.location || '');
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(editingRequest?.image || null);

    useEffect(() => {
        // If editing, map is already set. If not editing, try user address/geo
        if (editingRequest) return; 

        if (currentUser?.location_name) {
            setAddress(currentUser.location_name);
            
            // Forward Geocode the address to show on map
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentUser.location_name)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const { lat, lon } = data[0];
                        const coords = [parseFloat(lat), parseFloat(lon)];
                        setMapCenter(coords);
                        setMarkerPos(coords);
                    }
                })
                .catch(err => console.error("Geocoding existing address error:", err));
        } else {
            // Only use current geolocation if NO address is set
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        setMapCenter([latitude, longitude]);
                        setMarkerPos([latitude, longitude]);
                        // Reverse geocode explicitly
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                            .then(res => res.json())
                            .then(data => {
                                if(data.display_name) setAddress(data.display_name);
                            });
                    },
                    (err) => console.error("Geolocation error:", err)
                );
            }
        }
    }, [currentUser]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        
        let fileUrl = editingRequest?.image || previewUrl;
        
        // Simulation: We don't upload the file, just use the blob preview
        if (!isSimulated && selectedFile) {
            // TODO: Implement Supabase Storage upload
            toast.info("Supabase storage upload not yet implemented.");
        }
        
        const data = {
            title: formData.get('title'),
            category: category, 
            budget: formData.get('budget'),
            description: formData.get('description'),
            location: address,
            coordinates: markerPos ? { lat: markerPos.lat || markerPos[0], lng: markerPos.lng || markerPos[1] } : null,
            urgency: urgency, 
            image: fileUrl,
            providerId: providerId || null,
            status: providerId ? 'Pending' : 'Open', 
            providerName: providerName || null,
            customerPhone: currentUser.phoneNumber || null, 
        };

        if (!data.title || !data.description || !data.location || !data.budget) {
            toast.error('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            if (editingRequest) {
                // TODO: Implement Supabase update
                toast.info("Update logic not yet migrated to Supabase.");
                navigate('/customer/dashboard');
            } else {
                 data.timeline = [
                    {
                        title: 'Request Posted',
                        description: 'Your request has been submitted successfully.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: new Date().toDateString(),
                        status: 'completed'
                    }
                ];
                await createRequest(data);
                toast.success('Request posted successfully!');
            }
            
            navigate('/customer/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Failed to post request.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="font-body bg-gray-50 text-gray-900 min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-6 lg:p-10 pb-24">
                    {/* Branding - Top Right */}
                    <div className="absolute top-6 right-6 lg:top-10 lg:right-10 flex items-center gap-2 pointer-events-none select-none opacity-80">
                        <img src="/icon.png" alt="TaskMate" className="h-6 w-6 object-contain" />
                        <span className="font-display font-bold text-lg text-green-700">TaskMate</span>
                    </div>

                    <div className="max-w-3xl mx-auto mt-8">
                        <div className="mb-8">
                            <Link className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-4 transition-colors" to="/customer/dashboard">
                                <span className="material-icons-outlined text-lg mr-1">arrow_back</span>
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Post a Request
                                {providerName && <span className="block text-xl text-green-600 font-medium mt-1">for {providerName}</span>}
                            </h1>
                            <p className="mt-2 text-gray-600">Describe the task you need help with in Lagos, Abuja, or anywhere in Nigeria.</p>
                        </div>

                        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                            <form className="p-6 space-y-8" onSubmit={handleSubmit}>
                                {/* Task Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <span className="material-icons-outlined text-green-600">edit_note</span>
                                        <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">Task Title</label>
                                            <input 
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 placeholder-gray-400 focus:outline-none border" 
                                                id="title" 
                                                name="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g., Fix leaking sink in kitchen" 
                                                type="text" 
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">Category</label>
                                                <select
                                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 border focus:outline-none ${category ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    id="category"
                                                    name="category"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    disabled={!!initialCategory} 
                                                >
                                                    {[
                                                        'Plumbing', 'Electrical', 'Cleaning', 
                                                        'Moving', 'Painting', 'Landscaping', 'Other'
                                                    ].includes(category) || !category ? null : <option value={category}>{category}</option>}
                                                    
                                                    <option value="Plumbing">Plumbing</option>
                                                    <option value="Electrical">Electrical</option>
                                                    <option value="Cleaning">Cleaning</option>
                                                    <option value="Moving">Moving</option>
                                                    <option value="Painting">Painting</option>
                                                    <option value="Landscaping">Landscaping</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                {category && <input type="hidden" name="category" value={category} />}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="budget">Budget (₦)</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <span className="text-gray-500 sm:text-sm">₦</span>
                                                    </div>
                                                    <input 
                                                        className="block w-full rounded-md border-gray-300 pl-8 focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 border focus:outline-none" 
                                                        id="budget" 
                                                        name="budget"
                                                        value={budget}
                                                        onChange={(e) => setBudget(e.target.value)}
                                                        placeholder="0.00" 
                                                        type="number" 
                                                        step="0.01" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">Description</label>
                                            <textarea 
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 placeholder-gray-400 border focus:outline-none" 
                                                id="description" 
                                                name="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Provide more details about the task..." 
                                                rows="4"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <span className="material-icons-outlined text-green-600">image</span>
                                        <h2 className="text-lg font-semibold text-gray-900">Images</h2>
                                    </div>
                                    <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50 transition-colors cursor-pointer group relative">
                                        <div className="text-center">
                                            {previewUrl ? (
                                                <div className="mb-4 relative inline-block">
                                                    <img src={previewUrl} alt="Preview" className="h-48 object-contain rounded-md shadow-sm" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setSelectedFile(null);
                                                            setPreviewUrl(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                                                    >
                                                        <span className="material-icons-outlined text-sm block">close</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="material-icons-outlined text-4xl text-gray-400 group-hover:text-green-600 transition-colors">cloud_upload</span>
                                            )}
                                            
                                            <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none" htmlFor="file-upload">
                                                    <span>{selectedFile ? 'Change file' : 'Upload a file'}</span>
                                                    <input 
                                                        className="sr-only" 
                                                        id="file-upload" 
                                                        name="file-upload" 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                                {!selectedFile && <p className="pl-1">or drag and drop</p>}
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Urgency */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                                        <span className="material-icons-outlined text-green-600">location_on</span>
                                        <h2 className="text-lg font-semibold text-gray-900">Location & Urgency</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">Service Location (Select on Map)</label>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <span className="material-icons-outlined text-gray-400 text-sm">place</span>
                                                    </div>
                                                    <input 
                                                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 border focus:outline-none bg-white shadow-sm" 
                                                        id="location" 
                                                        name="location" 
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        placeholder="Click on map to select location..." 
                                                        type="text" 
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                       <button 
                                                            type="button"
                                                            className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-1"
                                                            onClick={() => {
                                                                if (navigator.geolocation) {
                                                                    navigator.geolocation.getCurrentPosition((pos) => {
                                                                        setMarkerPos([pos.coords.latitude, pos.coords.longitude]);
                                                                        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                                                                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                                                                            .then(res => res.json())
                                                                            .then(data => data.display_name && setAddress(data.display_name));
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                           <span className="material-icons-outlined text-sm">my_location</span>
                                                           My Location
                                                       </button>
                                                    </div>
                                                </div>

                                                <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
                                                    <MapContainer 
                                                        center={mapCenter} 
                                                        zoom={13} 
                                                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                                                    >
                                                        <TileLayer
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        />
                                                        <LocationMarker position={markerPos} setPosition={setMarkerPos} setAddress={setAddress} />
                                                    </MapContainer>
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span className="material-icons-outlined text-sm">info</span>
                                                    Click on the map to pin the exact service location.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Urgency Level</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                <label className="cursor-pointer">
                                                    <input 
                                                        className="peer sr-only" 
                                                        name="urgency" 
                                                        type="radio" 
                                                        value="low"
                                                        checked={urgency === 'low'}
                                                        onChange={() => setUrgency('low')}
                                                    />
                                                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-green-500 peer-checked:ring-1 peer-checked:ring-green-500 peer-checked:bg-green-50 transition-all text-center">
                                                        <span className="material-icons-outlined text-gray-400 peer-checked:text-green-600 mb-1 block">hourglass_empty</span>
                                                        <span className="block text-sm font-medium text-gray-900">Low</span>
                                                        <span className="block text-xs text-gray-500">Within a week</span>
                                                    </div>
                                                </label>
                                                <label className="cursor-pointer">
                                                    <input 
                                                        className="peer sr-only" 
                                                        name="urgency" 
                                                        type="radio" 
                                                        value="medium"
                                                        checked={urgency === 'medium'}
                                                        onChange={() => setUrgency('medium')}
                                                    />
                                                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-green-500 peer-checked:ring-1 peer-checked:ring-green-500 peer-checked:bg-green-50 transition-all text-center">
                                                        <span className="material-icons-outlined text-gray-400 peer-checked:text-green-600 mb-1 block">schedule</span>
                                                        <span className="block text-sm font-medium text-gray-900">Medium</span>
                                                        <span className="block text-xs text-gray-500">Within 48 hours</span>
                                                    </div>
                                                </label>
                                                <label className="cursor-pointer">
                                                    <input 
                                                        className="peer sr-only" 
                                                        name="urgency" 
                                                        type="radio" 
                                                        value="high"
                                                        checked={urgency === 'high'}
                                                        onChange={() => setUrgency('high')}
                                                    />
                                                    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-red-500 peer-checked:ring-1 peer-checked:ring-red-500 peer-checked:bg-red-50 transition-all text-center">
                                                        <span className="material-icons-outlined text-gray-400 peer-checked:text-red-500 mb-1 block">priority_high</span>
                                                        <span className="block text-sm font-medium text-gray-900 peer-checked:text-red-600">Emergency</span>
                                                        <span className="block text-xs text-gray-500">ASAP</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4">
                                    <button className="w-full sm:w-auto px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" type="button">
                                        Save Draft
                                    </button>
                                    <button disabled={loading} className="w-full sm:w-auto px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="submit">
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <span className="material-icons-outlined text-sm">send</span>
                                                Post Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <p className="mt-4 text-center text-xs text-gray-400">
                            By posting, you agree to TaskMate's <Link className="underline hover:text-green-600" to="#">Terms of Service</Link> and <Link className="underline hover:text-green-600" to="#">Privacy Policy</Link>.
                        </p>
                    </div>
                </main>
                <MobileNavBar />
            </div>
        </div>
    );
};

export default PostRequest;
