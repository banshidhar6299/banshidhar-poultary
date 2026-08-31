import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Check,
  CheckCheck,
  X,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatDateTime } from '../../api/client';
import { Conversation, Message } from '../../types';
import { AudioRecorder } from '../../components/AudioRecorder';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ChickLoader } from '../../components/ChickLoader';

export const FarmerChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t, isHindi } = useLanguage();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Load farmer conversation
  useEffect(() => {
    api
      .get('/chat/my-conversation')
      .then((res) => {
        if (res.data.success) {
          setConversation(res.data.data);
          loadMessages(res.data.data._id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages?limit=100`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Socket realtime events
  useEffect(() => {
    if (!socket || !conversation) return;

    socket.emit('join_conversation', conversation._id);

    socket.on('new_message', (msg: Message) => {
      if (msg.conversationId === conversation._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('user_typing', ({ senderName, isTyping }: any) => {
      setPartnerTyping(isTyping);
    });

    return () => {
      socket.emit('leave_conversation', conversation._id);
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
    if (!socket || !conversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', {
        conversationId: conversation._id,
        senderName: user?.name
      });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId: conversation._id });
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!textInput.trim() && !selectedFile) || !conversation) return;

    const content = textInput.trim();
    setTextInput('');

    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      handleClearFile();

      await api.post(`/chat/conversations/${conversation._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendAudioBlob = async (audioBlob: Blob, durationSec: number) => {
    if (!conversation) return;
    setIsRecordingAudio(false);

    try {
      const formData = new FormData();
      formData.append('media', audioBlob, `voice-note-${Date.now()}.webm`);
      formData.append('type', 'AUDIO');
      formData.append('mediaDurationSec', String(durationSec));

      await api.post(`/chat/conversations/${conversation._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err: any) {
      alert('Failed to send audio message.');
    }
  };

  if (loading) return <ChickLoader text="Connecting to chat..." />;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Top Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-brand-700 to-brand-900 text-white flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-sm font-bold tracking-tight">
            {isHindi ? 'बंशीधर पोल्ट्री (डीलर सहायता)' : 'Banshidhar Poultry Dealer Support'}
          </h2>
          <span className="text-[10px] text-brand-200 block">
            {partnerTyping ? 'Admin is typing...' : 'Direct 1-on-1 Communication'}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/60 text-xs">
        {messages.map((msg) => {
          const isMe = msg.senderRole === 'FARMER';
          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm space-y-1.5 ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                {/* Image message */}
                {msg.type === 'IMAGE' && msg.mediaUrl && (
                  <img
                    src={msg.mediaUrl}
                    alt="Chat media"
                    className="w-full max-h-60 object-cover rounded-xl border border-black/10"
                    loading="lazy"
                  />
                )}

                {/* Video message */}
                {msg.type === 'VIDEO' && msg.mediaUrl && (
                  <video
                    src={msg.mediaUrl}
                    controls
                    className="w-full max-h-60 rounded-xl border border-black/10"
                  />
                )}

                {/* Audio voice note */}
                {msg.type === 'AUDIO' && msg.mediaUrl && (
                  <AudioPlayer src={msg.mediaUrl} durationSec={msg.mediaDurationSec} />
                )}

                {/* Text Content */}
                {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                <div
                  className={`flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  <span>{formatDateTime(msg.createdAt)}</span>
                  {isMe && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          );
        })}

        {partnerTyping && (
          <div className="text-xs text-brand-600 dark:text-brand-400 italic p-2">
            Dealer is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {selectedFile?.name}
            </span>
          </div>
          <button onClick={handleClearFile} className="p-1 text-slate-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        {isRecordingAudio ? (
          <AudioRecorder
            onSendAudio={handleSendAudioBlob}
            onCancel={() => setIsRecordingAudio(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Attach Image / Video"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={textInput}
              onChange={handleInputChange}
              placeholder={t.chat.placeholder}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />

            {textInput.trim() || selectedFile ? (
              <button
                type="submit"
                className="p-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingAudio(true)}
                className="p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 hover:bg-brand-100 rounded-xl transition-all"
                title={t.chat.recordVoice}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
