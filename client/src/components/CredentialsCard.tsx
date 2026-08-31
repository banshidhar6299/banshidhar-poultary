import React, { useState } from 'react';
import { Copy, Check, Printer, Share2, KeyRound } from 'lucide-react';
import { ChickLogo } from './ChickLogo';

interface CredentialsCardProps {
  farmerId: string;
  username: string;
  temporaryPassword: string;
  name: string;
  phone: string;
  onClose?: () => void;
}

export const CredentialsCard: React.FC<CredentialsCardProps> = ({
  farmerId,
  username,
  temporaryPassword,
  name,
  phone,
  onClose
}) => {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const copyToClipboard = (text: string, type: 'user' | 'phone' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `*BANSHIDHAR POULTRY - FARMER PORTAL LOGIN*\n\nनमस्ते *${name}*,\nआपके बंशीधर पोल्ट्री किसान पोर्टल का लॉगिन विवरण:\n\n👤 *Farmer ID:* ${username}\n📱 *Mobile Number:* ${phone}\n🔑 *Password:* ${temporaryPassword}\n\n📲 Login Link: ${window.location.origin}/farmer/login\n\n*(आप अपने Farmer ID या Mobile Number दोनों में से किसी से भी लॉगिन कर सकते हैं)*`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-w-md mx-auto print:border-none print:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <ChickLogo size={36} />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              BANSHIDHAR POULTRY
            </h4>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">
              Farmer Access Credentials Card
            </span>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
          <KeyRound className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
          <span className="text-slate-500">Farmer Name:</span>
          <span className="font-bold text-slate-900 dark:text-white">{name}</span>
        </div>

        {/* Farmer ID */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Farmer ID (लॉगिन आईडी)
            </span>
            <span className="text-sm font-mono font-black text-brand-700 dark:text-brand-400">
              {username}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(username, 'user')}
            className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Copy Farmer ID"
          >
            {copiedUser ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Phone Number (Also Login ID) */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Mobile Number (मोबाइल से भी लॉगिन होगा)
            </span>
            <span className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">
              {phone}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(phone, 'phone')}
            className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Copy Phone Number"
          >
            {copiedPhone ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Field */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
              Password (पासवर्ड)
            </span>
            <span className="text-sm font-mono font-black text-amber-900 dark:text-amber-200 tracking-wider">
              {temporaryPassword}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(temporaryPassword, 'pass')}
            className="p-2 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors"
            title="Copy Password"
          >
            {copiedPass ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 no-print">
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>WhatsApp Share</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Card</span>
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors no-print"
        >
          Close
        </button>
      )}
    </div>
  );
};
