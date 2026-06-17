'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import Sidebar from '../../../components/Sidebar';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Load Prism components for syntax highlighting fallback
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';

import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  Play,
  MessageSquare,
  Sparkles,
  Terminal,
  Cpu,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  Info,
  Send,
  Plus,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Gauge
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  id?: string;
  children?: FileTreeNode[];
}

interface AIProvider {
  id: string;
  name: string;
  modelName: string;
  isDefault: boolean;
}

interface ReviewIssue {
  filePath: string;
  lineNumber: number;
  title: string;
  description: string;
  recommendation: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface Review {
  id: string;
  template: string;
  summary: string;
  issues: ReviewIssue[];
  targetFiles: string[];
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ProjectWorkspace() {
  const { id: projectId } = useParams() as { id: string };
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  
  // Workspace files state
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);

  // Expanded folders set in file explorer
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Right Panel Tabs
  const [activeTab, setActiveTab] = useState<'review' | 'chat' | 'tools'>('review');

  // Review Tab State
  const [reviewTemplate, setReviewTemplate] = useState<string>('security');
  const [reviewScope, setReviewScope] = useState<'project' | 'file'>('project');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [expandedIssueIndex, setExpandedIssueIndex] = useState<number | null>(null);

  // Chat Tab State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Tools Tab State (Bonus Features)
  const [debtScannerLoading, setDebtScannerLoading] = useState(false);
  const [debtScannerResult, setDebtScannerResult] = useState<Review | null>(null);
  const [archAnalysisLoading, setArchAnalysisLoading] = useState(false);
  const [archAnalysisResult, setArchAnalysisResult] = useState<Review | null>(null);

  // Global Workspace errors
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadWorkspaceData();
    }
  }, [projectId]);

  useEffect(() => {
    // Re-run syntax highlighting whenever file content changes
    if (activeFileContent) {
      Prism.highlightAll();
    }
  }, [activeFileContent]);

  useEffect(() => {
    // Scroll chat to bottom on new message
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadWorkspaceData = async () => {
    try {
      // 1. Load project info
      const projData = await api.get<Project>(`/projects/${projectId}`);
      setProject(projData);

      // 2. Load file tree
      const treeData = await api.get<FileTreeNode[]>(`/projects/${projectId}/files/tree`);
      setFileTree(treeData);

      // 3. Load AI providers
      const provData = await api.get<AIProvider[]>('/ai/providers');
      setProviders(provData);
      const defaultProv = provData.find(p => p.isDefault) || provData[0];
      if (defaultProv) {
        setSelectedProviderId(defaultProv.id);
      }

      // 4. Load reviews list
      const revData = await api.get<Review[]>(`/projects/${projectId}/reviews`);
      setReviewsList(revData);
      if (revData.length > 0) {
        setCurrentReview(revData[0]);
      }

      // 5. Load chat sessions
      const sessionData = await api.get<ChatSession[]>(`/projects/${projectId}/chat/sessions`);
      setChatSessions(sessionData);
      if (sessionData.length > 0) {
        loadChatMessages(sessionData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace.');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress('Extracting & uploading files...');
    setError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post(`/projects/${projectId}/upload`, formData);
      setUploadProgress('Success!');
      setUploadFile(null);
      // Reload file tree and workspace
      loadWorkspaceData();
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const loadFileContent = async (fileId: string, filePath: string) => {
    setFileLoading(true);
    setError(null);
    try {
      const fileData = await api.get<{ content: string }>(`/files/${fileId}`);
      setActiveFileId(fileId);
      setActiveFilePath(filePath);
      setActiveFileContent(fileData.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load file contents.');
    } finally {
      setFileLoading(false);
    }
  };

  const triggerCodeReview = async () => {
    setReviewLoading(true);
    setError(null);
    setCurrentReview(null);
    try {
      const review = await api.post<Review>(`/projects/${projectId}/reviews/trigger`, {
        template: reviewTemplate,
        providerId: selectedProviderId || undefined,
        filePaths: reviewScope === 'file' && activeFilePath ? [activeFilePath] : undefined,
      });
      setCurrentReview(review);
      setReviewsList([review, ...reviewsList]);
    } catch (err: any) {
      setError(err.message || 'Code review trigger failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Chat Helpers
  const createNewChatSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    try {
      const newSession = await api.post<ChatSession>(`/projects/${projectId}/chat/sessions`, {
        title: newSessionTitle,
      });
      setChatSessions([newSession, ...chatSessions]);
      setActiveSessionId(newSession.id);
      setChatMessages([]);
      setNewSessionTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to create chat session.');
    }
  };

  const loadChatMessages = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const messages = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
      setChatMessages(messages);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat history.');
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSessionId) return;

    const userText = chatInput;
    setChatInput('');
    setChatLoading(true);

    // Append user message immediately locally
    const localUserMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, localUserMsg]);

    try {
      const response = await api.post<ChatMessage>(`/chat/sessions/${activeSessionId}/message`, {
        content: userText,
        providerId: selectedProviderId || undefined
      });
      setChatMessages(prev => [...prev.filter(m => m.id !== localUserMsg.id), localUserMsg, response]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setChatLoading(false);
    }
  };

  // Bonus Tools Helpers
  const triggerTechnicalDebtScan = async () => {
    setDebtScannerLoading(true);
    setError(null);
    setDebtScannerResult(null);
    try {
      const result = await api.post<Review>(`/projects/${projectId}/reviews/trigger`, {
        template: 'tech_debt',
        providerId: selectedProviderId || undefined
      });
      setDebtScannerResult(result);
    } catch (err: any) {
      setError(err.message || 'Technical Debt Scan failed.');
    } finally {
      setDebtScannerLoading(false);
    }
  };

  const triggerArchitectureAnalysis = async () => {
    setArchAnalysisLoading(true);
    setError(null);
    setArchAnalysisResult(null);
    try {
      const result = await api.post<Review>(`/projects/${projectId}/reviews/trigger`, {
        template: 'architecture',
        providerId: selectedProviderId || undefined
      });
      setArchAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'Architecture Analysis failed.');
    } finally {
      setArchAnalysisLoading(false);
    }
  };

  // Toggle expanded folders helper
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // File tree rendering component helper (recursively renders node tree)
  const renderFileTree = (nodes: FileTreeNode[], depth = 0) => {
    return (
      <div className="space-y-1">
        {nodes.map((node) => {
          const isExpanded = expandedFolders[node.path];
          const isSelected = activeFilePath === node.path;
          
          if (node.isDir) {
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  className="w-full flex items-center space-x-2 py-1.5 hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white text-left transition-colors cursor-pointer"
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
                  <Folder className="h-4 w-4 text-indigo-400/80" />
                  <span className="truncate">{node.name}</span>
                </button>
                
                {isExpanded && node.children && (
                  <div className="mt-0.5">
                    {renderFileTree(node.children, depth + 1)}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <button
                key={node.path}
                onClick={() => loadFileContent(node.id!, node.path)}
                style={{ paddingLeft: `${depth * 12 + 24}px` }}
                className={`w-full flex items-center space-x-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-600/15 border-l-2 border-indigo-500 text-indigo-400 font-semibold shadow shadow-indigo-500/5' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <File className="h-3.5 w-3.5 text-gray-500" />
                <span className="truncate">{node.name}</span>
              </button>
            );
          }
        })}
      </div>
    );
  };

  // Helper to guess syntax highlighting language by path extension
  const getLanguageClass = (filePath: string) => {
    const ext = filePath.split('.').pop() || '';
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'language-typescript';
      case 'js':
      case 'jsx':
        return 'language-jsx';
      case 'json':
        return 'language-json';
      case 'py':
        return 'language-python';
      case 'html':
        return 'language-html';
      case 'css':
        return 'language-css';
      default:
        return 'language-javascript';
    }
  };

  // Helper to count issues by severity in reviews
  const getIssueCount = (review: Review | null, severity: string) => {
    if (!review) return 0;
    return review.issues.filter(i => i.severity === severity).length;
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-[#f3f4f6]">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Workspace Subheader */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-[#0a0f1d]/50 flex-shrink-0 animate-fade-in">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {project ? project.name : 'Workspace Loading...'}
              </h2>
              <p className="text-[10px] text-gray-500 truncate max-w-[200px] md:max-w-[320px]">
                {project?.description || 'AI Review Environment'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* AI Provider Config Select */}
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-gray-500" />
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="bg-[#0b0f19] border border-white/5 text-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {providers.length === 0 ? (
                  <option value="">No Providers Found</option>
                ) : (
                  providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.modelName})
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <button
              onClick={loadWorkspaceData}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Workspace"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-red-400 text-xs flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-gray-500 hover:text-white font-bold text-xs uppercase px-1">Close</button>
          </div>
        )}

        {/* 3-Pane Interface */}
        <div className="flex-grow flex w-full overflow-hidden">
          
          {/* Pane 1: File Tree (Width: 64) */}
          <div className="w-64 border-r border-white/5 bg-[#0a0f1d]/30 flex flex-col h-full flex-shrink-0 overflow-y-auto p-4 select-none">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Workspace Files</p>
            
            {fileTree.length === 0 ? (
              /* Zip Upload Area if empty */
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.name.endsWith('.zip')) {
                    setUploadFile(file);
                    setError(null);
                  } else {
                    setError('Please drop a valid .zip file.');
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center p-4 border border-dashed rounded-2xl text-center transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-500/10 scale-98 shadow shadow-indigo-500/20' 
                    : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                <UploadCloud className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-[10px] text-gray-400 mb-4">Upload or drag & drop a ZIP file of your codebase.</p>
                
                <form onSubmit={handleFileUpload} className="w-full space-y-3">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      setUploadFile(e.target.files?.[0] || null);
                      setError(null);
                    }}
                    className="hidden"
                    id="zip-upload-input"
                  />
                  <label
                    htmlFor="zip-upload-input"
                    className="block w-full py-2 px-3 border border-white/10 hover:border-white/20 rounded-xl bg-[#090d16] text-[10px] font-semibold text-gray-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {uploadFile ? uploadFile.name : 'Select ZIP File'}
                  </label>
                  
                  {uploadFile && (
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      {uploading ? 'Processing...' : 'Upload'}
                    </button>
                  )}
                  {uploadProgress && <p className="text-[9px] text-indigo-400 animate-pulse mt-1">{uploadProgress}</p>}
                </form>
              </div>
            ) : (
              /* Render tree nodes */
              <div className="space-y-1 overflow-y-auto">
                {renderFileTree(fileTree)}
                
                {/* Re-upload ZIP overlay option inside tree footer */}
                <div className="pt-6 border-t border-white/5 mt-6 text-center">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="zip-reupload-input"
                  />
                  <label
                    htmlFor="zip-reupload-input"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                  >
                    <UploadCloud className="h-3 w-3" />
                    <span>Upload New ZIP</span>
                  </label>

                  {uploadFile && (
                    <div className="mt-3 bg-[#0d1321]/60 p-3 border border-white/5 rounded-xl animate-fade-in">
                      <p className="text-[9px] text-gray-400 truncate mb-2">{uploadFile.name}</p>
                      <button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        className="w-full py-1.5 px-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold cursor-pointer"
                      >
                        {uploading ? 'Processing...' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pane 2: File Viewer (Flexible Width) */}
          <div className="flex-1 border-r border-white/5 bg-[#090d16] flex flex-col h-full overflow-hidden">
            {fileLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : activeFileId ? (
              <div className="flex-grow flex flex-col h-full overflow-hidden animate-fade-in">
                {/* Path bar */}
                <div className="h-9 px-4 border-b border-white/5 bg-[#0a0f1d]/30 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                    <FileCode className="h-3.5 w-3.5 text-gray-500" />
                    <span>{activeFilePath}</span>
                  </div>
                </div>
                {/* Code body */}
                <pre className="flex-1 overflow-auto p-4 m-0 text-xs font-mono select-text bg-[#090d16] leading-relaxed">
                  <code className={getLanguageClass(activeFilePath)}>
                    {activeFileContent}
                  </code>
                </pre>
              </div>
            ) : (
              /* Explorer empty state logo */
              <div className="flex-grow flex flex-col justify-center items-center text-center p-8 select-none">
                <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/50 mb-4 animate-pulse">
                  <FileCode className="h-10 w-10" />
                </div>
                <h3 className="text-sm font-semibold text-gray-300">No File Selected</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs">
                  Expand folders and select code files from the explorer pane to preview content.
                </p>
              </div>
            )}
          </div>

          {/* Pane 3: Right Action panel (Width: 80 / ~384px) */}
          <div className="w-[420px] bg-[#0a0f1d]/40 flex flex-col h-full flex-shrink-0 overflow-hidden">
            {/* Action Tabs Header */}
            <div className="h-12 border-b border-white/5 bg-[#0d1321]/40 flex flex-shrink-0">
              <button
                onClick={() => setActiveTab('review')}
                className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'review'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Review</span>
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>AI Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 flex items-center justify-center space-x-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'tools'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>AI Tools</span>
              </button>
            </div>

            {/* Pane Content body */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col">
              
              {/* TAB 1: CODE REVIEW */}
              {activeTab === 'review' && (
                <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
                  
                  {/* Review config trigger */}
                  <div className="glass-panel p-4 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Review Templates</p>
                      
                      <select
                        value={reviewTemplate}
                        onChange={(e) => setReviewTemplate(e.target.value)}
                        className="bg-[#090d16] border border-white/5 text-gray-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="security">Security Review</option>
                        <option value="performance">Performance Review</option>
                        <option value="quality">Code Quality Review</option>
                      </select>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Review Scope</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewScope('project')}
                          className={`py-1.5 text-center rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            reviewScope === 'project'
                              ? 'bg-indigo-600/15 border-indigo-500/35 text-indigo-400'
                              : 'bg-[#090d16] border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Entire Project
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeFileId) {
                              setReviewScope('file');
                              setError(null);
                            } else {
                              setError('Please open a code file in the viewer first to select File review scope.');
                            }
                          }}
                          className={`py-1.5 text-center rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            reviewScope === 'file'
                              ? 'bg-indigo-600/15 border-indigo-500/35 text-indigo-400'
                              : 'bg-[#090d16] border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          Active File
                        </button>
                      </div>
                      {reviewScope === 'file' && activeFilePath && (
                        <p className="text-[9px] text-indigo-400 truncate mt-1">
                          Target: {activeFilePath}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={triggerCodeReview}
                      disabled={reviewLoading || fileTree.length === 0 || (reviewScope === 'file' && !activeFileId)}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {reviewLoading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Run Audit Scan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Review output details */}
                  {reviewLoading ? (
                    <div className="flex-grow flex flex-col justify-center items-center text-center p-8">
                      <div className="h-6 w-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                      <p className="text-xs font-semibold text-gray-300">Auditing source files...</p>
                      <p className="text-[10px] text-gray-500 max-w-[200px] mt-1">This might take up to a minute depending on codebase size.</p>
                    </div>
                  ) : currentReview ? (
                    <div className="space-y-4 flex-grow flex flex-col animate-fade-in">
                      {/* Metric gauges */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'Critical', color: 'bg-red-500/10 border-red-500/20 text-red-400' },
                          { name: 'High', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                          { name: 'Medium', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                          { name: 'Low', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }
                        ].map((sev) => (
                          <div key={sev.name} className={`p-2 rounded-lg border text-center ${sev.color}`}>
                            <p className="text-[8px] font-bold uppercase tracking-wider">{sev.name}</p>
                            <p className="text-base font-extrabold mt-0.5">{getIssueCount(currentReview, sev.name)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="glass-panel p-4 rounded-xl">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Review Summary</p>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium">{currentReview.summary}</p>
                      </div>

                      {/* Issue findings tree */}
                      <div className="space-y-2 flex-grow overflow-y-auto">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">Findings ({currentReview.issues.length})</p>
                        
                        {currentReview.issues.length === 0 ? (
                          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-gray-500 text-center">
                            Excellent! No issues detected for this configuration.
                          </div>
                        ) : (
                          currentReview.issues.map((issue, idx) => {
                            const isExpanded = expandedIssueIndex === idx;
                            
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
                              <div key={idx} className="glass-panel rounded-xl overflow-hidden">
                                <button
                                  onClick={() => setExpandedIssueIndex(isExpanded ? null : idx)}
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
                                  <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#090d16]/30 space-y-3 animate-fade-in">
                                    <div>
                                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Description</span>
                                      <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{issue.description}</p>
                                    </div>

                                    {issue.recommendation && (
                                      <div>
                                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">Recommendation</span>
                                        <pre className="text-[10px] font-mono text-gray-300 bg-[#090d16] p-3 rounded-lg border border-white/5 overflow-x-auto mt-1 leading-relaxed">
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
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-8 select-none">
                      <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/50 mb-3 animate-pulse">
                        <Gauge className="h-8 w-8" />
                      </div>
                      <h3 className="text-xs font-semibold text-gray-300">No Review Completed</h3>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                        Select a template option above and click "Run Audit Scan" to analyze the project files.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CODE CHAT */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col h-full space-y-4 overflow-hidden animate-fade-in">
                  
                  {/* Session management selector */}
                  <div className="flex space-x-2">
                    <select
                      value={activeSessionId || ''}
                      onChange={(e) => loadChatMessages(e.target.value)}
                      className="flex-1 bg-[#0b0f19] border border-white/5 text-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                    >
                      {chatSessions.length === 0 ? (
                        <option value="">No Active Chats</option>
                      ) : (
                        chatSessions.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))
                      )}
                    </select>

                    {/* Pop-up trigger to create new sessions */}
                    <form onSubmit={createNewChatSession} className="flex space-x-1.5 flex-shrink-0">
                      <input
                        type="text"
                        required
                        value={newSessionTitle}
                        onChange={(e) => setNewSessionTitle(e.target.value)}
                        placeholder="New Chat Title"
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-white/5 bg-[#090d16] text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow shadow-indigo-500/10 cursor-pointer"
                        title="New Chat Session"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>

                  {/* Messages history feed */}
                  <div className="flex-grow overflow-y-auto border border-white/5 bg-[#090d16]/30 rounded-2xl p-4 space-y-4 max-h-[360px] min-h-[300px]">
                    {chatSessions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-500">
                        Create a chat session using the button above to ask questions.
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-500">
                        No messages yet. Ask a question about the repository!
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={msg.id || idx}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/5'
                              : 'bg-white/[0.03] border border-white/5 text-gray-300 rounded-tl-none font-medium'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/[0.03] border border-white/5 text-gray-300 rounded-2xl rounded-tl-none p-3 max-w-[80%] flex items-center space-x-2">
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" />
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Dynamic send prompt */}
                  <form onSubmit={sendChatMessage} className="flex space-x-2 flex-shrink-0 mt-auto">
                    <input
                      type="text"
                      disabled={chatLoading || chatSessions.length === 0}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g. How does authorization work?"
                      className="flex-grow px-4 py-2.5 rounded-xl glass-input text-xs disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || chatSessions.length === 0}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: BONUS TOOLS */}
              {activeTab === 'tools' && (
                <div className="flex-grow flex flex-col space-y-6 animate-fade-in">
                  
                  {/* Tool 1: Technical Debt Scanner */}
                  <div className="glass-panel p-5 rounded-2xl relative space-y-4">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                        <Terminal className="h-4 w-4 text-amber-400" />
                        <span>Technical Debt Scanner</span>
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Scans the code for design smells and priorities</p>
                    </div>

                    <button
                      onClick={triggerTechnicalDebtScan}
                      disabled={debtScannerLoading || fileTree.length === 0}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#d97706]/15 hover:bg-[#d97706]/20 border border-[#d97706]/30 text-amber-400 font-bold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {debtScannerLoading ? (
                        <div className="h-4 w-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      ) : (
                        <span>Analyze Tech Debt</span>
                      )}
                    </button>

                    {debtScannerResult && (
                      <div className="pt-4 border-t border-white/5 space-y-3 animate-fade-in">
                        {/* Gauge indicators */}
                        <div className="flex space-x-2 justify-center">
                          {[
                            { name: 'High', color: 'bg-red-500/10 text-red-400' },
                            { name: 'Medium', color: 'bg-yellow-500/10 text-yellow-400' },
                            { name: 'Low', color: 'bg-blue-500/10 text-blue-400' }
                          ].map(sev => (
                            <div key={sev.name} className={`px-3 py-1.5 rounded-lg border border-white/5 text-center flex-grow ${sev.color}`}>
                              <p className="text-[7px] font-bold uppercase tracking-wider">{sev.name}</p>
                              <p className="text-sm font-extrabold mt-0.5">{getIssueCount(debtScannerResult, sev.name)}</p>
                            </div>
                          ))}
                        </div>

                        {/* List */}
                        <div className="bg-[#090d16]/30 border border-white/5 p-3 rounded-xl max-h-[140px] overflow-y-auto space-y-2.5">
                          {debtScannerResult.issues.map((i, idx) => (
                            <div key={idx} className="text-[10px] leading-relaxed border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex justify-between font-bold text-gray-300">
                                <span>{i.title}</span>
                                <span className={`text-[8px] px-1 rounded uppercase ${
                                  i.severity === 'High' ? 'text-red-400' : i.severity === 'Medium' ? 'text-yellow-400' : 'text-blue-400'
                                }`}>{i.severity} Priority</span>
                              </div>
                              <p className="text-gray-500 mt-0.5">{i.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tool 2: Architecture Analysis */}
                  <div className="glass-panel p-5 rounded-2xl relative space-y-4">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-emerald-400" />
                        <span>Architecture Analyzer</span>
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Generates system boundaries and designs review</p>
                    </div>

                    <button
                      onClick={triggerArchitectureAnalysis}
                      disabled={archAnalysisLoading || fileTree.length === 0}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#059669]/15 hover:bg-[#059669]/20 border border-[#059669]/30 text-emerald-400 font-bold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {archAnalysisLoading ? (
                        <div className="h-4 w-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      ) : (
                        <span>Analyze System Layout</span>
                      )}
                    </button>

                    {archAnalysisResult && (
                      <div className="pt-4 border-t border-white/5 space-y-2 animate-fade-in">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Conceptual Summary</p>
                        <div className="p-3 bg-[#090d16]/30 border border-white/5 rounded-xl text-[10px] text-gray-400 leading-relaxed overflow-y-auto max-h-[160px] whitespace-pre-wrap">
                          {archAnalysisResult.summary}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
