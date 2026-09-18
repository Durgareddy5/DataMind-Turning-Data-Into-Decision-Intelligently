import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../../components/ui/Card.js";
import { useColorScheme } from "../../hooks/useColorScheme.js";
import { CATEGORICAL_DARK, CATEGORICAL_LIGHT, CHART_TEXT_DARK, CHART_TEXT_LIGHT, SERIES_1_DARK, SERIES_1_LIGHT } from "./palette.js";
import type { ChartSpec } from "../../types/api.js";

export function ChartPanel({ spec }: { spec: ChartSpec }) {
  const scheme = useColorScheme();
  const seriesColor = scheme === "dark" ? SERIES_1_DARK : SERIES_1_LIGHT;
  const categorical = scheme === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  const text = scheme === "dark" ? CHART_TEXT_DARK : CHART_TEXT_LIGHT;

  return (
    <Card title="Chart">
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={280}>
          {spec.chartType === "pie" ? (
            <PieChart>
              <Pie
                data={spec.data}
                dataKey={spec.yKey}
                nameKey={spec.xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                stroke={text.grid}
                strokeWidth={2}
              >
                {spec.data.map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Cell key={index} fill={categorical[index % categorical.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: text.secondary, fontSize: 13 }} />
              <Tooltip contentStyle={{ background: scheme === "dark" ? "#1a1a19" : "#fcfcfb", border: `1px solid ${text.grid}`, color: text.primary }} />
            </PieChart>
          ) : spec.chartType === "line" ? (
            <LineChart data={spec.data}>
              <CartesianGrid stroke={text.grid} vertical={false} />
              <XAxis dataKey={spec.xKey} stroke={text.muted} tick={{ fill: text.secondary, fontSize: 12 }} />
              <YAxis stroke={text.muted} tick={{ fill: text.secondary, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: scheme === "dark" ? "#1a1a19" : "#fcfcfb", border: `1px solid ${text.grid}`, color: text.primary }} />
              <Line type="monotone" dataKey={spec.yKey} stroke={seriesColor} strokeWidth={2} dot={{ r: 4, fill: seriesColor }} />
            </LineChart>
          ) : (
            <BarChart data={spec.data}>
              <CartesianGrid stroke={text.grid} vertical={false} />
              <XAxis dataKey={spec.xKey} stroke={text.muted} tick={{ fill: text.secondary, fontSize: 12 }} />
              <YAxis stroke={text.muted} tick={{ fill: text.secondary, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: scheme === "dark" ? "#1a1a19" : "#fcfcfb", border: `1px solid ${text.grid}`, color: text.primary }} />
              <Bar dataKey={spec.yKey} fill={seriesColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
