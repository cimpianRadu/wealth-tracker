'use client';

import { useWealthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function MonthlyChart() {
  const { snapshots, displayCurrency, displayValue } = useWealthStore();

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evoluție Lunară</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground text-sm text-center">
          Salvează snapshots lunare pentru a vedea evoluția averii tale.
          <br />
          Sunt necesare minimum 2 snapshots.
        </CardContent>
      </Card>
    );
  }

  const chartData = snapshots.map(s => ({
    month: s.month,
    'Avere Netă': Math.round(displayValue(s.netWorth)),
    'Active': Math.round(displayValue(s.totalAssets)),
    'Datorii': Math.round(displayValue(s.totalDebts)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evoluție Lunară</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), displayCurrency)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Avere Netă"
              stroke="#1E40AF"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Active"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="Datorii"
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
