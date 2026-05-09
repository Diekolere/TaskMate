export const MOCK_USER_CUSTOMER = {
    id: 'mock-customer-123',
    uid: 'mock-customer-123',
    email: 'customer@taskmate.com',
    full_name: 'Diekolere Olaitan',
    displayName: 'Diekolere Olaitan',
    role: 'customer',
    avatar_url: 'https://i.pravatar.cc/150?u=customer',
    photoURL: 'https://i.pravatar.cc/150?u=customer',
    location_name: 'Lekki Phase 1, Lagos',
    trust_score: 85,
    is_active: true,
    saved_workers: ['mock-provider-1']
};

export const MOCK_USER_PROVIDER = {
    id: 'mock-provider-1',
    uid: 'mock-provider-1',
    email: 'provider@taskmate.com',
    full_name: 'Ibrahim Musa',
    displayName: 'Ibrahim Musa',
    role: 'provider',
    avatar_url: 'https://i.pravatar.cc/150?u=provider',
    photoURL: 'https://i.pravatar.cc/150?u=provider',
    location_name: 'Surulere, Lagos',
    trust_score: 92,
    is_active: true,
    kycCompleted: false,
    provider_profiles: {
        trade_category: ['electrician', 'plumber'],
        bio: 'Certified electrician with 10 years experience in residential wiring.',
        years_experience: 10,
        hourly_rate_min: 5000,
        hourly_rate_max: 15000,
        verification_status: 'verified',
        average_rating: 4.8,
        completed_jobs_count: 124
    }
};

export const MOCK_JOBS = [
    {
        id: 'job-1',
        customer_id: 'mock-customer-123',
        worker_id: 'mock-provider-1',
        title: 'Fix Kitchen Sink Leak',
        description: 'The pipe under the sink is leaking heavily. Needs urgent repair.',
        category: 'Plumbing',
        status: 'in_progress',
        budget_estimate: 8500,
        location_name: 'Lekki Phase 1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'job-2',
        customer_id: 'mock-customer-123',
        worker_id: null,
        title: 'Install Ceiling Fan',
        description: 'Need a professional to install 3 ceiling fans in the living room.',
        category: 'Electrical',
        status: 'open',
        budget_estimate: 12000,
        location_name: 'Lekki Phase 1',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
        id: 'job-3',
        customer_id: 'mock-customer-123',
        worker_id: 'mock-provider-2',
        title: 'A/C Servicing',
        description: 'Annual servicing for 4 split AC units.',
        category: 'AC Technician',
        status: 'completed',
        budget_estimate: 25000,
        final_amount: 25000,
        location_name: 'Lekki Phase 1',
        created_at: new Date(Date.now() - 604800000).toISOString(),
        updated_at: new Date(Date.now() - 518400000).toISOString()
    }
];

export const MOCK_PROVIDERS = [
    {
        id: 'mock-provider-1',
        full_name: 'Ibrahim Musa',
        avatar_url: 'https://i.pravatar.cc/150?u=p1',
        role: 'provider',
        trust_score: 92,
        is_active: true,
        provider_profiles: {
            trade_category: ['electrician'],
            verification_status: 'verified',
            average_rating: 4.8,
            completed_jobs_count: 124,
            hourly_rate_min: 5000
        }
    },
    {
        id: 'mock-provider-2',
        full_name: 'Sarah Chen',
        avatar_url: 'https://i.pravatar.cc/150?u=p2',
        role: 'provider',
        trust_score: 88,
        is_active: true,
        provider_profiles: {
            trade_category: ['ac technician'],
            verification_status: 'verified',
            average_rating: 4.6,
            completed_jobs_count: 89,
            hourly_rate_min: 7000
        }
    },
    {
        id: 'mock-provider-3',
        full_name: 'Babatunde Raji',
        avatar_url: 'https://i.pravatar.cc/150?u=p3',
        role: 'provider',
        trust_score: 95,
        is_active: true,
        provider_profiles: {
            trade_category: ['plumber'],
            verification_status: 'verified',
            average_rating: 4.9,
            completed_jobs_count: 210,
            hourly_rate_min: 6000
        }
    }
];
