import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  data: Array<{
    date: string;
    price: number;
    forecast?: boolean;
  }>;
}

export const StockChart = ({ symbol, data }: StockChartProps) => {
  const currentPrice = data?.find(d => !d.forecast)?.price || 0;
  const forecastPrice = data?.find(d => d.forecast)?.price || 0;
  const priceChange = forecastPrice - currentPrice;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Separate historical and forecast data for better rendering
  const historicalData = data?.filter(d => !d.forecast) || [];
  const forecastData = data?.filter(d => d.forecast) || [];
  
  // Combine data with null values to create gaps between historical and forecast
  const chartData = [
    ...historicalData.map(d => ({ ...d, historical: d.price, forecast: null })),
    ...forecastData.map(d => ({ ...d, historical: null, forecast: d.price }))
  ];

  // Calculate nice Y-axis domain
  const allPrices = data?.map(d => d.price).filter(Boolean) || [];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1; // 10% padding
  const yMin = Math.max(0, minPrice - padding);
  const yMax = maxPrice + padding;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const historicalValue = payload.find((p: any) => p.dataKey === 'historical')?.value;
      const forecastValue = payload.find((p: any) => p.dataKey === 'forecast')?.value;
      const value = historicalValue || forecastValue;
      const isForecast = !!forecastValue;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold">
            ${value?.toFixed?.(2) || '0.00'}
            {isForecast && (
              <span className="text-xs text-warning ml-2">(Forecast)</span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    return (
      <div className="flex justify-center items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-chart-primary" />
          <span className="text-muted-foreground">Historical Data</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-muted-foreground">Forecast Data</span>
        </div>
      </div>
    );
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
                ${forecastPrice?.toFixed?.(2) || '0.00'}
              </div>
              <div className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}${priceChange?.toFixed?.(2) || '0.00'} ({priceChangePercent?.toFixed?.(2) || '0.00'}%)
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            >
              <defs>
                <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
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
                domain={[yMin, yMax]}
                tickCount={6}
                width={50}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}K`;
                  }
                  return `$${value.toFixed(0)}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Historical Data */}
              <Area
                type="monotone"
                dataKey="historical"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                fill="url(#historicalGradient)"
                connectNulls={false}
                name="Historical"
              />
              
              {/* Forecast Data */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#forecastGradient)"
                connectNulls={false}
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend />
      </CardContent>
    </Card>
  );
};