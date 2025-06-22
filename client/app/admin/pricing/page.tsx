"use client";

import React, { useEffect } from "react";

const PayPalStarterPlanPage = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=AfH2GNeQH2_T7BifoYzD1y7AYICIQGS4gmWxt2asLGd5mzSWzFR9yRHfgoy4ZkJvy7WwsMEKbOTHR3UO&vault=true&intent=subscription";
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => {
      // @ts-ignore
      paypal.Buttons({
        style: {
          shape: "pill",
          color: "blue",
          layout: "horizontal",
          label: "subscribe",
        },
        createSubscription: function (data: any, actions: any) {
          return actions.subscription.create({
            plan_id: "P-68F416489F577771KNBLY3HA",
          });
        },
        onApprove: function (data: any, actions: any) {
          alert("Subscription successful! ID: " + data.subscriptionID);
        },
      }).render("#paypal-button-container-P-68F416489F577771KNBLY3HA");
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Starter</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Start your journey with a 7-day $1 trial. After that, only $19/month. Cancel anytime.
      </p>
      <div id="paypal-button-container-P-68F416489F577771KNBLY3HA" className="mt-6" />
    </div>
  );
};

export default PayPalStarterPlanPage;
