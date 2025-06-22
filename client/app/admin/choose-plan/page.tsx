import React from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const Page = () => {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Choose Your Region</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Select your location to continue with the appropriate payment method.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
       <Link href="/admin/plan"><Button className="w-48">
          🇮🇳 Domestic (India)
        </Button></Link>
        <Link href="/admin/pricing"><Button className="w-48">
          🌍 International (Global)
        </Button></Link>
      </div>
    </div>
  );
};

export default Page;
