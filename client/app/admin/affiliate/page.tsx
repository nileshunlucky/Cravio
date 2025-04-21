"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Copy, Check } from "lucide-react";

interface AffiliateUser {
    email: string;
    ref_code: string;
    referredBy?: string;
    referralCount: number;
    commissionEarned: number;
    balance: number;
    paypal?: string; // Added the missing 'paypal' property
}

interface Withdrawal {
    date: string;
    amount: number;
    status: string; // "Pending", "Completed", or other possible statuses
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
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]); // Add withdrawals state

    // Fetch user data and withdrawal history
    useEffect(() => {
        const fetchUserData = async () => {
            // Check if clerkUser and email are available
            if (!clerkUser?.primaryEmailAddress?.emailAddress) {
                setLoading(false); // Ensure loading is set to false if no email is found
                return;
            }
    
            const email = clerkUser.primaryEmailAddress.emailAddress;
    
            try {
                setLoading(true); // Set loading to true before the fetch starts
                const res = await fetch(`https://cravio-ai.onrender.com/user/${email}`);
                if (!res.ok) throw new Error("Failed to fetch user data");
    
                const data = await res.json();
                setUserData(data);
                setWithdrawals(data.withdrawals);
            } catch (error) {
                console.error("Error fetching user data:", error)
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
            setUserData((prev) => prev ? { ...prev, paypal: paypalEmail } : null);
        }
    };

    const handleWithdraw = async () => {
        if (!userData?.paypal) {
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

    return (
        <motion.div
            className="w-full max-w-3xl mx-auto p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold mb-6 text-center">Affiliate Dashboard</h1>

            <Card className="mb-6 shadow-2xl rounded-2xl border border-gray-100">
                <CardContent className="p-6 space-y-4">
                    {loading ? (
                        <>
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </>
                    ) : (
                        <>
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
                            <p><strong>Balance:</strong> ${userData?.balance || 0}</p>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4 mt-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2">PayPal Email</h2>
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
                    {userData?.paypal && (
                        <p className="text-sm text-green-600">PayPal linked: {userData.paypal}</p>
                    )}
                </div>

                <div>
                    <Button
                        onClick={handleWithdraw}
                        className="rounded-xl bg-black text-white hover:bg-gray-800"
                        disabled={withdrawing || (userData?.balance || 0) < 25}
                    >
                        {withdrawing ? "Processing..." : "Withdraw Balance"}
                    </Button>
                </div>
            </div>

            {/* Withdrawal History Section */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Withdrawal History</h2>
                {withdrawals?.length === 0 ? (
                    <p>No withdrawal history available.</p>
                ) : (
                    <table className="table-auto w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border p-2">Date & Time</th>
                                <th className="border p-2">Amount</th>
                                <th className="border p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals?.map((withdrawal, index) => (
                                <tr key={index}>
                                    <td className="border p-2">{withdrawal.date}</td>
                                    <td className="border p-2">${withdrawal.amount}</td>
                                    <td className="border p-2">{withdrawal.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!userData?.ref_code && (
                <Card className="shadow-2xl rounded-2xl border border-gray-100">
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
        </motion.div>
    );
};

export default AffiliateDashboard;
