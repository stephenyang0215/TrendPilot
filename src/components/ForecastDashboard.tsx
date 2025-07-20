import { useState, useEffect } from 'react';
import { StockSearch } from './StockSearch';
import { StockChart } from './StockChart';
import { StockMetrics } from './StockMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertTriangle } from 'lucide-react';

// Mock data generator for demonstration
const generateMockData = (symbol: string) => {
  const basePrice = 150 + Math.random() * 200;
  const volatility = 0.02 + Math.random() * 0.03;
  
  // Generate historical data (last 30 days)
  const historicalData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const randomWalk = (Math.random() - 0.5) * volatility * basePrice;
    const price = Math.max(basePrice + randomWalk, 1);
    historicalData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(price.toFixed(2)),
      forecast: false
    });
  }

  // Generate forecast data (next 30 days)
  const forecastData = [];
  const lastPrice = historicalData[historicalData.length - 1].price;
  let currentPrice = lastPrice;
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const trend = (Math.random() - 0.4) * volatility * currentPrice; // Slight upward bias
    currentPrice = Math.max(currentPrice + trend, 1);
    forecastData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(currentPrice.toFixed(2)),
      forecast: true
    });
  }

  const finalForecastPrice = forecastData[29].price;
  const confidence = 65 + Math.random() * 25; // 65-90% confidence

  return {
    chartData: [...historicalData, ...forecastData],
    metrics: {
      currentPrice: lastPrice,
      forecastPrice: finalForecastPrice,
      confidence: Number(confidence.toFixed(0)),
      volume: Math.floor(5000000 + Math.random() * 50000000),
      marketCap: `$${(Math.random() * 500 + 100).toFixed(0)}B`,
      pe: Number((15 + Math.random() * 20).toFixed(1)),
      dayChange: Number(((Math.random() - 0.5) * 10).toFixed(2)),
      dayChangePercent: Number(((Math.random() - 0.5) * 5).toFixed(2))
    }
  };
};

export const ForecastDashboard = () => {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(generateMockData('AAPL'));

  useEffect(() => {
    if (selectedStock) {
      setLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        setStockData(generateMockData(selectedStock));
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedStock]);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stock Price Forecast
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered stock price predictions with advanced analytics
          </p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Powered by Machine Learning
            </Badge>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <StockSearch 
              onStockSelect={setSelectedStock}
              selectedStock={selectedStock}
            />
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  Analyzing {selectedStock} data and generating forecast...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <StockChart 
              symbol={selectedStock}
              data={stockData.chartData}
            />

            {/* Metrics */}
            <StockMetrics 
              symbol={selectedStock}
              metrics={stockData.metrics}
            />

            {/* Disclaimer */}
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-warning">Investment Disclaimer</p>
                    <p className="text-sm text-muted-foreground">
                      This forecast is for educational purposes only and should not be considered as financial advice. 
                      Stock prices are subject to market volatility and actual results may vary significantly. 
                      Always consult with a qualified financial advisor before making investment decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};