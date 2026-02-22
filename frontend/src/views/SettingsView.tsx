import React from 'react';
import { 
  User, 
  CreditCard, 
  Sparkles, 
  Bell, 
  Shield, 
  LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'JD';
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto pb-24 md:pb-8">
      <div className="mb-6 md:mb-8 pt-safe md:pt-0">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2 tracking-tight">Settings</h2>
        <p className="text-base md:text-lg text-slate-500">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <User className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">Profile Information</h3>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-2xl text-white font-medium shadow-lg shadow-indigo-500/20">
                {getInitials()}
              </div>
              <div className="space-y-2 text-center md:text-left">
                <button className="px-4 h-12 md:h-auto md:py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center">
                  Change Avatar
                </button>
                <p className="text-xs text-slate-400">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">First Name</label>
                <input type="text" defaultValue={user?.name?.split(' ')[0] || 'John'} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Last Name</label>
                <input type="text" defaultValue={user?.name?.split(' ')[1] || 'Doe'} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Professional Title</label>
                <input type="text" defaultValue="Senior Frontend Engineer" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Account & Subscription */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">Subscription & Billing</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-6 gap-4 md:gap-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-indigo-900">{user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
                  <p className="text-sm text-indigo-700">Billed annually • Next billing date: Oct 24, 2026</p>
                </div>
              </div>
              <button className="w-full md:w-auto px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 transition-colors">
                Manage Subscription
              </button>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between py-2">
                 <span className="text-sm text-slate-600">Payment Method</span>
                 <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                   <div className="w-8 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">VISA</div>
                   •••• 4242
                 </span>
               </div>
               <div className="flex items-center justify-between py-2 border-t border-slate-100">
                 <span className="text-sm text-slate-600">Billing Email</span>
                 <span className="text-sm font-medium text-slate-900">{user?.email || 'john.doe@example.com'}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-500" />
            <h3 className="font-medium text-slate-900">Notifications</h3>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            {[
              { label: 'Email Digest', desc: 'Receive a weekly summary of your interview progress', default: true },
              { label: 'New Features', desc: 'Get notified about new AI models and tools', default: true },
              { label: 'Marketing', desc: 'Receive offers and promotions', default: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-red-100 bg-red-50/30 flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-red-900">Danger Zone</h3>
          </div>
          <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <p className="text-sm font-medium text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-500">Permanently remove your account and all data.</p>
            </div>
            <button className="w-full md:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-8">
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;