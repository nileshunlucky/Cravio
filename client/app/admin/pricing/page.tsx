"use client";

import React, { useEffect } from "react";

const PayPalStarterPlanPage = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AfH2GNeQH2_T7BifoYzD1y7AYICIQGS4gmWxt2asLGd5mzSWzFR9yRHfgoy4ZkJvy7WwsMEKbOTHR3UO&vault=true&intent=subscription";
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => {
      // @ts-expect-error: PayPal not typed globally
      window.paypal.Buttons({
        style: {
          shape: "pill",
          color: "blue",
          layout: "horizontal",
          label: "subscribe",
        },
        createSubscription: function (
          data: Record<string, unknown>,
          actions: { subscription: { create: (arg0: { plan_id: string }) => unknown } }
        ) {
          return actions.subscription.create({
            plan_id: "P-68F416489F577771KNBLY3HA",
          });
        },
        onApprove: function (data: { subscriptionID: string }) {
          alert("Subscription successful! ID: " + data.subscriptionID);
        },
      }).render("#paypal-button-container-P-68F416489F577771KNBLY3HA");
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold tracking-tight">Cravio AI – Starter Plan</h1>
        <p className="text-muted-foreground mt-2">
          Start your journey with a <strong>$1 for 7 days</strong> trial. Then continue with just <strong>$19/month</strong>. Cancel anytime.
        </p>
        <div id="paypal-button-container-P-68F416489F577771KNBLY3HA" className="mt-6 flex justify-center" />
      </div>
    </div>
  );
};

export default PayPalStarterPlanPage;
