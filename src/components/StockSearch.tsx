import { useState, useEffect } from 'react';
import { Search, TrendingUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
  selectedStock: string;
}

interface StockInfo {
  symbol: string;
  name: string;
}

export const StockSearch = ({ onStockSelect, selectedStock }: StockSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableStocks, setAvailableStocks] = useState<StockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableStocks = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('list-stocks');
        
        if (error) {
          console.error('Error fetching available stocks:', error);
          return;
        }
        
        if (data?.stocks) {
          setAvailableStocks(data.stocks);
        }
      } catch (error) {
        console.error('Error fetching available stocks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableStocks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onStockSelect(searchTerm.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg bg-secondary/50 border-border focus:bg-secondary transition-colors"
        />
        <Button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
          size="sm"
        >
          Search
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Available Stocks
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableStocks.map((stock) => (
              <Button
                key={stock.symbol}
                variant={selectedStock === stock.symbol ? "default" : "secondary"}
                onClick={() => onStockSelect(stock.symbol)}
                className="text-left justify-start p-3 h-auto"
              >
                <div>
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};