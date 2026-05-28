const fs = require('fs');
const file = 'd:/Taskmate/TaskMate/src/pages/customer/RequestStatus.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [activeTab, setActiveTab] = useState')) {
    content = content.replace(
        'const [expandedProviderId, setExpandedProviderId] = useState(null);',
        'const [expandedProviderId, setExpandedProviderId] = useState(null);\n    const [activeTab, setActiveTab] = useState(\'recommended\');'
    );
}

const startIndex = content.indexOf('{/* ── AI Recommended Providers ──────────────── */}');
const searchEndStr = '                        ) : null}';
const endIndex = content.indexOf(searchEndStr, startIndex) + searchEndStr.length;

if (startIndex === -1 || endIndex < startIndex) {
    console.error('Could not find bounds');
    process.exit(1);
}

const replacement = `{/* ── Filter Tabs & Providers (Public + Open) ──────────────── */}
                        {request.request_type === 'public' && normalizedStatus === 'open' ? (
                            <div className="mt-8 mb-8">
                                <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                                    <button 
                                        onClick={() => setActiveTab('recommended')}
                                        className={\`pb-3 text-sm font-bold transition-all relative \${activeTab === 'recommended' ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-600'}\`}
                                    >
                                        <div className="flex items-center gap-2">
                                            Recommended Matches
                                            <span className={\`px-2 py-0.5 rounded-full text-[10px] \${activeTab === 'recommended' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}\`}>
                                                {aiMatchedProviders.length}
                                            </span>
                                        </div>
                                        {activeTab === 'recommended' && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#10B981] rounded-t-full" />
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('interested')}
                                        className={\`pb-3 text-sm font-bold transition-all relative \${activeTab === 'interested' ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-600'}\`}
                                    >
                                        <div className="flex items-center gap-2">
                                            Interested Providers
                                            <span className={\`px-2 py-0.5 rounded-full text-[10px] \${activeTab === 'interested' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}\`}>
                                                {interestedProviders.length}
                                            </span>
                                        </div>
                                        {activeTab === 'interested' && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#10B981] rounded-t-full" />
                                        )}
                                    </button>
                                </div>

                                {/* Recommended Matches */}
                                {activeTab === 'recommended' && aiMatchedProviders.length > 0 && (
                                    <div className="space-y-0">
                                        {aiMatchedProviders.map((match, idx) => {
                                            const p = match.provider || {};
                                            const pp = match.provider_profile || {};
                                            return (
                                                <div key={match.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                    <div className="flex items-start gap-4">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                            <img 
                                                                src={p.photoURL || p.avatar_url || \`https://ui-avatars.com/api/?name=\${p.full_name || 'Artisan'}&background=random&color=334155\`} 
                                                                alt={p.full_name} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <h3 className="text-[15px] font-bold text-gray-900 truncate">
                                                                        {p.full_name}
                                                                    </h3>
                                                                    <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                                    <div className="flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0 ml-1">
                                                                        <span className="font-bold text-[10px] text-emerald-600 uppercase tracking-wide">{match.match_score}% Match</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                    <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                    <span className="text-[12px] font-bold text-gray-500">{pp.average_rating != null ? Number(pp.average_rating).toFixed(1) : '0.0'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Category & Location */}
                                                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                                {(() => {
                                                                    const cats = pp.trade_category || [];
                                                                    if (!cats.length) return <span>Uncategorized</span>;
                                                                    return (<>
                                                                        <span className="truncate font-bold text-gray-700 capitalize">{cats[0].toLowerCase()}</span>
                                                                        {cats.length > 1 && <span className="bg-[#10B981] text-white px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 ml-1">+{cats.length - 1}</span>}
                                                                    </>);
                                                                })()}
                                                                <span className="text-gray-200">·</span>
                                                                <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                            </p>

                                                            {/* Jobs & Rationale */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2.5">
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0 self-start">
                                                                    <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                    {pp.completed_jobs_count || '0'} jobs
                                                                </div>
                                                                <span className="text-[12px] text-gray-700 sm:truncate leading-snug">
                                                                    <span className="font-bold text-gray-900 mr-1">Rationale:</span>
                                                                    {match.ai_rationale}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Desktop Star Rating */}
                                                        <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                            <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                            <span className="font-bold text-[12px] text-gray-900">{pp.average_rating != null ? Number(pp.average_rating).toFixed(1) : '0.0'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Invite Button */}
                                                    <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                        <button 
                                                            disabled={invitedPros.has(match.provider_id)}
                                                            onClick={async () => {
                                                                const success = await inviteMatchedProvider(request.id, match.provider_id, request.title);
                                                                if (success) {
                                                                    setInvitedPros(prev => new Set(prev).add(match.provider_id));
                                                                }
                                                            }}
                                                            className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#10B981] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                        >
                                                            <span className="material-icons text-[14px]">
                                                                {invitedPros.has(match.provider_id) ? 'check' : 'person_add'}
                                                            </span>
                                                            {invitedPros.has(match.provider_id) ? 'Invited' : 'Invite'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Interested Providers */}
                                {activeTab === 'interested' && interestedProviders.length > 0 && (
                                    <div className="space-y-0">
                                        {interestedProviders.map((p, idx) => (
                                            <div key={p.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                        <img 
                                                            src={p.photoURL || p.avatar_url || \`https://ui-avatars.com/api/?name=\${p.displayName || p.full_name || 'Artisan'}&background=random&color=334155\`} 
                                                            alt={p.displayName || p.full_name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h3 className="text-[15px] font-bold text-gray-900 truncate transition-colors">
                                                                    {p.full_name || p.displayName}
                                                                </h3>
                                                                <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                            </div>
                                                            <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                <span className="text-[12px] font-bold text-gray-500">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Category & Location */}
                                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                            {(() => {
                                                                const cats = p.trade_category && p.trade_category.length > 0 ? p.trade_category : (p.category && p.category !== 'None' ? [p.category] : null);
                                                                if (!cats) return <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">None</span>;
                                                                return (<>
                                                                    <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">{cats[0]}</span>
                                                                    {cats.length > 1 && <span className="bg-[#10B981] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">+{cats.length - 1}</span>}
                                                                </>);
                                                            })()}
                                                            <span className="text-gray-200">·</span>
                                                            <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                        </p>

                                                        {/* Jobs */}
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
                                                                <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                {p.completedJobs || '0'} jobs
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desktop Star Rating */}
                                                    <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                        <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                        <span className="font-bold text-[12px] text-gray-900">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                    </div>
                                                </div>

                                                {/* Negotiate Button */}
                                                <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNegotiatingWith(p); }}
                                                        className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#0F172A] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <span className="material-icons text-[14px]">chat</span>
                                                        Negotiate
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Fallback for private or non-open public requests */
                            (request.request_type === 'private' || ['interested', 'provider_accepted', 'negotiating', 'awaiting_payment', 'payment_secured'].includes(normalizedStatus)) && interestedProviders.length > 0 ? (
                                <div className="mt-8 mb-8">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        {request.request_type === 'private' ? 'Targeted Provider' : normalizedStatus === 'provider_accepted' ? 'Providers who accepted' : 'Interested Providers'}
                                    </h3>
                                    <div className="space-y-0">
                                        {interestedProviders.map((p, idx) => (
                                            <div key={p.id} className="py-5 border-b border-gray-100 last:border-0 relative">
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                                        <img 
                                                            src={p.photoURL || p.avatar_url || \`https://ui-avatars.com/api/?name=\${p.displayName || p.full_name || 'Artisan'}&background=random&color=334155\`} 
                                                            alt={p.displayName || p.full_name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h3 className="text-[15px] font-bold text-gray-900 truncate">
                                                                    {p.full_name || p.displayName}
                                                                </h3>
                                                                <span className="material-icons text-[#10B981] text-[15px] shrink-0" title="Verified">verified</span>
                                                            </div>
                                                            <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                                                                <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                                <span className="text-[12px] font-bold text-gray-500">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Category & Location */}
                                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 truncate mt-1">
                                                            {(() => {
                                                                const cats = p.trade_category && p.trade_category.length > 0 ? p.trade_category : (p.category && p.category !== 'None' ? [p.category] : null);
                                                                if (!cats) return <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">None</span>;
                                                                return (<>
                                                                    <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">{cats[0]}</span>
                                                                    {cats.length > 1 && <span className="bg-[#10B981] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">+{cats.length - 1}</span>}
                                                                </>);
                                                            })()}
                                                            <span className="text-gray-200">·</span>
                                                            <span className="truncate">{p.location || 'Lagos, Nigeria'}</span>
                                                        </p>

                                                        {/* Jobs */}
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
                                                                <span className="material-icons-outlined text-[12px] text-gray-400">task_alt</span>
                                                                {p.completedJobs || '0'} jobs
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Desktop Star Rating */}
                                                    <div className="hidden sm:flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
                                                        <span className="material-icons text-yellow-500 text-[14px]">star</span>
                                                        <span className="font-bold text-[12px] text-gray-900">{p.rating != null ? Number(p.rating).toFixed(1) : '0.0'}</span>
                                                    </div>
                                                </div>

                                                {/* Negotiate Button */}
                                                <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-5 sm:right-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setNegotiatingWith(p); }}
                                                        className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-[#0F172A] text-white text-xs font-bold rounded-xl sm:rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <span className="material-icons text-[14px]">chat</span>
                                                        Negotiate
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null
                        )}`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log('Done!');
