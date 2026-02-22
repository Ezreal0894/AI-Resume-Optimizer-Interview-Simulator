import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Clock, 
  User, 
  Tag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    title: string;
    fileType: 'pdf' | 'docx';
    size: string;
    date: string;
    category: string;
  } | null;
  isFullScreen?: boolean;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, document, isFullScreen = false }) => {
  const [scale, setScale] = useState(1);

  if (!document) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`z-50 flex items-center justify-center overflow-hidden ${
          isFullScreen 
            ? 'absolute inset-0 bg-slate-50' 
            : 'fixed inset-0 p-4 sm:p-6'
        }`}>
          {/* Backdrop - Only show if NOT full screen */}
          {!isFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-0"
            />
          )}
          
          {/* Modal Content */}
          <motion.div
            initial={isFullScreen ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={isFullScreen ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isFullScreen ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-white shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row ${
              isFullScreen 
                ? 'w-full h-full rounded-none' 
                : 'w-full max-w-6xl h-[85vh] rounded-3xl'
            }`}
          >
            {/* Left: Document Viewer (Mock) */}
            <div className="flex-1 bg-slate-100 relative flex flex-col min-w-0 overflow-hidden">
              {/* Viewer Toolbar */}
              <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 relative shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button 
                      onClick={handleZoomOut}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all active:scale-95"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 px-2 min-w-[3rem] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <button 
                      onClick={handleZoomIn}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all active:scale-95"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-500">Page 1 of 2</div>
              </div>

              {/* Document Canvas (Mock) */}
              <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-50/50 relative z-0">
                <div 
                  className="transition-transform duration-200 ease-out origin-top"
                  style={{ transform: `scale(${scale})` }}
                >
                  <div className="w-[800px] bg-white shadow-lg min-h-[1000px] p-12 space-y-8 relative group border border-slate-200/60">
                    {/* Mock Document Content */}
                    <div className="w-24 h-24 bg-slate-200 rounded-full mb-8"></div>
                    <div className="space-y-4">
                      <div className="h-8 bg-slate-800 w-3/4 rounded-md"></div>
                      <div className="h-4 bg-indigo-500 w-1/4 rounded-md"></div>
                    </div>
                    <div className="space-y-3 pt-8">
                      <div className="h-4 bg-slate-200 w-full rounded"></div>
                      <div className="h-4 bg-slate-200 w-full rounded"></div>
                      <div className="h-4 bg-slate-200 w-5/6 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 pt-8">
                      <div className="space-y-3">
                        <div className="h-6 bg-slate-300 w-1/2 rounded mb-4"></div>
                        <div className="h-4 bg-slate-100 w-full rounded"></div>
                        <div className="h-4 bg-slate-100 w-full rounded"></div>
                        <div className="h-4 bg-slate-100 w-3/4 rounded"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-6 bg-slate-300 w-1/2 rounded mb-4"></div>
                        <div className="h-4 bg-slate-100 w-full rounded"></div>
                        <div className="h-4 bg-slate-100 w-full rounded"></div>
                        <div className="h-4 bg-slate-100 w-3/4 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Watermark/Overlay for effect */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50">
                      <div className="bg-slate-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium shadow-xl transform scale-90 group-hover:scale-100 transition-transform border border-white/10">
                        Preview Mode
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sidebar Info */}
            <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full z-20 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white z-10 sticky top-0">
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate" title={document.title}>
                    {document.title}
                  </h3>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider truncate">
                    {document.fileType.toUpperCase()} • {document.size}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="flex-none p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Metadata */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-none">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-xs">Last Modified</p>
                      <p className="font-medium text-slate-900 truncate">{document.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-none">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-xs">Owner</p>
                      <p className="font-medium text-slate-900 truncate">John Doe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-none">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-xs">Category</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded capitalize truncate max-w-full">
                        {document.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Insights (Mock) */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-none" /> 
                    <span className="truncate">AI Summary</span>
                  </h4>
                  <p className="text-xs text-indigo-800/80 leading-relaxed break-words">
                    This document appears to be a technical resume focused on frontend development. It contains strong keywords related to React and modern web technologies.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3 z-10 sticky bottom-0">
                <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download File
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentPreviewModal;