"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Target, DollarSign, Edit2, Trash2, TrendingUp, Activity, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Lead {
  id: number;
  name: string;
  email: string;
  status: string;
  deal: number;
  date: string;
}

const CRMApp = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [leads, setLeads] = useState([
    { id: 1, name: "John Carter", email: "john@example.com", status: "Hot Lead", deal: 8200, date: "2024-11-10" },
    { id: 2, name: "Sarah Smith", email: "sarah@example.com", status: "Negotiation", deal: 3600, date: "2024-11-08" },
    { id: 3, name: "Michael Lee", email: "michael@example.com", status: "Proposal Sent", deal: 12000, date: "2024-11-05" },
    { id: 4, name: "Emma Wilson", email: "emma@example.com", status: "Hot Lead", deal: 5400, date: "2024-11-12" },
    { id: 5, name: "David Brown", email: "david@example.com", status: "Cold Lead", deal: 2100, date: "2024-11-01" },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "Cold Lead",
    deal: "",
  });

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalLeads = leads.length;
    const totalRevenue = leads.reduce((sum, lead) => sum + lead.deal, 0);
    const avgDealSize = totalLeads > 0 ? totalRevenue / totalLeads : 0;
    
    const statusCounts = leads.reduce((acc: Record<string, number>, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    
    const hotLeads = statusCounts["Hot Lead"] || 0;
    const conversionRate = totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0;
    
    const opportunities = leads.filter(l => 
      l.status === "Hot Lead" || l.status === "Negotiation"
    ).length;
    
    return {
      totalLeads,
      totalRevenue,
      avgDealSize,
      opportunities,
      conversionRate,
      statusDistribution: statusCounts,
    };
  }, [leads]);

  const handleAddLead = () => {
    setEditingLead(null);
    setFormData({ name: "", email: "", status: "Cold Lead", deal: "" });
    setIsDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      status: lead.status,
      deal: lead.deal.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLead = (id: number) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      setLeads(leads.filter(lead => lead.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.deal) return;
    
    if (editingLead) {
      setLeads(leads.map(lead => 
        lead.id === editingLead.id 
          ? { ...lead, ...formData, deal: parseFloat(formData.deal) }
          : lead
      ));
    } else {
      const newLead = {
        id: Math.max(...leads.map(l => l.id), 0) + 1,
        ...formData,
        deal: parseFloat(formData.deal),
        date: new Date().toISOString().split('T')[0],
      };
      setLeads([...leads, newLead]);
    }
    
    setIsDialogOpen(false);
  };

  const stats = [
    { 
      title: "Active Leads", 
      value: analytics.totalLeads.toString(), 
      icon: <Users className="w-6 h-6 text-blue-500" />,
      change: "+12%"
    },
    { 
      title: "Opportunities", 
      value: analytics.opportunities.toString(), 
      icon: <Target className="w-6 h-6 text-green-500" />,
      change: "+8%"
    },
    { 
      title: "Total Revenue", 
      value: `$${analytics.totalRevenue.toLocaleString()}`, 
      icon: <DollarSign className="w-6 h-6 text-yellow-500" />,
      change: "+24%"
    },
  ];

  const renderDashboard = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Sales Dashboard</h2>
        <Button 
          onClick={handleAddLead}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((item, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-green-500 mt-1">{item.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800">
                <tr className="text-zinc-400 text-sm">
                  <th className="py-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Deal Value</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <td className="py-3">{lead.name}</td>
                    <td className="py-3 text-zinc-400">{lead.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lead.status === "Hot Lead" ? "bg-red-500/20 text-red-400" :
                        lead.status === "Negotiation" ? "bg-yellow-500/20 text-yellow-400" :
                        lead.status === "Proposal Sent" ? "bg-blue-500/20 text-blue-400" :
                        "bg-zinc-500/20 text-zinc-400"
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">${lead.deal.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLead(lead)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderAnalytics = () => (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Analytics & Insights</h2>
        <p className="text-zinc-400 mt-2">Track your sales performance and trends</p>
      </div>

      {/* Advanced Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${analytics.avgDealSize.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Activity className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Users className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.statusDistribution["Hot Lead"] || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const percentage = (count / analytics.totalLeads) * 100;
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{status}</span>
                    <span className="text-sm text-zinc-400">{count} leads ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Deals */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Top Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...leads]
              .sort((a, b) => b.deal - a.deal)
              .slice(0, 5)
              .map((lead, i) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-zinc-400">{lead.status}</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">${lead.deal.toLocaleString()}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex ml-20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 hidden md:flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Mellvitta CRM
          </h1>
          <nav className="space-y-3">
            <button 
              onClick={() => setCurrentView("dashboard")}
              className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
                currentView === "dashboard" ? "bg-zinc-900" : "hover:bg-zinc-800"
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView("analytics")}
              className={`w-full text-left py-2 px-3 rounded-lg transition-colors ${
                currentView === "analytics" ? "bg-zinc-900" : "hover:bg-zinc-800"
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
        <div className="text-sm text-zinc-500">v1.0</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "leads" && renderDashboard()}
        {currentView === "analytics" && renderAnalytics()}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="Cold Lead">Cold Lead</SelectItem>
                    <SelectItem value="Warm Lead">Warm Lead</SelectItem>
                    <SelectItem value="Hot Lead">Hot Lead</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Closed Won">Closed Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deal">Deal Value ($)</Label>
                <Input
                  id="deal"
                  type="number"
                  value={formData.deal}
                  onChange={(e) => setFormData({ ...formData, deal: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
              >
                {editingLead ? "Update" : "Add"} Lead
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMApp;