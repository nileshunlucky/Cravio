"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Search, QrCode, Plus, Minus, ArrowUpDown, Grid3x3, User } from 'lucide-react';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreHorizontal } from 'lucide-react';

const Page = () => {
  const [activeTab, setActiveTab] = useState('home');

  const cryptoAssets = [
    { name: 'BTC', fullName: 'Bitcoin', amount: '0.06', value: '+2,319', change: '+0.24%', trend: 'up', price: '$38,650.00', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { name: 'BNB', fullName: 'BNB', amount: '12.48', value: '+2,729', change: '+0.07%', trend: 'up', price: '$218.60', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { name: 'ETH', fullName: 'Ethereum', amount: '3.77', value: '+8,234', change: '-0.15%', trend: 'down', price: '$2,183.45', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { name: 'SOL', fullName: 'Solana', amount: '45.23', value: '+4,125', change: '+2.34%', trend: 'up', price: '$91.20', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { name: 'XRP', fullName: 'XRP', amount: '1,234', value: '+678', change: '+1.23%', trend: 'up', price: '$0.55', icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
    { name: 'DOGE', fullName: 'Dogecoin', amount: '8,450', value: '+1,012', change: '-0.78%', trend: 'down', price: '$0.12', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
    
      {/* Header */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-6">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <img className="h-8 w-8 object-contain" src="https://images.seeklogo.com/logo-png/44/2/binance-smart-chain-bsc-logo-png_seeklogo-446621.png" />
          </div>
          {/* Exchange | Web3 (UI only) */}
  <div className="flex bg-zinc-900 rounded p-1">
    <div className="px-4 py-1.5 text-sm rounded text-gray-400">
      Exchange
    </div>
    <div className="px-4 py-1.5 text-sm rounded bg-zinc-800 text-white">
      Web3
    </div>
  </div>
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-gray-400" />
  
            <QrCode className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Balance Section */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-1">Total Balance</p>
          <div className="flex items-end gap-3 mb-4">
            <h1 className="text-4xl font-bold">$357,115.28</h1>
            <button className="bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-full mb-1">
              Add Funds
            </button>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+2.45%</span>
            <span className="text-gray-500 ml-2">24h</span>
          </div>
        </div>

        {/* Quick Actions */}
<div className="grid grid-cols-4 gap-4 mb-6">
  {[
    { label: 'Send', icon: ArrowUpRight },
    { label: 'Receive', icon: ArrowDownLeft },
    { label: 'Transfer', icon: ArrowLeftRight },
    { label: 'More', icon: MoreHorizontal },
  ].map((item, i) => (
    <button
      key={i}
      className="flex flex-col items-center justify-center gap-2 bg-zinc-900 rounded-2xl py-4 active:scale-95 transition"
    >
      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
        <item.icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs text-gray-300">{item.label}</span>
    </button>
  ))}
</div>


        {/* Watchlist & Coin Toggle */}
        <div className="flex gap-4 mb-4 border-b border-gray-800">
          <button className="text-yellow-400 pb-2 border-b-2 border-yellow-400 font-medium">
            Watchlist
          </button>
          <button className="text-gray-500 pb-2">Coin</button>
          <button className="text-gray-500 pb-2">NFT</button>
        </div>
      </div>

      {/* Crypto List */}
      <div className="px-4">
        {cryptoAssets.map((crypto, index) => (
          <div key={index} className="flex items-center justify-between py-4 border-b border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-900">
                <img src={crypto.icon} alt={crypto.name} className="w-8 h-8 object-contain" />
              </div>
              <div>
                <p className="font-medium">{crypto.name}</p>
                <p className="text-gray-500 text-sm">{crypto.amount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{crypto.value}</p>
              <div className="flex items-center justify-end gap-1">
                {crypto.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-sm ${crypto.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {crypto.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

     

    </div>
  );
};

export default Page;