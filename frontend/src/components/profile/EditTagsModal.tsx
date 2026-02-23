import React, { useState, useEffect } from 'react';
import { 
  X, Search, Check,
  Code2, Server, Layout,
  BrainCircuit, Briefcase, PenTool,
  Smartphone, ShieldCheck, Gamepad2,
  ClipboardCheck, Cloud, Cpu, Network,
  BarChart3, CalendarClock, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onSave: (newTags: string[]) => void;
}

const ALL_ROLES = [
  { id: 'Frontend Dev', label: 'Frontend Dev', icon: Layout },
  { id: 'Backend Dev', label: 'Backend Dev', icon: Server },
  { id: 'Full Stack', label: 'Full Stack', icon: Code2 },
  { id: 'Mobile (iOS/Android)', label: 'Mobile (iOS/Android)', icon: Smartphone },
  { id: 'Product Manager', label: 'Product Manager', icon: Briefcase },
  { id: 'UI/UX Design', label: 'UI/UX Design', icon: PenTool },
  { id: 'AI / LLM Engineer', label: 'AI / LLM Engineer', icon: BrainCircuit },
  { id: 'Data Scientist', label: 'Data Scientist', icon: BarChart3 },
  { id: 'DevOps / SRE', label: 'DevOps / SRE', icon: Cloud },
  { id: 'QA Engineer', label: 'QA Engineer', icon: ClipboardCheck },
  { id: 'Cyber Security', label: 'Cyber Security', icon: ShieldCheck },
  { id: 'Game Developer', label: 'Game Developer', icon: Gamepad2 },
  { id: 'Project Manager', label: 'Project Manager', icon: CalendarClock },
  { id: 'Embedded Systems', label: 'Embedded Systems', icon: Cpu },
  { id: 'Network Engineer', label: 'Network Engineer', icon: Network },
  { id: 'Operations', label: 'Operations', icon: Megaphone },
];

const EditTagsModal: React.FC<EditTagsModalProps> = ({ isOpen, onClose, initialTags, onSave }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTags(initialTags);
      setSearchQuery('');
      setIsDirty(false);
    }
  }, [isOpen, initialTags]);

  useEffect(() => {
    const sortedSelected = [...selectedTags].sort();
    const sortedInitial = [...initialTags].sort();
    const isChanged = JSON.stringify(sortedSelected) !== JSON.stringify(sortedInitial);
    setIsDirty(isChanged);
  }, [selectedTags, initialTags]);

  const toggleTag = (tagLabel: string) => {
    setSelectedTags(prev =>
      prev.includes(tagLabel)
        ? prev.filter(t => t !== tagLabel)
        : [...prev, tagLabel]
    );
  };

  const filteredRoles = ALL_ROLES.filter(role =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-[85vh] md:h-[80vh] md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex-none px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-20">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Career Focus</h2>
                <p className="text-sm text-slate-500">Select roles to personalize your experience.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-none px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search roles (e.g. Frontend, Product)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {/* Selected Tags */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Selected ({selectedTags.length})
                </h3>
                <motion.div layout className="flex flex-wrap gap-2 min-h-[40px]">
                  <AnimatePresence>
                    {selectedTags.length > 0 ? (
                      selectedTags.map(tag => (
                        <motion.button
                          layout
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => toggleTag(tag)}
                          className="group px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-1.5"
                        >
                          {tag}
                          <X className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                        </motion.button>
                      ))
                    ) : (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400 italic">
                        No roles selected. Choose from below.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Available Tags Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Available Roles</h3>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-24">
                  {filteredRoles.map((role) => {
                    const isSelected = selectedTags.includes(role.label);
                    return (
                      <motion.button
                        layout
                        key={role.id}
                        onClick={() => toggleTag(role.label)}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-500 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          <role.icon className="w-5 h-5" />
                        </div>
                        <span className={`font-bold text-sm flex-1 ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                          {role.label}
                        </span>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none p-6 bg-white border-t border-slate-100 pb-safe z-20">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(selectedTags)}
                  disabled={!isDirty}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
                    isDirty
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 scale-100'
                      : 'bg-slate-300 cursor-not-allowed shadow-none opacity-70'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditTagsModal;
