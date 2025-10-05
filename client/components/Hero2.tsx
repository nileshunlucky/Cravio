"use client";

import React, { useState } from "react";

const MonetizationCalculator = () => {
  const [influencers, setInfluencers] = useState<number | "">(1);
  const [audience, setAudience] = useState<number | "">(1000);
  const [price, setPrice] = useState<number | "">(9.99);
  const [conversion, setConversion] = useState<number | "">(2);
  const [tips, setTips] = useState<number | "">(5);

  const payingCustomers = (audience !== "" && conversion !== "") ? Math.floor((Number(audience) * Number(conversion)) / 100) : 0;
  const contentRevenue = (payingCustomers && influencers !== "" && price !== "") ? payingCustomers * Number(influencers) * Number(price) : 0;
  const tipsRevenue = (payingCustomers && influencers !== "" && tips !== "") ? payingCustomers * Number(influencers) * Number(tips) : 0;
  const totalRevenue = contentRevenue + tipsRevenue;

  const handleClear = () => {
    setInfluencers("");
    setAudience("");
    setPrice("");
    setConversion("");
    setTips("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-2xl mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#B08D57] to-[#d4b98b]">
          Calculate Your Earning Potential
        </h1>
        <p className="text-gray-400 text-lg">
          See how much you could earn with premium AI influencer content
        </p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-3xl">
        <h2 className="text-xl font-semibold mb-6 text-zinc-200">Set Your Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Number of AI Influencers</label>
            <input
              type="number"
              value={influencers}
              onChange={(e) => setInfluencers(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter number"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B08D57]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Your Audience Size</label>
            <input
              type="number"
              value={audience}
              onChange={(e) => setAudience(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter audience size"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B08D57]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Premium Content Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter price"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B08D57]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Conversion Rate (%)</label>
            <input
              type="number"
              value={conversion}
              onChange={(e) => setConversion(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter conversion rate"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B08D57]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Average Tips per Buyer ($)</label>
            <input
              type="number"
              value={tips}
              onChange={(e) => setTips(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter tips"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B08D57]/50"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleClear}
            className="px-5 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
          >
            Clear
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-2">Monthly Revenue Potential</p>
            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#B08D57] to-[#d4b98b]">
              {totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-2">Paying Customers</p>
            <p className="text-2xl font-semibold text-white">
              {payingCustomers > 0 ? payingCustomers : "—"}
            </p>
            {audience !== "" && conversion !== "" && payingCustomers > 0 && (
              <p className="text-sm text-zinc-500">
                {conversion}% of your total audience
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-2">Content Revenue</p>
            <p className="text-xl font-semibold text-white">
              {contentRevenue > 0 ? `$${contentRevenue.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-2">Tips Revenue</p>
            <p className="text-xl font-semibold text-white">
              {tipsRevenue > 0 ? `$${tipsRevenue.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetizationCalculator;
