'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthPoint } from '@/lib/insights';
import { MEMBER_COLORS } from '@/lib/colors';


const fmt = (v: number) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(v);

export function MonthlyChart({
  series,
  members,
  selected,
}: {
  series: MonthPoint[];
  members: { userId: string; name: string }[];
  selected: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-line)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-line)',
              borderRadius: 10,
              color: 'var(--color-ink)',
            }}
            formatter={(value, name) => [`${fmt(Number(value))} RON`, String(name)]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as MonthPoint | undefined;
              return p ? `${p.label} · total ${fmt(p.total)} RON` : '';
            }}
          />
          {members.map((m, i) => (
            <Bar
              key={m.userId}
              dataKey={m.userId}
              name={m.name}
              stackId="a"
              fill={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              radius={i === members.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
              // Luna selectată rămâne plină, restul mai pale.
              fillOpacity={1}
              shape={(props: unknown) => {
                const p = props as { x: number; y: number; width: number; height: number; fill: string; payload: MonthPoint };
                return (
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={Math.max(0, p.height)}
                    fill={p.fill}
                    opacity={p.payload.month === selected ? 1 : 0.45}
                    rx={2}
                  />
                );
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
