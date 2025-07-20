import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Target, Clock } from 'lucide-react';

interface StockMetricsProps {
  symbol: string;
  metrics: {
    currentPrice: number;
    forecastPrice: number;
    confidence: number;
    volume: number;
    marketCap: string;
    pe: number;
    dayChange: number;
    dayChangePercent: number;
  };
}

export const StockMetrics = ({ symbol, metrics }: StockMetricsProps) => {
  const {
    currentPrice,
    forecastPrice,
    confidence,
    volume,
    marketCap,
    pe,
    dayChange,
    dayChangePercent
  } = metrics;

  const isPositive = dayChange >= 0;
  const forecastChange = forecastPrice - currentPrice;
  const forecastChangePercent = (forecastChange / currentPrice) * 100;
  const isForecastPositive = forecastChange >= 0;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success text-success-foreground';
    if (confidence >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Price</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
          <div className={`flex items-center text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}${dayChange.toFixed(2)} ({dayChangePercent.toFixed(2)}%)
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">30-Day Forecast</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${forecastPrice.toFixed(2)}</div>
          <div className={`flex items-center text-xs ${isForecastPositive ? 'text-success' : 'text-destructive'}`}>
            {isForecastPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isForecastPositive ? '+' : ''}${forecastChange.toFixed(2)} ({forecastChangePercent.toFixed(2)}%)
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Forecast Confidence</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{confidence}%</div>
          <Badge className={`text-xs ${getConfidenceColor(confidence)}`}>
            {confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low'} Confidence
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Volume</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(volume / 1000000).toFixed(1)}M</div>
          <p className="text-xs text-muted-foreground">
            24h trading volume
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{marketCap}</div>
          <p className="text-xs text-muted-foreground">
            Total market value
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P/E Ratio</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pe.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Price-to-earnings ratio
          </p>
        </CardContent>
      </Card>
    </div>
  );
};