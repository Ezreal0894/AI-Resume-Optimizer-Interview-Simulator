import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, category: string) => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('resume');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onUpload(file, category);
            setUploading(false);
            setProgress(0);
            setFile(null);
            onClose();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Dropzone */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50' 
                    : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input 
                  ref={inputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleChange}
                  accept=".pdf,.docx,.doc,.txt"
                />
                
                {file ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3 text-indigo-600 shadow-sm">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      onClick={(e) => {e.stopPropagation();setFile(null);}}
                      className="mt-3 text-xs font-bold text-red-500 hover:text-red-600 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 text-indigo-500">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX or TXT (MAX. 10MB)</p>
                  </div>
                )}

                {/* Drag Overlay */}
                {dragActive && (
                  <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-center border-2 border-indigo-500 pointer-events-none">
                    <p className="font-bold text-indigo-600 text-lg">Drop file here</p>
                  </div>
                )}
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">Document Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['resume', 'cover_letter', 'other'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${
                        category === cat 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={onClose}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentUploadModal;
