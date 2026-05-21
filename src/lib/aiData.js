// ── Shared AI/ML data and utility functions for TaskMate ────────────────────

// Market price ranges per category (in Naira) — used for price estimator + fairness score
export const PRICE_RANGES = {
    Plumbing:          { min: 8000,  max: 35000, avg: 18000 },
    Electrical:        { min: 10000, max: 45000, avg: 22000 },
    Cleaning:          { min: 5000,  max: 20000, avg: 10000 },
    Carpentry:         { min: 12000, max: 60000, avg: 28000 },
    Painting:          { min: 15000, max: 80000, avg: 35000 },
    Landscaping:       { min: 8000,  max: 30000, avg: 15000 },
    Moving:            { min: 15000, max: 70000, avg: 30000 },
    'HVAC & AC Repair':{ min: 15000, max: 55000, avg: 28000 },
    'Home Security':   { min: 20000, max: 80000, avg: 40000 },
    'Interior Design': { min: 30000, max: 200000,avg: 80000 },
    'None': { min: 5000,  max: 30000, avg: 12000 },
    Other:             { min: 5000,  max: 50000, avg: 20000 },
};

// Get price range for a category (case-insensitive)
export const getPriceRange = (category) => {
    if (!category) return PRICE_RANGES.Other;
    const key = Object.keys(PRICE_RANGES).find(
        k => k.toLowerCase() === category.toLowerCase()
    );
    return PRICE_RANGES[key] || PRICE_RANGES.Other;
};

// Keyword → specific service label (title is weighted — checked separately first)
const TASK_KEYWORDS = [
    // Plumbing
    { keywords: ['sink', 'tap', 'faucet'],                              label: 'Sink & tap repair' },
    { keywords: ['pipe', 'pipes', 'piping', 'p-trap', 'corroded'],      label: 'Pipe replacement' },
    { keywords: ['drain', 'drainage', 'clog', 'blocked'],               label: 'Drain unblocking' },
    { keywords: ['toilet', 'wc', 'flush'],                              label: 'Toilet repair' },
    { keywords: ['water heater', 'geyser', 'boiler'],                   label: 'Water heater servicing' },
    { keywords: ['leak', 'leaking', 'leakage'],                         label: 'Leak repair' },
    // Electrical
    { keywords: ['socket', 'outlet', 'plug point'],                     label: 'Socket installation' },
    { keywords: ['wire', 'wiring', 'circuit', 'rewire'],                label: 'Electrical wiring' },
    { keywords: ['light', 'bulb', 'fitting', 'chandelier', 'lighting'], label: 'Lighting installation' },
    { keywords: ['fuse', 'breaker', 'tripped', 'power cut'],            label: 'Fuse & breaker repair' },
    { keywords: ['generator', 'inverter', 'ups'],                       label: 'Power backup servicing' },
    { keywords: ['electric', 'electrical', 'power', 'voltage', 'fault'],label: 'Electrical repair' },
    // HVAC
    { keywords: ['ac', 'air condition', 'aircon', 'cooling', 'hvac'],   label: 'AC servicing' },
    // Painting
    { keywords: ['paint', 'painting', 'repaint', 'wall coat'],          label: 'Wall painting' },
    { keywords: ['ceiling', 'pop', 'plaster'],                          label: 'Ceiling & plastering' },
    // Cleaning
    { keywords: ['clean', 'sweep', 'mop', 'scrub', 'vacuum'],          label: 'Deep cleaning' },
    { keywords: ['carpet', 'rug', 'upholster'],                         label: 'Carpet & upholstery cleaning' },
    // Moving
    { keywords: ['move', 'moving', 'relocation', 'pack', 'transport'],  label: 'Home relocation' },
    // Carpentry
    { keywords: ['wardrobe', 'cabinet', 'shelve', 'shelf'],             label: 'Cabinet & shelving' },
    { keywords: ['door', 'hinge', 'lock', 'handle'],                    label: 'Door repair & fitting' },
    { keywords: ['window', 'frame', 'glass', 'sliding'],                label: 'Window repair' },
    { keywords: ['tile', 'tiling', 'floor tile'],                       label: 'Tiling & flooring' },
    // Landscaping
    { keywords: ['fence', 'gate', 'compound'],                          label: 'Fence & gate installation' },
    { keywords: ['lawn', 'grass', 'garden', 'trim', 'mow'],             label: 'Lawn & garden care' },
    // General carpentry / fix
    { keywords: ['fix', 'repair', 'broken', 'replace', 'install'],      label: 'General repair' },
];

// Category-level fallback labels (more readable than raw category name)
const CATEGORY_FALLBACKS = {
    Plumbing:          'plumbing work',
    Electrical:        'electrical work',
    Cleaning:          'cleaning services',
    Carpentry:         'carpentry work',
    Painting:          'painting services',
    Landscaping:       'landscaping work',
    Moving:            'moving & relocation',
    'HVAC & AC Repair':'AC & HVAC servicing',
    'Home Security':   'security installation',
    'Interior Design': 'interior design',
    'None': 'general services',
    Other:             'this service type',
};

// Derive a specific task label from title + description
export const getSmartPriceLabel = (title = '', description = '', category = '') => {
    // Title carries more signal — check it first on its own
    const titleLower = title.toLowerCase();
    const titleMatch = TASK_KEYWORDS.find(({ keywords }) => keywords.some(kw => titleLower.includes(kw)));
    if (titleMatch) return titleMatch.label;

    // Fall back to full text
    const fullText = `${title} ${description}`.toLowerCase();
    const fullMatch = TASK_KEYWORDS.find(({ keywords }) => keywords.some(kw => fullText.includes(kw)));
    if (fullMatch) return fullMatch.label;

    // Fall back to readable category label
    return CATEGORY_FALLBACKS[category] || category || 'this service type';
};

// Return fairness label for a given price + category
export const getFairnessLabel = (price, category) => {
    const range = getPriceRange(category);
    const p = Number(price);
    if (!p || !range) return null;
    if (p < range.min * 0.6)  return { label: 'Very low',    color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    icon: '⚠️' };
    if (p < range.avg * 0.75) return { label: 'Below market', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: '↓' };
    if (p > range.max * 1.2)  return { label: 'Above market', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: '↑' };
    return                           { label: 'Fair price',   color: 'text-[#10B981]',  bg: 'bg-green-50',  border: 'border-green-200',  icon: '✓' };
};

// Compute a deterministic provider match score (0–100) for a given category
export const getMatchScore = (provider, category) => {
    const id = String(provider?.id || provider?.uid || '');
    const base = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 15; // 0–14 jitter
    const catMatch = (provider?.category || '').toLowerCase() === (category || '').toLowerCase() ? 12 : 0;
    const rating   = Math.round(((provider?.rating || 4.5) - 3) * 10); // 0–15
    const jobs     = Math.min(provider?.completedJobs || 0, 20);       // 0–20
    const raw = 55 + base + catMatch + rating + jobs;
    return Math.min(99, Math.max(72, raw));
};

// Smart description enrichment — returns an improved description based on raw input
export const enrichDescription = (rawText, category) => {
    // We no longer add performative templates. 
    // We just ensure it starts with a capital letter and ends with punctuation.
    const text = rawText.trim();
    if (!text) return text;
    
    let improved = text.charAt(0).toUpperCase() + text.slice(1);
    if (!['.', '!', '?'].includes(improved.slice(-1))) {
        improved += '.';
    }
    
    return improved;
};
