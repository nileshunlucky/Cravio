'use client';

import React, { useState, useMemo } from 'react';
import { Users, DollarSign, Gift, TrendingUp } from "lucide-react";

// --- Type Definitions ---
// Define types for component props to resolve the TypeScript errors.
type UIComponentProps = {
  children: React.ReactNode;
  className?: string; // Optional since it has a default value
};

type SliderProps = {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
};

type RevenueChartProps = {
  revenue: number;
};

// --- Mock UI Components ---
// In a real app, these would be imported from a UI library like shadcn/ui
// I've recreated their basic structure and styling here for a complete example.

const Card = ({ children, className = '' }: UIComponentProps) => (
  <div className={`bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: UIComponentProps) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: UIComponentProps) => (
  <h3 className={`text-lg font-semibold text-white ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: UIComponentProps) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Slider = ({ value, onValueChange, min, max, step, className = '' }: SliderProps) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([Number(e.target.value)])}
    className={`w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer slider-thumb ${className}`}
  />
);

// --- Revenue Chart Component ---
// A dedicated component for the dynamic "Apple-style" chart.

const RevenueChart = ({ revenue }: RevenueChartProps) => {
  const width = 300;
  const height = 100;
  // We set a max revenue for visualization to make the chart feel responsive even at lower values.
  const maxRevenueForScale = 50000;

  // useMemo ensures that we only recalculate the complex SVG path when the revenue actually changes.
  const { areaPath, linePath, finalPoint } = useMemo(() => {
    // Use a logarithmic scale for a smoother visual increase at lower revenue levels.
    const revenueRatio = Math.min(Math.log(revenue + 1) / Math.log(maxRevenueForScale + 1), 1);
    const baseHeight = height * revenueRatio;

    const points = 20;
    let area_path = `M 0,${height}`;
    let line_path = `M 0,${height - baseHeight * (0.5 + (Math.sin(0 + revenue / 500) + 1) / 2 * 0.5)}`;
    let final_point = { x: 0, y: 0 };

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      // The wave's shape subtly changes with revenue for a dynamic feel.
      const randomFactor = (Math.sin(i * 0.4 + revenue / 500) + 1) / 2; // value between 0 and 1
      const y = height - baseHeight * (0.4 + randomFactor * 0.6);
      
      area_path += ` L ${x.toFixed(2)},${Math.max(0, y).toFixed(2)}`;
      line_path += ` L ${x.toFixed(2)},${Math.max(0, y).toFixed(2)}`;
      
      if (i === points) {
        final_point = { x, y: Math.max(0, y) };
      }
    }
    area_path += ` L ${width},${height} Z`;

    return { areaPath: area_path, linePath: line_path, finalPoint: final_point };
  }, [revenue]);

  return (
    <div className="relative w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Area fill path */}
        <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-700 ease-in-out" />
        
        {/* Stroke line path */}
        <path d={linePath} stroke="#DC2626" strokeWidth="2" fill="none" className="transition-all duration-700 ease-in-out" />
        
        {/* Glowing dot at the end of the line */}
        <circle cx={finalPoint.x} cy={finalPoint.y} r="4" fill="#DC2626" filter="url(#glow)" className="transition-all duration-700 ease-in-out" />
      </svg>
    </div>
  );
};


// --- Main Calculator Component ---

const CalculateRevenue = () => {
  const [influencers, setInfluencers] = useState(1);
  const [audience, setAudience] = useState(10000);
  const [price, setPrice] = useState(9.99);
  const [conversion, setConversion] = useState(2);
  const [tips, setTips] = useState(5);

  // Calculations
  const payingCustomers = Math.round(audience * (conversion / 100));
  const contentRevenue = (payingCustomers * price * influencers);
  const tipsRevenue = (payingCustomers * tips);
  const totalRevenue = (contentRevenue + tipsRevenue);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 sm:p-6 md:p-8">
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #B08D57;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider-thumb:hover::-webkit-slider-thumb {
          transform: scale(1.15);
          box-shadow: 0 4px 8px rgba(176, 141, 87, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #B08D57;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider-thumb:hover::-moz-range-thumb {
          transform: scale(1.15);
          box-shadow: 0 4px 8px rgba(176, 141, 87, 0.3);
        }
        .slider-thumb {
          background: #4a4a4a;
          border-radius: 10px;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-b from-zinc-200 to-zinc-400">
            Calculate Your Earning Potential
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Use the sliders to adjust your parameters and see how much you could earn with your premium AI influencer content.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Set Your Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Influencers */}
              <div>
                <label className="flex items-center justify-between mb-2 text-sm text-zinc-300">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#B08D57]" /> Number of AI Influencers</span>
                  <span className="font-medium text-white">{influencers}</span>
                </label>
                <Slider 
                  value={[influencers]} 
                  onValueChange={(val) => setInfluencers(val[0])}
                  min={1} max={10} step={1}
                />
              </div>

              {/* Audience Size */}
              <div>
                <label className="flex items-center justify-between mb-2 text-sm text-zinc-300">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#B08D57]" /> Your Audience Size</span>
                  <span className="font-medium text-white">{audience.toLocaleString()}</span>
                </label>
                <Slider 
                  value={[audience]} 
                  onValueChange={(val) => setAudience(val[0])}
                  min={1000} max={1000000} step={1000}
                />
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center justify-between mb-2 text-sm text-zinc-300">
                  <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#B08D57]" /> Premium Content Price</span>
                  <span className="font-medium text-white">${price.toFixed(2)}</span>
                </label>
                <Slider 
                  value={[price]} 
                  onValueChange={(val) => setPrice(val[0])}
                  min={1} max={50} step={0.5}
                />
              </div>

              {/* Conversion */}
              <div>
                <label className="flex items-center justify-between mb-2 text-sm text-zinc-300">
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#B08D57]" /> Conversion Rate</span>
                  <span className="font-medium text-white">{conversion}%</span>
                </label>
                <Slider 
                  value={[conversion]} 
                  onValueChange={(val) => setConversion(val[0])}
                  min={0.5} max={20} step={0.5}
                />
              </div>

              {/* Tips */}
              <div>
                <label className="flex items-center justify-between mb-2 text-sm text-zinc-300">
                  <span className="flex items-center gap-2"><Gift className="w-4 h-4 text-[#B08D57]" /> Average Tips per Buyer</span>
                  <span className="font-medium text-white">${tips}</span>
                </label>
                <Slider 
                  value={[tips]} 
                  onValueChange={(val) => setTips(val[0])}
                  min={0} max={50} step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right: Revenue */}
          <div className="space-y-8">
            <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-zinc-400 font-normal">Your Monthly Revenue Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl md:text-7xl font-bold text-white mb-4">
                    ${Math.round(totalRevenue).toLocaleString()}
                  </div>
                  <div className="w-full h-28 mx-auto -mb-4">
                    <RevenueChart revenue={totalRevenue} />
                  </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-zinc-400 mb-1">Paying Customers</div>
                    <div className="text-2xl font-semibold text-white">{payingCustomers.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{conversion}% of total audience</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-zinc-400 mb-1">Content Revenue</div>
                    <div className="text-2xl font-semibold text-white">${Math.round(contentRevenue).toLocaleString()}</div>
                </Card>
                 <Card className="p-4 sm:col-span-2">
                    <div className="text-sm text-zinc-400 mb-1">Tips Revenue</div>
                    <div className="text-2xl font-semibold text-white">${Math.round(tipsRevenue).toLocaleString()}</div>
                </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculateRevenue;