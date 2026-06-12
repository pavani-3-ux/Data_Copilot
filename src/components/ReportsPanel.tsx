import { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileDown,
  Loader,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { classNames, downloadCSV, downloadFile } from '../utils/helpers';
import type { Dataset, Report, Insight, ChartConfig, DatasetStats } from '../types';

interface ReportsPanelProps {
  dataset: Dataset;
  stats: DatasetStats;
  insights: Insight[];
  charts: ChartConfig[];
  reports: Report[];
  onGenerate: (report: Report) => void;
  onDelete: (reportId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ReportsPanel({
  dataset,
  stats,
  insights,
  charts,
  reports,
  onGenerate,
  onDelete,
  isLoading,
  setIsLoading,
}: ReportsPanelProps) {
  const [selectedType, setSelectedType] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [showGenerator, setShowGenerator] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const report: Report = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        dataset_id: dataset.id,
        user_id: 'current',
        title: `${dataset.name} Analysis Report`,
        report_type: selectedType,
        content: {
          summary: `Analysis of ${dataset.name} containing ${stats.totalRows} rows and ${stats.totalColumns} columns.`,
          statistics: stats,
          insights: insights.slice(0, 10),
          charts: charts.slice(0, 5),
          recommendations: insights
            .filter((i) => i.category === 'recommendation')
            .map((i) => i.description)
            .slice(0, 5),
        },
        status: 'ready',
        created_at: new Date().toISOString(),
      };

      onGenerate(report);
      setShowGenerator(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (report: Report) => {
    if (report.report_type === 'csv') {
      downloadCSV(
        [{ summary: report.content.summary, generated: new Date().toISOString() }],
        `${dataset.name}_report.csv`
      );
    } else {
      const content = JSON.stringify(report.content, null, 2);
      downloadFile(content, `${dataset.name}_report.json`, 'application/json');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-success-400" />;
      case 'generating':
        return <Loader className="w-4 h-4 text-warning-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error-400" />;
      default:
        return <Clock className="w-4 h-4 text-secondary-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-secondary-400 mt-1">
            Generate and download analysis reports
          </p>
        </div>

        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-glow transition-shadow"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Generate Report</span>
        </button>
      </div>

      {/* Report Generator */}
      {showGenerator && (
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <h3 className="text-white font-medium mb-4">Create New Report</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setSelectedType('pdf')}
              className={classNames(
                'p-4 rounded-xl border transition-all text-left',
                selectedType === 'pdf'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-secondary-700 hover:border-secondary-600'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className={classNames('w-6 h-6', selectedType === 'pdf' ? 'text-primary-400' : 'text-secondary-400')} />
                <span className="text-white font-medium">PDF Report</span>
              </div>
              <p className="text-secondary-400 text-xs">
                Comprehensive document with charts and insights
              </p>
            </button>

            <button
              onClick={() => setSelectedType('excel')}
              className={classNames(
                'p-4 rounded-xl border transition-all text-left',
                selectedType === 'excel'
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-secondary-700 hover:border-secondary-600'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileSpreadsheet className={classNames('w-6 h-6', selectedType === 'excel' ? 'text-accent-400' : 'text-secondary-400')} />
                <span className="text-white font-medium">Excel Report</span>
              </div>
              <p className="text-secondary-400 text-xs">
                Spreadsheet with data tables and analysis
              </p>
            </button>

            <button
              onClick={() => setSelectedType('csv')}
              className={classNames(
                'p-4 rounded-xl border transition-all text-left',
                selectedType === 'csv'
                  ? 'border-warning-500 bg-warning-500/10'
                  : 'border-secondary-700 hover:border-secondary-600'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileDown className={classNames('w-6 h-6', selectedType === 'csv' ? 'text-warning-400' : 'text-secondary-400')} />
                <span className="text-white font-medium">CSV Export</span>
              </div>
              <p className="text-secondary-400 text-xs">
                Raw data export for further analysis
              </p>
            </button>
          </div>

          {/* Report Preview */}
          <div className="bg-secondary-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-secondary-400 text-xs mb-3">Report Will Include</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-secondary-300 text-sm">Executive summary and key metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-secondary-300 text-sm">{insights.length} AI-generated insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-secondary-300 text-sm">{charts.length} visualizations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-secondary-300 text-sm">Data quality assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-secondary-300 text-sm">Recommendations and next steps</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowGenerator(false)}
              className="px-4 py-2 bg-secondary-800 text-secondary-300 rounded-lg hover:bg-secondary-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                isLoading
                  ? 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
                  : 'bg-accent-500 text-white hover:bg-accent-600'
              )}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Generate & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-secondary-900 rounded-xl border border-secondary-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={classNames(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      report.report_type === 'pdf' && 'bg-primary-500/20',
                      report.report_type === 'excel' && 'bg-accent-500/20',
                      report.report_type === 'csv' && 'bg-warning-500/20'
                    )}
                  >
                    {report.report_type === 'pdf' && <FileText className="w-6 h-6 text-primary-400" />}
                    {report.report_type === 'excel' && <FileSpreadsheet className="w-6 h-6 text-accent-400" />}
                    {report.report_type === 'csv' && <FileDown className="w-6 h-6 text-warning-400" />}
                  </div>

                  <div>
                    <h3 className="text-white font-medium">{report.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-secondary-400 text-xs">
                        {report.report_type.toUpperCase()}
                      </span>
                      <span className="text-secondary-500 text-xs">&bull;</span>
                      <span className="text-secondary-400 text-xs">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-secondary-500 text-xs">&bull;</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="text-secondary-400 text-xs capitalize">{report.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={report.status !== 'ready'}
                    className={classNames(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
                      report.status === 'ready'
                        ? 'bg-primary-600 text-white hover:bg-primary-500'
                        : 'bg-secondary-700 text-secondary-500 cursor-not-allowed'
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => onDelete(report.id)}
                    className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400 hover:text-error-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-800 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-secondary-500" />
          </div>
          <h3 className="text-white font-medium mb-2">No reports generated</h3>
          <p className="text-secondary-400 text-sm max-w-md mx-auto">
            Generate your first report to download a comprehensive analysis of your data.
          </p>
        </div>
      )}
    </div>
  );
}
