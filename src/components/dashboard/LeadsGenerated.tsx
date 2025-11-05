"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
// const chartData = [
//   { month: "Jan", leads: 12 },
//   { month: "Feb", leads: 19 },
//   { month: "Mar", leads: 8 },
//   { month: "Apr", leads: 23 },
//   { month: "May", leads: 15 },
//   { month: "Jun", leads: 31 },
// ];

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
};

export function LeadsGenerated() {
  const [chartData, setChartData] = useState([]);
  const { user } = useAuth();
  const defaultLeadData = [
    { month: "Jan", leads: 0 },
    { month: "Feb", leads: 0 },
    { month: "Mar", leads: 0 },
    { month: "Apr", leads: 0 },
    { month: "May", leads: 0 },
    { month: "Jun", leads: 0 },
    { month: "Jul", leads: 0 },
    { month: "Aug", leads: 0 },
    { month: "Sep", leads: 0 },
    { month: "Oct", leads: 0 },
    { month: "Nov", leads: 0 },
    { month: "Dec", leads: 0 },
  ];

  async function fetchAllLeadsData() {
    // const cardsSnapshot = await getDocs(collection(db, "cards"));

    const cardsQuery = query(
      collection(db, "cards"),
      where("uid", "==", user.uid)
    );
    const cardsSnapshot = await getDocs(cardsQuery);

    // Object to sum leads per month
    const monthlyLeads = {};

    cardsSnapshot.forEach((doc) => {
      const cardData = doc.data();
      const cardLeadsByMonth = cardData.cardLeadsGeneratedByMonth || {};

      // Sum leads per month
      for (const [monthKey, leads] of Object.entries(cardLeadsByMonth)) {
        monthlyLeads[monthKey] = (monthlyLeads[monthKey] || 0) + leads;
      }
    });

    // Map summed leads to defaultLeadData
    const mappedLeadData = defaultLeadData.map((item, index) => {
      const year = new Date().getFullYear();
      const month = String(index + 1).padStart(2, "0");
      const key = `${year}-${month}`;

      return {
        month: item.month,
        leads: monthlyLeads[key] ?? 0,
      };
    });

    console.log("mappedLeadData",mappedLeadData);

    setChartData(mappedLeadData);
    return mappedLeadData;
  }

  useEffect(() => {
    if (user) fetchAllLeadsData();
  }, [user]);
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Leads Generated
          <Crown size={16} className="text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-leads)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="var(--color-leads)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fillLeads)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
