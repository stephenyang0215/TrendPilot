import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  data: Array<{
    date: string;
    price: number;
    forecast?: boolean;
  }>;
}

export const StockChart = ({ symbol, data }: StockChartProps) => {
  const currentPrice = data.find(d => !d.forecast)?.price || 0;
  const forecastPrice = data.find(d => d.forecast)?.price || 0;
  const priceChange = forecastPrice - currentPrice;
  const priceChangePercent = (priceChange / currentPrice) * 100;
  const isPositive = priceChange >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold">
            ${payload[0].value.toFixed(2)}
            {data.forecast && (
              <span className="text-xs text-warning ml-2">(Forecast)</span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{symbol} Price Forecast</span>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <div className="text-right">
              <div className="text-lg font-bold">
                ${forecastPrice.toFixed(2)}
              </div>
              <div className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                fill="url(#priceGradient)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--warning))"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};