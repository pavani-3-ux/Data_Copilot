import type { Dataset, ChartConfig, Insight } from '../types';
import { profileColumn } from '../utils/dataProcessing';
import { colors } from '../utils/helpers';

interface AIResponse {
  answer: string;
  chart?: ChartConfig;
  queryResult?: Record<string, unknown>[];
  insights?: Insight[];
}

// Analyze user query and generate response
export async function processUserQuery(
  query: string,
  dataset: Dataset,
  data: Record<string, unknown>[]
): Promise<AIResponse> {
  const lowerQuery = query.toLowerCase();

  // Identify query intent
  const intent = identifyQueryIntent(lowerQuery, dataset);

  // Generate response based on intent
  let response: AIResponse = {
    answer: '',
  };

  switch (intent.type) {
    case 'summary':
      response = generateSummaryResponse(dataset, data);
      break;
    case 'aggregation':
      response = generateAggregationResponse(query, intent, dataset, data);
      break;
    case 'comparison':
      response = generateComparisonResponse(intent, dataset, data);
      break;
    case 'trend':
      response = generateTrendResponse(intent, dataset, data);
      break;
    case 'top_bottom':
      response = generateTopBottomResponse(intent, dataset, data);
      break;
    case 'insight':
      response = generateInsightResponse(dataset, data);
      break;
    default:
      response = generateGenericResponse(query, dataset, data);
  }

  return response;
}

// Query Intent Types
type QueryIntentType = 'summary' | 'aggregation' | 'comparison' | 'trend' | 'top_bottom' | 'insight' | 'general';

interface QueryIntent {
  type: QueryIntentType;
  columns: string[];
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  limit?: number;
  order?: 'asc' | 'desc';
}

// Identify the intent of user's query
function identifyQueryIntent(query: string, dataset: Dataset): QueryIntent {
  const numericColumns = dataset.columns.filter((c) => c.type === 'number').map((c) => c.name.toLowerCase());
  const textColumns = dataset.columns.filter((c) => c.type === 'string').map((c) => c.name.toLowerCase());

  // Check for summary request
  if (query.includes('summary') || query.includes('overview') || query.includes('statistics')) {
    return { type: 'summary', columns: [] };
  }

  // Check for insight generation
  if (query.includes('insight') || query.includes('analysis') || query.includes('tell me about')) {
    return { type: 'insight', columns: [] };
  }

  // Check for top/bottom queries
  const topMatch = query.match(/top\s*(\d+)?/);
  const bottomMatch = query.match(/bottom\s*(\d+)?/);
  if (topMatch || bottomMatch || query.includes('highest') || query.includes('lowest') || query.includes('best') || query.includes('worst')) {
    const limit = parseInt(query.match(/\d+/)?.[0] || '10');
    const matchedColumns = dataset.columns
      .filter((c) => query.includes(c.name.toLowerCase()))
      .map((c) => c.name);

    // Find numeric column for aggregation
    const aggColumn = matchedColumns.find((c) =>
      dataset.columns.find((dc) => dc.name === c && dc.type === 'number')
    ) || numericColumns[0];

    // Find group column
    const groupColumn = matchedColumns.find((c) =>
      dataset.columns.find((dc) => dc.name === c && dc.type === 'string')
    ) || textColumns[0];

    return {
      type: 'top_bottom',
      columns: [groupColumn, aggColumn],
      limit,
      order: bottomMatch ? 'asc' : 'desc',
    };
  }

  // Check for trend/time-based queries
  if (query.includes('trend') || query.includes('over time') || query.includes('monthly') || query.includes('yearly') || query.includes('growth')) {
    const dateColumns = dataset.columns.filter((c) => c.type === 'date').map((c) => c.name);
    const matchedColumns = dataset.columns
      .filter((c) => query.includes(c.name.toLowerCase()))
      .map((c) => c.name);

    return {
      type: 'trend',
      columns: [dateColumns[0] || textColumns[0], matchedColumns[0] || numericColumns[0]],
    };
  }

  // Check for comparison queries
  if (query.includes('compare') || query.includes('difference') || query.includes('versus') || query.includes('vs')) {
    const matchedColumns = dataset.columns
      .filter((c) => query.includes(c.name.toLowerCase()))
      .map((c) => c.name);

    return {
      type: 'comparison',
      columns: matchedColumns.length >= 2 ? matchedColumns : [textColumns[0], numericColumns[0]],
    };
  }

  // Check for aggregation queries
  const aggMatch = query.match(/(total|sum|average|avg|count|max|min)/);
  if (aggMatch) {
    const aggregationType: QueryIntent['aggregation'] =
      aggMatch[1] === 'total' || aggMatch[1] === 'sum' ? 'sum' :
      aggMatch[1] === 'average' || aggMatch[1] === 'avg' ? 'avg' :
      aggMatch[1] === 'count' ? 'count' :
      aggMatch[1] === 'max' ? 'max' : 'min';

    const matchedColumns = dataset.columns
      .filter((c) => query.includes(c.name.toLowerCase()))
      .map((c) => c.name);

    return {
      type: 'aggregation',
      columns: matchedColumns.length > 0 ? matchedColumns : [numericColumns[0]],
      aggregation: aggregationType,
    };
  }

  return { type: 'general', columns: [] };
}

// Generate summary response
function generateSummaryResponse(dataset: Dataset, data: Record<string, unknown>[]): AIResponse {
  const numericColumns = dataset.columns.filter((c) => c.type === 'number');
  const textColumns = dataset.columns.filter((c) => c.type === 'string');

  const stats = {
    rows: data.length,
    columns: dataset.columns.length,
    numeric: numericColumns.length,
    text: textColumns.length,
    dates: dataset.columns.filter((c) => c.type === 'date').length,
  };

  const profileStats = numericColumns.slice(0, 3).map((col) => {
    const values = data.map((row) => Number(row[col.name])).filter((v) => !isNaN(v));
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    return { name: col.name, sum, avg, min: Math.min(...values), max: Math.max(...values) };
  });

  // Create summary chart data for numeric columns
  const chartData = profileStats.map((s) => ({ name: s.name, value: s.sum }));

  return {
    answer: `This dataset contains ${stats.rows.toLocaleString()} records with ${stats.columns} columns. There are ${stats.numeric} numeric columns and ${stats.text} text columns.\n\nKey statistics:\n${profileStats.map((s) => `- ${s.name}: Total ${s.sum.toLocaleString()}, Average ${s.avg.toFixed(2)}, Range ${s.min.toLocaleString()} - ${s.max.toLocaleString()}`).join('\n')}`,
    chart: {
      type: 'bar',
      title: 'Column Summaries',
      x_axis: 'Column',
      y_axis: 'Value',
      data: chartData,
      colors: colors.chart,
    },
    queryResult: profileStats.map((s) => ({
      Column: s.name,
      Total: s.sum.toLocaleString(),
      Average: s.avg.toFixed(2),
      Min: s.min.toLocaleString(),
      Max: s.max.toLocaleString(),
    })),
  };
}

// Generate aggregation response
function generateAggregationResponse(
  query: string,
  intent: QueryIntent,
  dataset: Dataset,
  data: Record<string, unknown>[]
): AIResponse {
  const targetColumn = intent.columns[0];
  const func = intent.aggregation || 'sum';

  const values = data.map((row) => Number(row[targetColumn])).filter((v) => !isNaN(v));
  let result: number;

  switch (func) {
    case 'sum':
      result = values.reduce((a, b) => a + b, 0);
      break;
    case 'avg':
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
    case 'count':
      result = values.length;
      break;
    case 'max':
      result = Math.max(...values);
      break;
    case 'min':
      result = Math.min(...values);
      break;
    default:
      result = values.reduce((a, b) => a + b, 0);
  }

  // Group by category if mentioned
  const textColumns = dataset.columns.filter((c) => c.type === 'string');
  const groupColumn = textColumns.find((c) => query.toLowerCase().includes(c.name.toLowerCase())) || textColumns[0];

  let chart: ChartConfig | undefined;
  let groupedData: Record<string, unknown>[] = [];

  if (groupColumn) {
    const aggregated = new Map<string, number[]>();
    for (const row of data) {
      const key = String(row[groupColumn.name] || 'Unknown');
      const val = Number(row[targetColumn]) || 0;
      if (!aggregated.has(key)) aggregated.set(key, []);
      aggregated.get(key)!.push(val);
    }

    groupedData = Array.from(aggregated.entries())
      .map(([name, vals]) => ({
        name,
        [targetColumn]: func === 'avg'
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : func === 'count'
          ? vals.length
          : vals.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => (b[targetColumn] as number) - (a[targetColumn] as number))
      .slice(0, 10);

    chart = {
      type: 'bar',
      title: `${func.toUpperCase()} of ${targetColumn} by ${groupColumn.name}`,
      x_axis: groupColumn.name,
      y_axis: targetColumn,
      data: groupedData.map((d) => ({ name: String(d.name), value: d[targetColumn] as number })),
      colors: colors.chart,
    };
  }

  const funcLabel = { sum: 'Total', avg: 'Average', count: 'Count', max: 'Maximum', min: 'Minimum' }[func];

  return {
    answer: `The ${funcLabel?.toLowerCase()} of ${targetColumn} is **${result.toLocaleString()}**.${groupedData.length > 0 ? `\n\nBreakdown by ${groupColumn?.name}:\n${groupedData.slice(0, 5).map((d) => `- ${d.name}: ${(d[targetColumn] as number).toLocaleString()}`).join('\n')}` : ''}`,
    chart,
    queryResult: groupedData.length > 0 ? groupedData : [{ [`${funcLabel} of ${targetColumn}`]: result }],
  };
}

// Generate comparison response
function generateComparisonResponse(
  intent: QueryIntent,
  _dataset: Dataset,
  data: Record<string, unknown>[]
): AIResponse {
  const [groupCol, valueCol] = intent.columns;

  // Group and aggregate
  const groups = new Map<string, number[]>();
  for (const row of data) {
    const key = String(row[groupCol] || 'Unknown');
    const val = Number(row[valueCol]) || 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(val);
  }

  const comparisons = Array.from(groups.entries())
    .map(([name, values]) => ({
      name,
      value: values.reduce((a, b) => a + b, 0),
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => b.value - a.value);

  const top = comparisons[0];
  const bottom = comparisons[comparisons.length - 1];
  const diff = top.value - bottom.value;
  const pctDiff = ((diff / bottom.value) * 100).toFixed(1);

  return {
    answer: `Comparing ${valueCol} across ${groupCol}:\n\n- Highest: **${top.name}** with ${top.value.toLocaleString()}\n- Lowest: **${bottom.name}** with ${bottom.value.toLocaleString()}\n- Difference: ${diff.toLocaleString()} (${pctDiff}% higher)`,
    chart: {
      type: 'bar',
      title: `${valueCol} by ${groupCol}`,
      x_axis: groupCol,
      y_axis: valueCol,
      data: comparisons.slice(0, 10).map((c) => ({ name: c.name, value: c.value })),
      colors: colors.chart,
    },
    queryResult: comparisons.map((c) => ({
      [groupCol]: c.name,
      [valueCol]: c.value.toLocaleString(),
      Count: c.count,
      Average: c.avg.toFixed(2),
    })),
  };
}

// Generate trend response
function generateTrendResponse(
  intent: QueryIntent,
  _dataset: Dataset,
  data: Record<string, unknown>[]
): AIResponse {
  const [timeCol, valueCol] = intent.columns;

  // Group by time period
  const timeGroups = new Map<string, number[]>();
  for (const row of data) {
    const time = String(row[timeCol] || 'Unknown');
    const val = Number(row[valueCol]) || 0;
    if (!timeGroups.has(time)) timeGroups.set(time, []);
    timeGroups.get(time)!.push(val);
  }

  const trendData = Array.from(timeGroups.entries())
    .map(([name, values]) => ({
      name,
      value: values.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Calculate trend direction
  const values = trendData.map((t) => t.value);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendDirection = secondAvg > firstAvg ? 'increasing' : secondAvg < firstAvg ? 'decreasing' : 'stable';
  const trendPct = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1);

  return {
    answer: `The trend for ${valueCol} over time shows a **${trendDirection}** pattern.\n\n- First period average: ${firstAvg.toLocaleString()}\n- Last period average: ${secondAvg.toLocaleString()}\n- Change: ${trendPct}% ${trendDirection}`,
    chart: {
      type: 'line',
      title: `${valueCol} Trend Over Time`,
      x_axis: timeCol,
      y_axis: valueCol,
      data: trendData,
      colors: ['#3b82f6'],
    },
    queryResult: trendData.map((t) => ({ Period: t.name, Value: t.value })),
  };
}

// Generate top/bottom response
function generateTopBottomResponse(
  intent: QueryIntent,
  _dataset: Dataset,
  data: Record<string, unknown>[]
): AIResponse {
  const [groupCol, valueCol] = intent.columns;
  const limit = intent.limit || 10;
  const order = intent.order || 'desc';

  // Group and aggregate
  const groups = new Map<string, number[]>();
  for (const row of data) {
    const key = String(row[groupCol] || 'Unknown');
    const val = Number(row[valueCol]) || 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(val);
  }

  const rankings = Array.from(groups.entries())
    .map(([name, values]) => ({
      name,
      value: values.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => (order === 'desc' ? b.value - a.value : a.value - b.value))
    .slice(0, limit);

  const label = order === 'desc' ? 'Top' : 'Bottom';

  return {
    answer: `The ${label} ${limit} ${groupCol}s by ${valueCol}:\n\n${rankings.map((r, i) => `${i + 1}. **${r.name}**: ${r.value.toLocaleString()}`).join('\n')}`,
    chart: {
      type: 'bar',
      title: `${label} ${limit} ${groupCol} by ${valueCol}`,
      x_axis: groupCol,
      y_axis: valueCol,
      data: rankings,
      colors: colors.chart,
    },
    queryResult: rankings.map((r, i) => ({ Rank: i + 1, [groupCol]: r.name, [valueCol]: r.value.toLocaleString() })),
  };
}

// Generate insight response
function generateInsightResponse(dataset: Dataset, data: Record<string, unknown>[]): AIResponse {
  const insights: Insight[] = [];

  // Analyze numeric columns
  const numericColumns = dataset.columns.filter((c) => c.type === 'number');
  const textColumns = dataset.columns.filter((c) => c.type === 'string');

  // Find top categories for each text column
  for (const textCol of textColumns.slice(0, 3)) {
    const counts = new Map<string, number>();
    for (const row of data) {
      const key = String(row[textCol.name] || 'Unknown');
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const topCategory = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    const topPercentage = ((topCategory[1] / data.length) * 100).toFixed(1);

    insights.push({
      id: Math.random().toString(36).substring(2),
      dataset_id: dataset.id,
      category: 'key_finding',
      title: `${textCol.name} Distribution`,
      description: `${topCategory[0]} represents the largest segment at ${topPercentage}% of all ${textCol.name.toLowerCase()}s (${topCategory[1]} records).`,
      importance: 'medium',
      related_columns: [textCol.name],
      confidence_score: 0.85,
      created_at: new Date().toISOString(),
    });
  }

  // Analyze growth trends for numeric columns
  for (const numCol of numericColumns.slice(0, 2)) {
    const values = data.slice(-10).map((row) => Number(row[numCol.name]) || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (Math.abs(change) > 5) {
      insights.push({
        id: Math.random().toString(36).substring(2),
        dataset_id: dataset.id,
        category: 'trend',
        title: `${numCol.name} Trend`,
        description: `${numCol.name} shows a ${change > 0 ? 'growth' : 'decline'} of ${Math.abs(change).toFixed(1)}% when comparing recent periods to earlier periods.`,
        importance: change > 20 || change < -20 ? 'high' : 'medium',
        related_columns: [numCol.name],
        confidence_score: 0.75,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Add recommendations
  insights.push({
    id: Math.random().toString(36).substring(2),
    dataset_id: dataset.id,
    category: 'recommendation',
    title: 'Data Quality Review',
    description: 'Consider reviewing missing values and data completeness to improve analysis accuracy.',
    importance: 'medium',
    related_columns: [],
    confidence_score: 0.9,
    created_at: new Date().toISOString(),
  });

  return {
    answer: `I've analyzed your dataset and found ${insights.length} key insights:\n\n${insights.map((i) => `- **${i.title}**: ${i.description}`).join('\n')}`,
    insights,
  };
}

// Generate generic response
function generateGenericResponse(query: string, dataset: Dataset, data: Record<string, unknown>[]): AIResponse {
  // Look for column references in the query
  const matchedColumns = dataset.columns.filter((c) =>
    query.toLowerCase().includes(c.name.toLowerCase())
  );

  if (matchedColumns.length > 0) {
    const col = matchedColumns[0];
    const profile = profileColumn(data, col.name, col.type);

    return {
      answer: `Here's what I found about **${col.name}**:\n\n- Data type: ${col.type}\n- Unique values: ${profile.unique_count}\n- Missing values: ${profile.missing_count} (${profile.missing_percentage}%)\n${profile.min_value ? `- Range: ${profile.min_value} to ${profile.max_value}` : ''}${profile.mean_value !== undefined ? `\n- Average: ${profile.mean_value.toFixed(2)}` : ''}\n\nTop values:\n${profile.top_values.slice(0, 5).map((tv) => `- ${tv.value}: ${tv.count} occurrences`).join('\n')}`,
      chart: profile.histogram.length > 0 ? {
        type: 'histogram',
        title: `${col.name} Distribution`,
        x_axis: col.name,
        y_axis: 'Count',
        data: profile.histogram.map((h) => ({ name: h.bin, value: h.count })),
        colors: ['#3b82f6'],
      } : undefined,
    };
  }

  return {
    answer: `I can help you analyze your data. Here are some things you can ask:\n\n- "Show summary statistics"\n- "What are the top 10 products by revenue?"\n- "Compare sales by region"\n- "Show the trend over time"\n- "Generate insights"\n\nYour dataset has ${dataset.columns.length} columns: ${dataset.columns.map((c) => c.name).join(', ')}.`,
  };
}
