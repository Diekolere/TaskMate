import React from 'react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0F172A] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 text-xs font-bold">
                <p>{payload[0].payload.name}</p>
                <p className="text-[#10B981]">₦{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

const EarningsChart = ({ 
    data, 
    height = 100, 
    showXAxis = false, 
    showYAxis = false,
    showDots = false 
}) => {
    // Transform simple array [S,M,T,W,T,F,S] into Recharts format
    const chartData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
        name: day,
        amount: data[i] || 0
    }));

    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="#f1f5f9" 
                    />

                    <XAxis 
                        dataKey="name" 
                        hide={!showXAxis}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                        dy={10}
                        padding={{ left: 10, right: 10 }}
                    />
                    
                    <YAxis 
                        hide={!showYAxis}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                        width={40}
                    />
                    
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: '#10B981', strokeWidth: 2, strokeDasharray: '5 5' }} 
                    />

                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10B981"
                        strokeWidth={3.5}
                        fillOpacity={1}
                        fill="url(#colorAmount)"
                        animationDuration={2000}
                        dot={showDots ? { r: 3, fill: '#fff', stroke: '#10B981', strokeWidth: 2 } : false}
                        activeDot={{ 
                            r: 6, 
                            fill: '#fff', 
                            stroke: '#10B981', 
                            strokeWidth: 3,
                            className: "shadow-lg"
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EarningsChart;
