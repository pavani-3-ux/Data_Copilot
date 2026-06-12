import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  query: string;
  dataset_summary: {
    row_count: number;
    column_count: number;
    columns: Array<{ name: string; type: string }>;
  };
  sample_data: Record<string, unknown>[];
}

interface AnalysisResponse {
  answer: string;
  chart_suggestion?: {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    x_column: string;
    y_column: string;
    title: string;
  };
  insights?: Array<{
    type: 'trend' | 'opportunity' | 'risk' | 'recommendation';
    title: string;
    description: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query, dataset_summary, sample_data } = await req.json() as AnalysisRequest;

    // Generate AI response based on the query and data context
    const response = await generateAIResponse(query, dataset_summary, sample_data);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function generateAIResponse(
  query: string,
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): Promise<AnalysisResponse> {
  const lowerQuery = query.toLowerCase();

  // Identify the type of question
  if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('growth')) {
    return generateTrendResponse(query, datasetSummary, sampleData);
  }

  if (lowerQuery.includes('top') || lowerQuery.includes('highest') || lowerQuery.includes('best') || lowerQuery.includes('most')) {
    return generateTopResponse(query, datasetSummary, sampleData);
  }

  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('versus')) {
    return generateComparisonResponse(query, datasetSummary, sampleData);
  }

  if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('overview')) {
    return generateSummaryResponse(datasetSummary, sampleData);
  }

  if (lowerQuery.includes('insight') || lowerQuery.includes('analysis') || lowerQuery.includes('pattern')) {
    return generateInsightResponse(datasetSummary, sampleData);
  }

  // Default: generic analysis
  return generateGenericResponse(query, datasetSummary, sampleData);
}

function generateTrendResponse(
  query: string,
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');
  const dateColumns = datasetSummary.columns.filter(c => c.type === 'date');

  const valueColumn = findBestColumn(query, numericColumns) || numericColumns[0]?.name || 'value';
  const dateColumn = dateColumns[0]?.name || 'date';

  return {
    answer: `Based on your query about trends, I've identified "${valueColumn}" as a key metric to analyze over time. The dataset contains ${datasetSummary.row_count} records with ${dateColumns.length} date/time columns and ${numericColumns.length} numeric columns for trend analysis. Trends can show growth patterns, seasonal variations, or declining performance that can inform business strategy.`,
    chart_suggestion: {
      type: 'line',
      x_column: dateColumn,
      y_column: valueColumn,
      title: `${valueColumn} Trend Over Time`
    },
    insights: [
      {
        type: 'trend',
        title: 'Time-Based Pattern Analysis',
        description: 'Analyzing temporal patterns can reveal seasonality, growth rates, and cyclical behaviors in your data.'
      }
    ]
  };
}

function generateTopResponse(
  query: string,
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');
  const textColumns = datasetSummary.columns.filter(c => c.type === 'string');

  const valueColumn = findBestColumn(query, numericColumns) || numericColumns[0]?.name || 'value';
  const categoryColumn = findBestColumn(query, textColumns) || textColumns[0]?.name || 'category';

  // Get top values from sample data
  const grouped = new Map<string, number>();
  for (const row of sampleData) {
    const key = String(row[categoryColumn] || 'Unknown');
    const val = Number(row[valueColumn]) || 0;
    grouped.set(key, (grouped.get(key) || 0) + val);
  }

  const topItems = Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topResponse = topItems.length > 0
    ? `Top performers: ${topItems.map((t, i) => `${i + 1}. ${t[0]} (${t[1].toLocaleString()})`).join(', ')}`
    : '';

  return {
    answer: `I've identified the top performers based on "${valueColumn}" grouped by "${categoryColumn}". ${topResponse}. This analysis can help you identify best-performing categories, products, or regions for strategic resource allocation.`,
    chart_suggestion: {
      type: 'bar',
      x_column: categoryColumn,
      y_column: valueColumn,
      title: `Top ${categoryColumn}s by ${valueColumn}`
    },
    insights: [
      {
        type: 'opportunity',
        title: 'Performance Leaders',
        description: topItems.length > 0 ? `${topItems[0][0]} leads with ${topItems[0][1].toLocaleString()} in ${valueColumn}. Focus resources on replicating this success.` : 'Top performers can guide strategic decisions.'
      }
    ]
  };
}

function generateComparisonResponse(
  query: string,
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');
  const textColumns = datasetSummary.columns.filter(c => c.type === 'string');

  return {
    answer: `Comparison analysis across ${textColumns.length} categorical dimensions and ${numericColumns.length} numeric metrics. Key comparison points include identifying gaps between segments, understanding relative performance, and finding opportunities for improvement through benchmarking.`,
    chart_suggestion: {
      type: 'bar',
      x_column: textColumns[0]?.name || 'category',
      y_column: numericColumns[0]?.name || 'value',
      title: 'Comparative Analysis'
    },
    insights: [
      {
        type: 'recommendation',
        title: 'Benchmarking Strategy',
        description: 'Comparing segments helps identify best practices that can be applied across the organization.'
      }
    ]
  };
}

function generateSummaryResponse(
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');
  const textColumns = datasetSummary.columns.filter(c => c.type === 'string');
  const dateColumns = datasetSummary.columns.filter(c => c.type === 'date');

  return {
    answer: `This dataset contains ${datasetSummary.row_count.toLocaleString()} records across ${datasetSummary.column_count} columns. Column breakdown: ${numericColumns.length} numeric, ${textColumns.length} text, and ${dateColumns.length} date columns. The data structure supports comprehensive analysis including aggregation, trend analysis, segmentation, and forecasting.`,
    insights: [
      {
        type: 'recommendation',
        title: 'Data Analysis Opportunities',
        description: `With ${numericColumns.length} numeric columns, you can perform statistical analysis, correlation studies, and predictive modeling on this dataset.`
      }
    ]
  };
}

function generateInsightResponse(
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');
  const textColumns = datasetSummary.columns.filter(c => c.type === 'string');

  return {
    answer: `Key insights from your dataset:\n\n1. **Data Structure**: ${datasetSummary.row_count.toLocaleString()} records with ${numericColumns.length} measurable metrics\n\n2. **Analytical Potential**: ${textColumns.length} categorical columns enable segmentation and comparative analysis\n\n3. **Opportunity Areas**: Consider analyzing correlations between ${numericColumns[0]?.name || 'metrics'} across different ${textColumns[0]?.name || 'categories'} to uncover hidden patterns.\n\n4. **Recommendation**: Focus on high-impact metrics and cross-segment analysis to derive actionable business intelligence.`,
    insights: [
      {
        type: 'key_finding',
        title: 'Data Composition Analysis',
        description: `The dataset provides ${numericColumns.length} quantitative metrics for performance tracking and ${textColumns.length} qualitative dimensions for segmentation.`
      },
      {
        type: 'trend',
        title: 'Metric Relationships',
        description: 'Strong potential for discovering correlations and causal relationships between key business metrics.'
      }
    ]
  };
}

function generateGenericResponse(
  query: string,
  datasetSummary: AnalysisRequest['dataset_summary'],
  sampleData: Record<string, unknown>[]
): AnalysisResponse {
  const numericColumns = datasetSummary.columns.filter(c => c.type === 'number');

  // Try to find relevant columns
  const relevantColumn = findBestColumn(query, datasetSummary.columns);

  return {
    answer: `I can help you analyze your data! Your dataset has ${datasetSummary.row_count} records and ${datasetSummary.column_count} columns including: ${datasetSummary.columns.map(c => c.name).join(', ')}.\n\nYou can ask me to:\n- Show summary statistics\n- Compare segments\n- Find top performers\n- Analyze trends\n- Generate insights\n\nWhat would you like to explore?`,
    insights: relevantColumn ? [
      {
        type: 'recommendation',
        title: 'Deep Dive Available',
        description: `The "${relevantColumn}" column appears relevant to your query. Consider exploring its distribution and relationships with other metrics.`
      }
    ] : undefined
  };
}

function findBestColumn(query: string, columns: Array<{ name: string; type: string }>): string | null {
  const lowerQuery = query.toLowerCase();
  for (const col of columns) {
    if (lowerQuery.includes(col.name.toLowerCase())) {
      return col.name;
    }
  }
  return null;
}
