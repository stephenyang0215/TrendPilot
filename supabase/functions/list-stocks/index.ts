import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BlobServiceClient } from "npm:@azure/storage-blob@12.17.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockInfo {
  symbol: string;
  name: string;
}

async function listAvailableStocks(): Promise<StockInfo[]> {
  const storageAccount = Deno.env.get('AZURE_STORAGE_ACCOUNT');
  const connectionString = Deno.env.get('AZURE_STORAGE_CONNECTION_STRING');
  
  if (!storageAccount) {
    throw new Error('Azure storage account not configured');
  }
  
  if (!connectionString) {
    throw new Error('Azure storage connection string not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerName = Deno.env.get('AZURE_CONTAINER_NAME') || 'symbols';
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const stocks: StockInfo[] = [];
  const folderSet = new Set<string>();

  try {
    // List all blobs in the container
    for await (const blob of containerClient.listBlobsFlat()) {
      // Extract the first part of the path (folder name/symbol)
      const pathParts = blob.name.split('/');
      if (pathParts.length > 0) {
        const symbol = pathParts[0].toUpperCase();
        folderSet.add(symbol);
      }
    }

    // Convert to array and create stock info objects
    Array.from(folderSet).forEach(symbol => {
      stocks.push({
        symbol,
        name: getStockName(symbol)
      });
    });

    return stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
  } catch (error) {
    console.error('Error listing stocks from Azure storage:', error);
    throw error;
  }
}

function getStockName(symbol: string): string {
  // Map of known stock symbols to names
  const stockNames: Record<string, string> = {
    'BTCUSD': 'Bitcoin USD cryptocurrency',
    'SPY': 'SPDR S&P 500 ETF Trust',
    'QQQ': 'Invesco QQQ Trust, Series 1',
    'GME': 'GameStop Corp',
    'CHWY': 'Chewy Inc',
    'SMCI': 'Super Micro Computer Inc',
    'AAPL': 'Apple Inc',
    'GOOGL': 'Alphabet Inc',
    'MSFT': 'Microsoft Corporation',
    'TSLA': 'Tesla Inc',
    'AMZN': 'Amazon.com Inc',
    'NVDA': 'NVIDIA Corporation',
    'META': 'Meta Platforms Inc'
  };

  return stockNames[symbol] || `${symbol} Stock`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Listing available stocks from Azure storage...');
    
    const stocks = await listAvailableStocks();
    
    console.log(`Found ${stocks.length} available stocks`);
    
    return new Response(JSON.stringify({ stocks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in list-stocks function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to list stocks from Azure storage'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});