import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Image as ImageIcon,
  RotateCcw,
  Bot,
  User,
  AlertTriangle,
  ChevronDown,
  LogIn
} from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ChickLogo } from './ChickLogo';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export const AIFloatingButton: React.FC = () => {
  const { t, isHindi } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: isHindi
        ? 'नमस्ते किसान भाई! मैं बंशीधर पोल्ट्री का AI सहायक हूँ। आप मुझसे चूजों की देखभाल, तापमान, दाना-पानी, टीकाकरण या बीमारी के लक्षणों के बारे में पूछ सकते हैं। आप मुर्गियों या बीट की फोटो भी भेज सकते हैं।'
        : 'Hello! I am Banshidhar Poultry AI Assistant. Ask me anything about chick brooding, feed, temperature, diseases, or upload a photo of your birds for guidance.'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check AI status from server
    api
      .get('/ai/status')
      .then((res) => {
        if (res.data.success) {
          setIsEnabled(res.data.data.isEnabled);
          setDisclaimer(
            isHindi
              ? res.data.data.emergencyDisclaimerHi
              : res.data.data.emergencyDisclaimerEn
          );
        }
      })
      .catch(() => setIsEnabled(false));
  }, [isHindi]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputPrompt.trim() && !selectedImage) || loading) return;

    const userText = inputPrompt.trim();
    const userImgUrl = imagePreview;

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userText, imageUrl: userImgUrl || undefined }
    ];

    setMessages(updatedMessages);
    setInputPrompt('');
    setSelectedImage(null);
    setImagePreview(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append(
        'messages',
        JSON.stringify(
          updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl
          }))
        )
      );

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await api.post('/ai/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.data.data.reply }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isHindi
            ? 'क्षमा करें, AI सेवा वर्तमान में व्यस्त है। कृपया कुछ देर बाद पुनः प्रयास करें।'
            : 'AI service is temporarily busy. Please try again in a moment.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: isHindi
          ? 'नई बातचीत शुरू की गई। आप क्या जानना चाहते हैं?'
          : 'New conversation started. How can I help you today?'
      }
    ]);
  };

  if (!isEnabled) return null;

  // If not authenticated, show login prompt instead of full AI chat
  const handleUnauthenticatedClick = () => {
    window.location.href = '/farmer/login';
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => isAuthenticated ? setIsOpen(true) : handleUnauthenticatedClick()}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-brand-600/40 hover:shadow-brand-600/60 active:scale-95 transition-all group"
          title={isAuthenticated ? (isHindi ? 'कुक्कुट मित्र AI' : 'Poultry AI Doctor') : (isHindi ? 'AI उपयोग के लिए लॉगिन करें' : 'Login to use AI')}
        >
          <div className="relative">
            {isAuthenticated ? (
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
          </div>
          <span className="font-display tracking-tight">
            {isAuthenticated
              ? (isHindi ? 'कुक्कुट मित्र AI' : 'Poultry AI Doctor')
              : (isHindi ? 'AI लॉगिन' : 'Login for AI')}
          </span>
        </button>
      )}

      {/* AI Chat Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col w-full h-full sm:w-[420px] sm:h-[600px] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-700 to-indigo-800 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <ChickLogo size={32} />
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {isHindi ? 'कुक्कुट मित्र (पोल्ट्री AI सहायक)' : 'Poultry AI Assistant'}
                </h3>
                <span className="text-[10px] text-brand-200 block -mt-0.5">
                  Banshidhar Poultry Health Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetConversation}
                title="New Chat"
                className="p-1.5 hover:bg-white/10 rounded-lg text-brand-100 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:bg-white/10 rounded-lg text-brand-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 border-b border-amber-200 dark:border-amber-900/40 flex items-center gap-2 text-[10px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span className="line-clamp-1">{disclaimer || t.ai.disclaimer}</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded bird"
                      className="w-full max-h-44 object-cover rounded-xl mb-2 border border-black/10"
                    />
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {msg.role === 'user' && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-brand-600 dark:text-brand-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{t.ai.analyzing}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview if selected */}
          {imagePreview && (
            <div className="p-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">Image attached</span>
              </div>
              <button onClick={handleClearImage} className="p-1 text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t.ai.uploadPhoto}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={t.ai.placeholder}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <button
              type="submit"
              disabled={(!inputPrompt.trim() && !selectedImage) || loading}
              className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
