'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import { 
  FolderPlus, 
  Code, 
  Trash2, 
  FileCode, 
  History, 
  ArrowRight,
  AlertCircle,
  FolderOpen
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: {
    files: number;
    reviews: number;
  };
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await api.get<Project[]>('/projects');
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateLoading(true);

    try {
      const newProj = await api.post<Project>('/projects', {
        name: projectName,
        description: projectDescription || undefined,
      });
      
      setProjects([
        { ...newProj, _count: { files: 0, reviews: 0 } },
        ...projects
      ]);
      
      // Reset & Close
      setProjectName('');
      setProjectDescription('');
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Code Vault</h1>
            <p className="text-xs text-gray-500">Manage your repositories and reviews</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all hover-glow shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="h-8 w-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="flex-grow flex flex-col justify-center items-center border border-dashed border-white/5 rounded-3xl p-12 text-center bg-neutral-950/20 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/70 mb-4">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No projects found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
              Create a project and upload your repository files to get started with code explorer reviews.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all hover-glow cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {projects.map((project) => (
              <div key={project.id} className="glass-panel p-6 rounded-2xl flex flex-col relative group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate pr-4">
                    {project.name}
                  </h3>
                  
                  {confirmDeleteId === project.id ? (
                    <div className="flex items-center space-x-2 z-10">
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <span className="text-gray-600 text-xs">|</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(project.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 mb-6 flex-1">
                  {project.description || 'No description provided.'}
                </p>

                {/* Metrics Footer */}
                <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-auto">
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                      <FileCode className="h-3.5 w-3.5" />
                      <span>{project._count.files} Files</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                      <History className="h-3.5 w-3.5" />
                      <span>{project._count.reviews} Reviews</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-600 font-medium">
                    {formatDate(project.createdAt)}
                  </span>
                </div>

                {/* Entire card links to details, except actions */}
                <Link
                  href={`/projects/${project.id}`}
                  className="absolute inset-0 z-0 rounded-2xl cursor-pointer"
                  style={{ pointerEvents: confirmDeleteId === project.id ? 'none' : 'auto' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              
              <h2 className="text-xl font-bold text-white mb-2">Create Project</h2>
              <p className="text-xs text-gray-400 mb-6">Group your target files under a new workspace</p>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Project Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Portfolio Website"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="e.g. Next.js website with database integration"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
                  />
                </div>

                <div className="flex space-x-3 justify-end border-t border-white/5 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setProjectName('');
                      setProjectDescription('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all hover-glow disabled:opacity-50 cursor-pointer"
                  >
                    {createLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Project</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
