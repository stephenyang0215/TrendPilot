import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BlobServiceClient } from "npm:@azure/storage-blob@12.17.0";
import { Buffer } from "node:buffer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function streamToUint8Array(stream: any): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => {
      chunks.push(new Uint8Array(chunk));
    });
    
    stream.on('end', () => {
      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(result);
    });
    
    stream.on('error', (error: any) => {
      reject(error);
    });
  });
}

async function fetchFromAzureStorage(containerName: string, blobPath: string): Promise<string> {
  const storageAccount = Deno.env.get('AZURE_STORAGE_ACCOUNT');
  const connectionString = Deno.env.get('AZURE_STORAGE_CONNECTION_STRING');
  
  if (!storageAccount) {
    throw new Error('Azure storage account not configured');
  }
  
  if (!connectionString) {
    throw new Error('Azure storage connection string not configured');
  }
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  
  // Get container and blob clients
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobPath);
  
  try {
    // Download blob content
    const downloadResponse = await blobClient.download();
    console.log('Download Response:', downloadResponse);
    
    // Check if readableStreamBody exists
    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream body found');
    }
    
    // Convert Node.js stream to Uint8Array
    const blobContent = await streamToUint8Array(downloadResponse.readableStreamBody);
    return new TextDecoder().decode(blobContent);
  } catch (error) {
    console.error('Error downloading blob:', error);
    throw error;
  }
}

function parseCSV(csvContent: string, isHistorical: boolean = true): StockDataPoint[] {
  const lines = csvContent.trim().split('\n');
  const data: StockDataPoint[] = [];
  
  if (lines.length < 2) {
    console.log('CSV content is empty or has no data rows');
    return data;
  }
  
  // Parse header row to find column indices
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  console.log('CSV headers:', headers);
  
  const dateCol = headers.findIndex(h => h === 'ds');
  const priceCol = isHistorical 
    ? headers.findIndex(h => h === 'c')
    : headers.findIndex(h => h === 'pred_price');
  
  console.log(`Column indices - Date: ${dateCol}, Price: ${priceCol} (${isHistorical ? 'historical' : 'forecast'})`);
  
  if (dateCol === -1 || priceCol === -1) {
    console.error('Required columns not found. Expected: ds and', isHistorical ? 'c' : 'pred_price');
    return data;
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    
    if (columns.length > Math.max(dateCol, priceCol)) {
      const dateStr = columns[dateCol].trim().replace(/"/g, '');
      const priceStr = columns[priceCol].trim().replace(/"/g, '');
      
      const price = parseFloat(priceStr);
      if (!isNaN(price) && dateStr) {
        data.push({
          date: dateStr,
          price: price
        });
      }
    }
  }
  
  console.log(`Parsed ${data.length} data points from ${isHistorical ? 'historical' : 'forecast'} CSV`);
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateMetrics(historical: StockDataPoint[], forecast: StockDataPoint[]) {
  const currentPrice = historical[historical.length - 1]?.price || 0;
  const forecastPrice = forecast[forecast.length - 1]?.price || 0;
  const previousPrice = historical[historical.length - 24]?.price || currentPrice;
  
  const dayChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const priceRange = Math.max(...historical.map(d => d.price)) - Math.min(...historical.map(d => d.price));
  const confidence = Math.min(95, Math.max(60, 85 - (priceRange / currentPrice) * 100));
  
  return {
    currentPrice,
    forecastPrice,
    confidence: Math.round(confidence),
    volume: "1.2M",
    marketCap: "850.2B", 
    peRatio: 28.5,
    dayChange: Math.round(dayChange * 100) / 100
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    const stockSymbol = symbol.toLowerCase() || 'btcusd';
    
    console.log(`Fetching data for symbol: ${stockSymbol}`);
    
    const containerName = Deno.env.get('AZURE_CONTAINER_NAME') || 'symbols';
    
    // Fetch historical data
    const historicalPath = `${stockSymbol}/hour/1/data/${stockSymbol}_historical.csv`;
    const forecastPath = `${stockSymbol}/hour/1/forecast/${stockSymbol}_forecast.csv`;
    
    console.log(`Fetching historical data from: ${historicalPath}`);
    console.log(`Fetching forecast data from: ${forecastPath}`);
    
    const [historicalCSV, forecastCSV] = await Promise.all([
      fetchFromAzureStorage(containerName, historicalPath),
      fetchFromAzureStorage(containerName, forecastPath)
    ]);
    
    console.log('Successfully fetched CSV data from Azure');
    
    // Parse CSV data
    const historical = parseCSV(historicalCSV, true);
    const forecastData = parseCSV(forecastCSV, false).map(point => ({
      ...point,
      forecast: true
    }));
    
    console.log(`Parsed ${historical.length} historical points and ${forecastData.length} forecast points`);
    
    // Calculate metrics
    console.log('Calculating metrics...');
    const metrics = calculateMetrics(historical, forecastData);
    console.log('Metrics calculated:', metrics);
    
    const response: StockData = {
      historical,
      forecast: forecastData,
      metrics
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-stock-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch stock data from Azure storage'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});