'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import { 
  Search, 
  History, 
  ChevronRight, 
  Sparkles, 
  FileCode, 
  AlertCircle,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
  Gauge
} from 'lucide-react';

interface Review {
  id: string;
  template: string;
  summary: string;
  issues: any[]; // JSON array of issues
  targetFiles: string[];
  createdAt: string;
  project: {
    name: string;
  };
}

export default function ReviewHistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchText, setSearchText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Selected Review Detail View
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [activeReviewDetail, setActiveReviewDetail] = useState<Review | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedIssueIdx, setExpandedIssueIdx] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/reviews/history';
      const params = new URLSearchParams();
      if (searchText) {
        params.append('search', searchText);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await api.get<Review[]>(url);
      
      // Client-side template filtering
      if (selectedTemplate) {
        setReviews(data.filter(r => r.template === selectedTemplate));
      } else {
        setReviews(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [searchText, selectedTemplate]);

  const fetchReviewDetail = async (id: string) => {
    setDetailLoading(true);
    setExpandedIssueIdx(null);
    try {
      const details = await api.get<Review>(`/reviews/${id}`);
      setActiveReviewDetail(details);
      setActiveReviewId(id);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve review details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateBadge = (template: string) => {
    switch (template) {
      case 'security':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'performance':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'quality':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'tech_debt':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'architecture':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTemplateLabel = (template: string) => {
    switch (template) {
      case 'security': return 'Security';
      case 'performance': return 'Performance';
      case 'quality': return 'Quality';
      case 'tech_debt': return 'Tech Debt';
      case 'architecture': return 'Architecture';
      default: return template;
    }
  };

  const getIssueCount = (review: Review | null, severity: string) => {
    if (!review) return 0;
    return review.issues.filter(i => i.severity === severity).length;
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white tracking-tight">Review History</h1>
          <p className="text-xs text-gray-500 font-medium">Browse and search through all past AI code review audits</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and search row */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 animate-fade-in">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by summary or project name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Template:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="bg-black border border-white/5 text-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Templates</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="quality">Code Quality</option>
              <option value="tech_debt">Tech Debt</option>
              <option value="architecture">Architecture</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="flex-grow flex justify-center items-center py-24">
            <div className="h-8 w-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center items-center border border-dashed border-white/5 rounded-3xl p-12 text-center bg-neutral-950/20 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/70 mb-4 animate-pulse">
              <History className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No reviews found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              You haven't completed any review scans yet. Select a project and trigger an audit scan to populate history.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-neutral-950/40 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Project</th>
                    <th className="p-4">Template</th>
                    <th className="p-4">Audit Summary</th>
                    <th className="p-4">Files Review</th>
                    <th className="p-4">Scan Date</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {reviews.map((rev) => (
                    <tr 
                      key={rev.id} 
                      onClick={() => fetchReviewDetail(rev.id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {rev.project.name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide ${getTemplateBadge(rev.template)}`}>
                          {getTemplateLabel(rev.template)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate font-medium text-gray-400">
                        {rev.summary}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-[10px]">
                        {Array.isArray(rev.targetFiles) ? rev.targetFiles.length : 0} Files
                      </td>
                      <td className="p-4 text-gray-500 flex items-center space-x-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{formatDate(rev.createdAt)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide-Over Modal details */}
        {activeReviewId && activeReviewDetail && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 z-0" onClick={() => { setActiveReviewId(null); setActiveReviewDetail(null); }} />

            {/* Slide drawer body */}
            <div className="w-full max-w-2xl bg-neutral-950 border-l border-white/5 h-full flex flex-col z-10 animate-fade-in relative shadow-2xl">
              {/* Top Bar */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">{activeReviewDetail.project.name}</h2>
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-semibold tracking-wide ${getTemplateBadge(activeReviewDetail.template)}`}>
                      {getTemplateLabel(activeReviewDetail.template)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Scanned on {formatDate(activeReviewDetail.createdAt)}</p>
                </div>
                <button
                  onClick={() => { setActiveReviewId(null); setActiveReviewDetail(null); }}
                  className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                
                {/* Metric Gauges */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: 'Critical', color: 'bg-red-500/10 border-red-500/20 text-red-400' },
                    { name: 'High', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                    { name: 'Medium', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                    { name: 'Low', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }
                  ].map((sev) => (
                    <div key={sev.name} className={`p-3 rounded-xl border text-center ${sev.color}`}>
                      <p className="text-[9px] font-bold uppercase tracking-wider">{sev.name}</p>
                      <p className="text-lg font-extrabold mt-0.5">{getIssueCount(activeReviewDetail, sev.name)}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="glass-panel p-5 rounded-2xl relative">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 font-bold flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Audit Executive Summary</span>
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">{activeReviewDetail.summary}</p>
                </div>

                {/* List of target files */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Files Scanned ({activeReviewDetail.targetFiles.length})</p>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl max-h-[80px] overflow-y-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {activeReviewDetail.targetFiles.map((f, idx) => (
                        <span key={idx} className="px-2 py-1 bg-black border border-white/5 text-[9px] font-mono text-gray-400 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Audit Issues ({activeReviewDetail.issues.length})</p>
                  
                  {activeReviewDetail.issues.length === 0 ? (
                    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] text-xs text-gray-500 text-center font-medium">
                      No issues detected for this configuration review scan.
                    </div>
                  ) : (
                    activeReviewDetail.issues.map((issue, idx) => {
                      const isExpanded = expandedIssueIdx === idx;
                      
                      // Map icon
                      let Icon = Info;
                      let color = 'text-blue-400 bg-blue-500/15 border-blue-500/20';
                      if (issue.severity === 'Critical' || issue.severity === 'High') {
                        Icon = ShieldAlert;
                        color = issue.severity === 'Critical' 
                          ? 'text-red-400 bg-red-500/15 border-red-500/20' 
                          : 'text-orange-400 bg-orange-500/15 border-orange-500/20';
                      } else if (issue.severity === 'Medium') {
                        Icon = AlertTriangle;
                        color = 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20';
                      }

                      return (
                        <div key={idx} className="glass-panel rounded-xl overflow-hidden animate-fade-in">
                          <button
                            onClick={() => setExpandedIssueIdx(isExpanded ? null : idx)}
                            className="w-full flex items-start space-x-3 p-4 hover:bg-white/5 transition-colors text-left cursor-pointer"
                          >
                            <div className={`p-1.5 rounded-lg border flex-shrink-0 ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white leading-tight truncate">{issue.title}</h4>
                              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                                {issue.filePath} : Line {issue.lineNumber}
                              </p>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-black/30 space-y-3 animate-fade-in">
                              <div>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Description</span>
                                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{issue.description}</p>
                              </div>

                              {issue.recommendation && (
                                <div>
                                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Recommendation Fix</span>
                                  <pre className="text-[10px] font-mono text-gray-300 bg-black p-3 rounded-lg border border-white/5 overflow-x-auto mt-1 leading-relaxed">
                                    <code>{issue.recommendation}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
