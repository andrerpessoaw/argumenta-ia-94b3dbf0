import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function EvolucaoNotaChart({ dados }: { dados: { data: string; nota: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <XAxis dataKey="data" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
        <YAxis
          domain={[0, 1000]}
          ticks={[0, 250, 500, 750, 1000]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="nota"
          stroke="var(--brand-cyan)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--brand-cyan)" }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
