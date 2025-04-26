"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Copy, Check, TrendingUp, CreditCard, DollarSign, Clock, Calendar } from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

interface AffiliateUser {
    email: string;
    ref_code: string;
    referredBy?: string;
    referralCount: number;
    commissionEarned: number;
    balance: number;
    credits: number;
    paypal_email: string;
    daily_revenue: { [key: string]: string }[];
    withdrawals: Withdrawal[];
}

interface Withdrawal {
    timestamp: string;
    amount: number;
    status: string; // "Pending", "Completed", "Paid" or other possible statuses
}

const AffiliateDashboard = () => {
    const { user: clerkUser } = useUser();
    const [userData, setUserData] = useState<AffiliateUser | null>(null);
    const [customCode, setCustomCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [updatingCode, setUpdatingCode] = useState(false);
    const [copied, setCopied] = useState(false);
    const [paypalEmail, setPaypalEmail] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [paypalMessage, setPaypalMessage] = useState("");
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [chartData, setChartData] = useState<Array<{ date: string; revenue: number }>>([]);
    const [selectedTab, setSelectedTab] = useState("revenue");

    // Format daily revenue data for chart
    const formatChartData = (dailyRevData: { [key: string]: string }[]) => {
        if (!dailyRevData || !Array.isArray(dailyRevData)) return [];

        return dailyRevData.map(dayData => {
            const dateKey = Object.keys(dayData)[0];
            return {
                date: dateKey,
                revenue: parseFloat(dayData[dateKey]) || 0
            };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    // Fetch user data and withdrawal history
    useEffect(() => {
        const fetchUserData = async () => {
            // Check if clerkUser and email are available
            if (!clerkUser?.primaryEmailAddress?.emailAddress) {
                setLoading(false);
                return;
            }

            const email = clerkUser.primaryEmailAddress.emailAddress;

            try {
                setLoading(true);
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
                if (!res.ok) throw new Error("Failed to fetch user data");

                const data = await res.json();
                setUserData(data);
                setPaypalEmail(data.paypal_email || "");
                setWithdrawals(data.withdrawals || []);
                setChartData(formatChartData(data.daily_revenue || []));
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [clerkUser]);

    const handleAddPaypal = async () => {
        if (!paypalEmail) return;
        const res = await fetch("https://cravio-ai.onrender.com/affiliate/add-paypal", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": clerkUser?.primaryEmailAddress?.emailAddress || "",
            },
            body: JSON.stringify({ paypal_email: paypalEmail }),
        });

        const data = await res.json();
        setPaypalMessage(data.message);
        if (data.success) {
            setUserData((prev) => prev ? { ...prev, paypal_email: paypalEmail } : null);
        }
    };

    const handleWithdraw = async () => {
        if (!userData?.paypal_email) {
            alert("Please add a PayPal email first.");
            return;
        }

        if ((userData?.balance || 0) < 25) {
            alert("Minimum $25 required to withdraw.");
            return;
        }

        setWithdrawing(true);
        const res = await fetch("https://cravio-ai.onrender.com/affiliate/withdraw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": clerkUser?.primaryEmailAddress?.emailAddress || "",
            },
            body: JSON.stringify({ amount: userData.balance }),
        });

        const data = await res.json();
        alert(data.message || "Withdrawal requested");
        if (data.success) {
            setUserData((prev) => (prev ? { ...prev, balance: 0 } : null));
        }

        setWithdrawing(false);
    };

    const handleCustomRefCode = async () => {
        if (!customCode || updatingCode || userData?.ref_code) return;
        setUpdatingCode(true);
        const res = await fetch("https://cravio-ai.onrender.com/affiliate/custom-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": clerkUser?.primaryEmailAddress?.emailAddress || "",
            },
            body: JSON.stringify({ ref_code: customCode }),
        });
        const data = await res.json();
        setMessage(data.message);
        if (data.success) {
            setUserData((prev) => (prev ? { ...prev, ref_code: customCode } : null));
        }
        setUpdatingCode(false);
    };

    const referralLink = `https://cravioai.vercel.app/?ref=${userData?.ref_code || "cravio"}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Calculate total revenue
    const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);

    // Get stats for showcase
    const getLastDayRevenue = () => {
        if (chartData.length === 0) return 0;
        return chartData[chartData.length - 1].revenue;
    };

    const CustomTooltip: React.FC<{ active?: boolean; payload?: { value: number }[]; label?: string }> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
                    <p className="font-medium">{label}</p>
                    <p className="text-emerald-500 font-bold">${payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            className="w-full max-w-6xl mx-auto p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold mb-6 text-center">Affiliate Dashboard</h1>

            {/* Quick Stats Cards */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="shadow-md rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                                <p className="text-2xl font-bold text-gray-900">${userData?.balance || 0}</p>
                                <p className="text-xs text-gray-400 mt-1">Available for withdrawal</p>
                            </div>
                            <div className="bg-black p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                                <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
                            </div>
                            <div className="bg-black p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="grid grid-cols-2 mb-6 rounded-xl">
                    <TabsTrigger value="revenue" className="rounded-l-xl">Revenue</TabsTrigger>
                    <TabsTrigger value="more" className="rounded-r-xl">Account & Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-6">
                    {/* Revenue Chart */}
                    <Card className="shadow-xl rounded-2xl border border-gray-100 overflow-hidden bg-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Daily Revenue
                                </h2>
                                <div className="text-xs sm:text-sm font-medium px-3 py-1 bg-black text-white rounded-full">
                                    ${totalRevenue.toFixed(2)}
                                </div>
                            </div>

                            {loading ? (
                                <Skeleton className="h-48 sm:h-64 w-full rounded-xl" />
                            ) : chartData.length > 0 ? (
                                <div className="h-48 sm:h-64 relative">
                                    {/* Dark overlay for premium look */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 opacity-30 rounded-lg pointer-events-none"></div>

                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 10,
                                                right: 5,
                                                left: 0,
                                                bottom: 5
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#000000" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => {
                                                    // Show shorter date format on mobile
                                                    const date = new Date(value);
                                                    return window.innerWidth < 640 ?
                                                        `${date.getMonth() + 1}/${date.getDate()}` :
                                                        value;
                                                }}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={30}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#000000"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>

                                    {/* Chart Legend - Added for premium feel */}
                                    <div className="absolute bottom-1 right-2 flex items-center space-x-2">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-black rounded-full mr-1"></div>
                                            <span className="text-xs text-gray-500">Revenue</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 sm:h-64 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <div className="bg-gray-100 p-3 rounded-full mb-2">
                                        <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">No revenue data available yet</p>
                                </div>
                            )}

                            {chartData.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4">
                                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                                        <p className="text-xs text-gray-500 mb-1">Last Day</p>
                                        <p className="font-bold">${getLastDayRevenue().toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                                        <p className="text-xs text-gray-500 mb-1">Avg. Daily</p>
                                        <p className="font-bold">${(totalRevenue / (chartData.length || 1)).toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Withdrawal History */}
                    <Card className="shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <Clock className="mr-2 h-5 w-5" />
                                Withdrawal History
                            </h2>

                            {loading ? (
                                <>
                                    <Skeleton className="h-10 w-full mb-2" />
                                    <Skeleton className="h-10 w-full mb-2" />
                                    <Skeleton className="h-10 w-full" />
                                </>
                            ) : withdrawals?.length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <p className="text-gray-500">No withdrawal history available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="p-3 text-left font-medium text-gray-600 border-b">Date & Time</th>
                                                <th className="p-3 text-right font-medium text-gray-600 border-b">Amount</th>
                                                <th className="p-3 text-center font-medium text-gray-600 border-b">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals?.map((withdrawal, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 border-b border-gray-100">{withdrawal.timestamp}</td>
                                                    <td className="p-3 text-right font-medium border-b border-gray-100">${withdrawal.amount}</td>
                                                    <td className="p-3 border-b border-gray-100 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${withdrawal.status === "paid" ? "bg-green-100 text-green-800" :
                                                            withdrawal.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-gray-100 text-gray-800"
                                                            }`}>
                                                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Withdraw Button */}
                            <div className="mt-4 flex justify-end">
                                <Button
                                    onClick={handleWithdraw}
                                    className="rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
                                    disabled={withdrawing || (userData?.balance || 0) < 25 || !userData?.paypal_email}
                                >
                                    {withdrawing ? "Processing..." : `Withdraw $${userData?.balance || 0}`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="more">
                    <div className="space-y-6">
                        {/* Referral Info Card */}
                        <Card className="shadow-xl rounded-2xl border border-gray-100">
                            <CardContent className="p-6 space-y-4">
                                {loading ? (
                                    <>
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-semibold">Referral Information</h2>
                                        <p><strong>Email:</strong> {userData?.email}</p>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium break-all">
                                                <strong>Your Referral Link:</strong> {referralLink}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleCopy}
                                                className="transition border rounded-full"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {copied ? (
                                                        <motion.div
                                                            key="check"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="copy"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Button>
                                        </div>
                                        <p><strong>Commission Rate:</strong> 20%</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Settings */}
                        <Card className="shadow-xl rounded-2xl border border-gray-100">
                            <CardContent className="p-6 space-y-4">
                                <h2 className="text-xl font-semibold">Payment Settings</h2>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">PayPal Email (Required for withdrawals)</p>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            placeholder="Enter PayPal email"
                                            type="email"
                                            value={paypalEmail}
                                            onChange={(e) => setPaypalEmail(e.target.value)}
                                            className="rounded-xl"
                                        />
                                        <Button onClick={handleAddPaypal} className="rounded-xl">
                                            Save
                                        </Button>
                                    </div>
                                    {paypalMessage && <p className="text-sm text-muted-foreground">{paypalMessage}</p>}
                                    {userData?.paypal_email && (
                                        <p className="text-sm text-green-600 mt-2">PayPal linked: {userData.paypal_email}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Custom Referral Code Card - Only shown if user doesn't have a code yet */}
                        {!userData?.ref_code && !loading && (
                            <Card className="shadow-xl rounded-2xl border border-gray-100">
                                <CardContent className="p-6 space-y-4">
                                    <h2 className="text-xl font-semibold">Set Custom Referral Code</h2>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            placeholder="Enter your unique referral code"
                                            value={customCode}
                                            onChange={(e) => setCustomCode(e.target.value)}
                                            disabled={updatingCode}
                                            className="rounded-xl lowercase"
                                        />
                                        <Button
                                            onClick={handleCustomRefCode}
                                            disabled={updatingCode || !customCode}
                                            className="rounded-xl"
                                        >
                                            {updatingCode ? "Saving..." : "Update"}
                                        </Button>
                                    </div>
                                    {message && (
                                        <p className="text-sm text-muted-foreground">{message}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default AffiliateDashboard;