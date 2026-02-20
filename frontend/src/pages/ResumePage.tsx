/**
 * 简历优化页面
 * 设计系统：卡片式布局，柔和阴影，大圆角
 */
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cloud, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { resumeApi } from '../api/resume';

export default function ResumePage() {
  const { resumes, isUploading, setUploading, addResume, setCurrentResume } = useResumeStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = useCallback(
    async (file: File) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('仅支持 PDF 和 DOCX 格式');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过 5MB');
        return;
      }

      setError('');
      setUploading(true);

      try {
        const response = await resumeApi.upload(file);
        addResume(response.data.data.resume);
        setCurrentResume(response.data.data.resume, response.data.data.analysis);
      } catch (err: any) {
        setError(err.response?.data?.message || '上传失败，请重试');
      } finally {
        setUploading(false);
      }
    },
    [setUploading, addResume, setCurrentResume]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const mockFiles = [
    { name: '前端开发工程师_简历.pdf', date: '2024-01-15', status: '已优化' },
    { name: '产品经理_简历.docx', date: '2024-01-10', status: '待优化' },
    { name: '全栈工程师_简历.pdf', date: '2024-01-05', status: '已优化' },
  ];

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">简历优化</h1>
        <p className="text-sm text-gray-400 mb-8">上传简历，AI 将为你提供专业的优化建议</p>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-100 rounded-xl text-error-500 text-sm">
          {error}
        </div>
      )}

      {/* Dropzone */}
      <motion.div
        className={`relative overflow-hidden border-2 border-dashed rounded-xl p-16 text-center transition-all duration-150 ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* 扫光效果 */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-30"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" strokeWidth={1.5} />
              <p className="text-base text-gray-600">正在分析简历...</p>
            </div>
          ) : (
            <>
              <motion.div
                className="w-16 h-16 mx-auto mb-6 bg-white rounded-xl shadow-soft flex items-center justify-center"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Cloud className="w-8 h-8 text-primary-500" strokeWidth={1.5} />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                将 PDF/Docx 简历拖拽至此
              </h3>
              <p className="text-sm text-gray-400 mb-6">或点击上传文件</p>
              <label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.span
                  className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-medium text-sm cursor-pointer shadow-soft"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(14,165,233,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  选择文件
                </motion.span>
              </label>
            </>
          )}
        </div>
      </motion.div>

      {/* 历史文件列表 */}
      <motion.div
        className="mt-8 bg-white rounded-xl border border-gray-200 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">历史简历</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {mockFiles.map((file, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{file.date}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  file.status === '已优化'
                    ? 'bg-success-50 text-success-500'
                    : 'bg-warning-50 text-warning-500'
                }`}
              >
                {file.status}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
