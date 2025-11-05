"use client";
import { Stats } from "@/components/dashboard/Stats";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { PopularProducts } from "@/components/dashboard/PopularProducts";
import { MemberStatus } from "@/components/dashboard/MemberStatus";
import { ReferralsLevels } from "@/components/dashboard/ReferralsLevels";
import { YourAccessories } from "@/components/dashboard/YourAccessories";
import { YourEarnings } from "@/components/dashboard/YourEarnings";
import { LeadsGenerated } from "@/components/dashboard/LeadsGenerated";

export default function DashboardHome() {
  return (
    <div className="space-y-4">
      <Stats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <MemberStatus />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <ReferralsLevels />
        </div> 
        <div className="md:col-span-1 space-y-4">
          <YourAccessories />
          <YourEarnings />
        </div>
        <div className="md:col-span-3">
          <LeadsGenerated />
        </div>
      </div>
    </div>
  );
}
