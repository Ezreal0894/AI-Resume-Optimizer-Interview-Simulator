import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Trash2, 
  Save, 
  User, 
  Mail, 
  Briefcase, 
  MapPin, 
  Globe,
  LogOut,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EditTagsModal from '../components/profile/EditTagsModal';

interface ProfileSettingsViewProps {
  onLogout?: () => void;
  selectedRoles?: string[];
}

const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ onLogout, selectedRoles = ['Frontend Dev', 'Full Stack'] }) => {
  // State for avatar management
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for tags modal
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<string[]>(selectedRoles);

  // Update local roles when prop changes
  useEffect(() => {
    setCurrentRoles(selectedRoles);
  }, [selectedRoles]);

  const handleSaveTags = (newTags: string[]) => {
    setCurrentRoles(newTags);
    setIsTagsModalOpen(false);
    // In a real app, we would also call an API to update the user's profile
  };

  // Mock initial data
  const [savedData, setSavedData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    title: 'Senior Frontend Engineer',
    email: 'john.doe@example.com',
    location: 'San Francisco, CA',
    website: 'johndoe.dev',
    bio: 'Passionate about building accessible and performant web applications. Love React, Tailwind, and AI.',
  });

  const [formData, setFormData] = useState(savedData);

  // Check for form changes
  useEffect(() => {
    const isFormChanged = JSON.stringify(formData) !== JSON.stringify(savedData);
    // We consider it dirty if form changed OR if there is a new previewUrl (avatar changed)
    // Note: In a real app, saving would upload the avatar and clear previewUrl or set it as the new current.
    setIsDirty(isFormChanged || !!previewUrl);
  }, [formData, savedData, previewUrl]);

  const handleSave = () => {
    setSavedData(formData);
    // If there was a preview URL, we would typically upload it here.
    // For this mock, we'll just clear the dirty state by updating savedData.
    // If we want to keep the avatar "new" state until refresh, we can leave previewUrl.
    // But to "clear" the dirty state of the avatar, we might need to clear previewUrl 
    // and update the "source" image. 
    // For this UI demo, let's just accept the form data update.
    setIsDirty(false);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsDirty(true);
    }
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    setIsDirty(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup memory on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto relative z-10 pb-24 md:pb-8">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-slate-500/5 blur-[80px]" />
      </div>

      <div className="mb-6 md:mb-8 pt-safe md:pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">Profile Settings</h2>
        <p className="text-base md:text-lg text-slate-500">Manage your public identity and personal details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Avatar & Identity Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center text-center h-full">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              {/* Avatar Image Container */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-indigo-500/10 overflow-hidden relative bg-slate-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={previewUrl || 'default'}
                    src={previewUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                
                {/* Hover Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-xs font-medium">Change Photo</span>
                </motion.div>
              </div>

              {/* Hidden Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {/* Online Status Indicator */}
              <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
            </div>

            <div className="mt-6 space-y-1">
              <h3 className="text-xl font-bold text-slate-900">{formData.firstName} {formData.lastName}</h3>
              <p className="text-slate-500 font-medium">{formData.title}</p>
            </div>

            <div className="mt-8 w-full space-y-3">
              <button 
                onClick={handleSave}
                disabled={!isDirty}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isDirty 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] animate-pulse' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              
              <button 
                onClick={handleRemoveAvatar}
                className="w-full py-3 rounded-full font-medium text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Avatar
              </button>

              <div className="pt-4 mt-4 border-t border-slate-100 w-full">
                <button 
                  onClick={onLogout}
                  className="w-full py-3 rounded-full font-bold text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Basic Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Professional Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Bio</label>
                <textarea 
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 resize-none"
                />
                <p className="text-xs text-slate-400 text-right">240 characters left</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Career Tags Section */}
          <div className="mt-6 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-500" />
              Career Focus
            </h3>
            <div className="flex flex-wrap gap-3">
              {currentRoles.map((role, index) => (
                <motion.span
                  key={role}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 flex items-center gap-2"
                >
                  {role}
                </motion.span>
              ))}
              <button 
                onClick={() => setIsTagsModalOpen(true)}
                className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 text-sm font-bold border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                + Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditTagsModal 
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        initialTags={currentRoles}
        onSave={handleSaveTags}
      />
    </div>
  );
};

export default ProfileSettingsView;
