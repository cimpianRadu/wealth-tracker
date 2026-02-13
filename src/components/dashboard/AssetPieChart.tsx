'use client';

import { useWealthStore } from '@/lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function AssetPieChart() {
  const { assets, displayCurrency, displayValue } = useWealthStore();

  const dataByCategory = assets.reduce((acc, asset) => {
    const cat = asset.category;
    acc[cat] = (acc[cat] || 0) + asset.valueRON;
    return acc;
  }, {} as Record<string, number>);

  const totalRON = Object.values(dataByCategory).reduce((a, b) => a + b, 0);

  const chartData = Object.entries(dataByCategory)
    .map(([category, valueRON]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: Math.round(displayValue(valueRON)),
      valueRON,
      percent: totalRON > 0 ? ((valueRON / totalRON) * 100) : 0,
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
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
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
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 w-full space-y-2">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(item.value, displayCurrency)}
                  </span>
                  <span className="font-semibold w-12 text-right">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
