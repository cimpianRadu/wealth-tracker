'use client';

import { useWealthStore } from '@/lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function AssetPieChart() {
  const { assets, displayCurrency, displayValue } = useWealthStore();

  const dataByCategory = assets.reduce((acc, asset) => {
    const cat = asset.category;
    acc[cat] = (acc[cat] || 0) + asset.valueRON;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(dataByCategory)
    .map(([category, valueRON]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: displayValue(valueRON),
      color: CATEGORY_COLORS[category] || '#6B7280',
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alocare Active</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          Adaugă active pentru a vedea distribuția
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alocare Active</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), displayCurrency)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
