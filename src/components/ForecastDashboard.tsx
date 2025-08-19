import { useState, useEffect } from 'react';
import { StockSearch } from './StockSearch';
import { StockChart } from './StockChart';
import { StockMetrics } from './StockMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockDataPoint {
  date: string;
  price: number;
  forecast?: boolean;
}

interface StockData {
  historical: StockDataPoint[];
  forecast: StockDataPoint[];
  metrics: {
    currentPrice: number;
    forecastPrice: number;
    confidence: number;
    volume: string;
    marketCap: string;
    peRatio: number;
    dayChange: number;
  };
}

const fetchStockData = async (symbol: string): Promise<{ chartData: StockDataPoint[]; metrics: any }> => {
  console.log('Fetching stock data for:', symbol);
  
  const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
    body: { symbol }
  });

  console.log('Edge function response:', { data, error });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to fetch stock data');
  }

  // Transform the data to match our component's expected format
  const chartData = [
    ...data.historical.map((point: StockDataPoint) => ({
      ...point,
      forecast: false
    })),
    ...data.forecast.map((point: StockDataPoint) => ({
      ...point,
      forecast: true
    }))
  ];

  return {
    chartData,
    metrics: data.metrics
  };
};

export const ForecastDashboard = () => {
  const [selectedStock, setSelectedStock] = useState('BTCUSD');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<{ chartData: StockDataPoint[]; metrics: any } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedStock) {
      console.log('useEffect triggered for stock:', selectedStock);
      setLoading(true);
      fetchStockData(selectedStock)
        .then((data) => {
          console.log('Successfully fetched data:', data);
          setStockData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching stock data:', error);
          toast({
            title: "Error",
            description: "Failed to fetch stock data. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [selectedStock, toast]);

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
        ) : stockData ? (
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
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No data available. Please try selecting a stock.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};