import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  FileBarChart, 
  FileCheck, 
  Eye, 
  Download, 
  Trash2, 
  FolderOpen,
  MoreVertical,
  Pin,
  PinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';

// --- Types ---
type DocType = 'resume' | 'optimized' | 'report';

interface Document {
  id: string;
  title: string;
  category: DocType;
  fileType: 'pdf' | 'docx';
  size: string;
  date: string;
  tags: { label: string; color: 'indigo' | 'emerald' | 'amber' | 'slate' }[];
  isPinned?: boolean;
}

// --- Mock Data ---
const MOCK_DOCS: Document[] = [
  {
    id: '1',
    title: 'Senior_Frontend_Resume_v1.pdf',
    category: 'resume',
    fileType: 'pdf',
    size: '1.2 MB',
    date: '2 hours ago',
    tags: [{ label: 'Original', color: 'slate' }]
  },
  {
    id: '2',
    title: 'Frontend_Lead_Optimized_v2.pdf',
    category: 'optimized',
    fileType: 'pdf',
    size: '1.4 MB',
    date: 'Yesterday',
    tags: [{ label: 'Match 95%', color: 'emerald' }, { label: 'ATS Ready', color: 'indigo' }]
  },
  {
    id: '3',
    title: 'Interview_Feedback_Google.docx',
    category: 'report',
    fileType: 'docx',
    size: '850 KB',
    date: '3 days ago',
    tags: [{ label: 'System Design', color: 'amber' }]
  },
  {
    id: '4',
    title: 'FullStack_Engineer_Draft.docx',
    category: 'resume',
    fileType: 'docx',
    size: '2.1 MB',
    date: 'Oct 24, 2025',
    tags: [{ label: 'Draft', color: 'slate' }]
  },
  {
    id: '5',
    title: 'Behavioral_Analysis_Report.pdf',
    category: 'report',
    fileType: 'pdf',
    size: '3.5 MB',
    date: 'Oct 20, 2025',
    tags: [{ label: 'Leadership', color: 'indigo' }]
  },
];

const TABS = [
  { id: 'all', label: 'All Files' },
  { id: 'resume', label: 'Original Resumes' },
  { id: 'optimized', label: 'AI Optimized' },
  { id: 'report', label: 'Interview Reports' },
];

interface DocumentLibraryViewProps {
  isPreviewMode?: boolean;
  onPreviewModeChange?: (isMode: boolean) => void;
}

const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({ isPreviewMode = false, onPreviewModeChange }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Sync internal preview state with external mode
  useEffect(() => {
    if (!isPreviewMode) {
      setPreviewDocument(null);
    }
  }, [isPreviewMode]);

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
    onPreviewModeChange?.(true);
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
    onPreviewModeChange?.(false);
  };

  const handleUpload = (file: File, category: string) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: file.name,
      category: (category === 'cover_letter' || category === 'other') ? 'resume' : category as DocType,
      fileType: file.name.split('.').pop()?.toLowerCase().includes('pdf') ? 'pdf' : 'docx',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: 'Just now',
      tags: [{ label: 'New', color: 'emerald' }]
    };
    setDocuments([newDoc, ...documents]);
  };

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.category === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handlePin = (id: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, isPinned: !doc.isPinned } : doc
    ));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto relative z-10 pb-24 md:pb-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* 1. Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-safe md:pt-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Document Library</h2>
          <p className="text-base md:text-lg text-slate-500 mt-1">Manage your resumes and AI insights.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 h-12 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Upload New</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* 2. Fluid Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-full md:w-fit border border-slate-200/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors z-10 flex-1 md:flex-none text-center ${
              activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Responsive File Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col md:block"
              >
                <div className="p-6 flex-1 relative">
                  {doc.isPinned && (
                    <div className="absolute top-0 right-0 p-2">
                      <Pin className="w-4 h-4 text-indigo-500 fill-indigo-500/20 rotate-45" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      doc.category === 'resume' ? 'bg-slate-100 text-slate-600' :
                      doc.category === 'optimized' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {doc.category === 'report' ? <FileBarChart className="w-6 h-6" /> : 
                       doc.category === 'optimized' ? <FileCheck className="w-6 h-6" /> : 
                       <FileText className="w-6 h-6" />}
                    </div>
                    <button className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-2 leading-tight" title={doc.title}>
                    {doc.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-4">
                    <span>{doc.size}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{doc.date}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {doc.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          tag.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          tag.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          tag.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Bar - Hover on Desktop, Always visible on Mobile (simulated by layout) */}
                <div className="md:absolute md:bottom-0 md:left-0 md:w-full md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 z-10">
                  <div className="bg-slate-900/90 backdrop-blur-md p-4 flex justify-around items-center border-t border-white/10 md:rounded-b-2xl">
                    <button 
                      onClick={() => handlePin(doc.id)}
                      className={`p-2 rounded-full transition-colors ${doc.isPinned ? 'bg-indigo-500/20 text-indigo-300 hover:text-indigo-200' : 'hover:bg-white/20 text-white/80 hover:text-white'}`}
                      title={doc.isPinned ? "Unpin" : "Pin to top"}
                    >
                      {doc.isPinned ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => handlePreview(doc)}
                      className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors" 
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors" title="Download">
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-full hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-colors" 
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Mobile Action Bar Fallback */}
                <div className="md:hidden border-t border-slate-100 p-3 flex justify-around bg-slate-50/50">
                   <button 
                      onClick={() => handlePreview(doc)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-white"
                   >
                      <Eye className="w-4 h-4" /> Preview
                   </button>
                   <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 px-4 py-2 rounded-lg hover:bg-white">
                      <Download className="w-4 h-4" />
                   </button>
                </div>

              </motion.div>
            ))
          ) : (
            /* 4. Empty State */
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <FolderOpen className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No documents found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">
                {searchQuery ? `No results for "${searchQuery}"` : "Upload your first resume to get started with AI analysis."}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-6 py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                >
                  Upload Document
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DocumentUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleUpload} 
      />
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={handleClosePreview}
        document={previewDocument}
        isFullScreen={isPreviewMode}
      />
    </div>
  );
};

export default DocumentLibraryView;