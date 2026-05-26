import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Key, MessageSquare, Palette, Shield, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business info', icon: Settings },
  { id: 'whatsapp', label: 'WhatsApp setup', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing & plan', icon: CreditCard },
  { id: 'api', label: 'API & integrations', icon: Key },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const { profile, business, signOut } = useAuthStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="card p-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors mb-0.5 ${
                  activeSection === section.id
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
          <div className="border-t border-surface-border mt-2 pt-2">
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Settings content */}
        <div className="lg:col-span-3 card p-6">
          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="text-sm font-semibold text-text-primary">Profile settings</h2>
              <div className="flex items-center gap-4 pb-5 border-b border-surface-border">
                <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xl font-semibold">
                  RS
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{profile?.full_name || 'Rajesh Sharma'}</p>
                  <p className="text-xs text-text-tertiary mt-0.5 capitalize">{profile?.role || 'owner'}</p>
                  <button className="text-xs text-brand-400 mt-1">Change photo</button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs text-text-tertiary block mb-1.5">Full name</label><input className="input" defaultValue={profile?.full_name || 'Rajesh Sharma'} /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">Mobile number</label><input className="input" defaultValue="+91 98765 43210" /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">Email</label><input className="input" type="email" defaultValue="rajesh@sharmatools.com" /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">Language</label>
                  <select className="input">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="hi-en">Hinglish</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary text-sm">Save changes</button>
            </motion.div>
          )}

          {activeSection === 'business' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="text-sm font-semibold text-text-primary">Business information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs text-text-tertiary block mb-1.5">Business name</label><input className="input" defaultValue={business?.name || 'Sharma Hardware Stores'} /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">Business type</label><input className="input" defaultValue="hardware" /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">GSTIN</label><input className="input" defaultValue="24AABCS1429B1ZX" /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">City</label><input className="input" defaultValue="Ahmedabad, Gujarat" /></div>
                <div className="sm:col-span-2"><label className="text-xs text-text-tertiary block mb-1.5">Address</label><textarea className="input resize-none" rows={2} defaultValue="Shop No. 42, Manek Chowk, Ahmedabad — 380001" /></div>
              </div>
              <button className="btn-primary text-sm">Save changes</button>
            </motion.div>
          )}

          {activeSection === 'whatsapp' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="text-sm font-semibold text-text-primary">WhatsApp Business setup</h2>
              <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs font-medium text-success">Connected</span>
                </div>
                <p className="text-xs text-text-secondary">WhatsApp number: <span className="font-mono text-text-primary">+91 98765 43210</span></p>
              </div>
              <div>
                <label className="text-xs text-text-tertiary block mb-1.5">Webhook URL</label>
                <div className="flex gap-2">
                  <input className="input flex-1 font-mono text-xs" readOnly value="https://your-project.supabase.co/functions/v1/whatsapp-webhook" />
                  <button className="btn-ghost text-xs px-3">Copy</button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs text-text-tertiary block mb-1.5">Phone Number ID</label><input className="input font-mono text-xs" placeholder="123456789012345" /></div>
                <div><label className="text-xs text-text-tertiary block mb-1.5">Meta Access Token</label><input className="input font-mono text-xs" type="password" placeholder="EAAxxxxxxxx..." /></div>
              </div>
              <button className="btn-primary text-sm">Update configuration</button>
            </motion.div>
          )}

          {!['profile', 'business', 'whatsapp'].includes(activeSection) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Settings size={32} className="text-text-disabled mb-4" />
              <p className="text-sm text-text-primary capitalize">{activeSection} settings</p>
              <p className="text-xs text-text-tertiary mt-1">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
