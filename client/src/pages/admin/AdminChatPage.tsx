import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Check,
  User,
  Search,
  X
} from 'lucide-react';
import { api, formatDateTime } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { Conversation, Message } from '../../types';
import { AudioRecorder } from '../../components/AudioRecorder';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminChatPage: React.FC = () => {
  const { socket } = useSocket();
  const { isHindi } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        if (res.data.data.length > 0 && !selectedConv) {
          setSelectedConv(res.data.data[0]);
          loadMessages(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
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

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    loadMessages(conv._id);
  };

  useEffect(() => {
    if (!socket || !selectedConv) return;

    socket.emit('join_conversation', selectedConv._id);

    socket.on('new_message', (msg: Message) => {
      if (msg.conversationId === selectedConv._id) {
        setMessages((prev) => [...prev, msg]);
      }
      loadConversations();
    });

    socket.on('user_typing', ({ isTyping }: any) => {
      setPartnerTyping(isTyping);
    });

    return () => {
      socket.emit('leave_conversation', selectedConv._id);
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [socket, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
    if (!socket || !selectedConv) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', {
        conversationId: selectedConv._id,
        senderName: 'Admin'
      });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId: selectedConv._id });
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
    if ((!textInput.trim() && !selectedFile) || !selectedConv) return;

    const content = textInput.trim();
    setTextInput('');

    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      handleClearFile();

      await api.post(`/chat/conversations/${selectedConv._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendAudioBlob = async (audioBlob: Blob, durationSec: number) => {
    if (!selectedConv) return;
    setIsRecordingAudio(false);

    try {
      const formData = new FormData();
      formData.append('media', audioBlob, `voice-note-${Date.now()}.webm`);
      formData.append('type', 'AUDIO');
      formData.append('mediaDurationSec', String(durationSec));

      await api.post(`/chat/conversations/${selectedConv._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err: any) {
      alert('Failed to send audio message.');
    }
  };

  if (loading) return <ChickLoader text="Loading chat inbox..." />;

  const filteredConvs = conversations.filter(
    (c) =>
      c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      c.farmerIdString.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Left List of Farmers */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search farmer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConvs.map((conv) => (
            <div
              key={conv._id}
              onClick={() => handleSelectConv(conv)}
              className={`p-3 cursor-pointer transition-all ${
                selectedConv?._id === conv._id
                  ? 'bg-brand-50 dark:bg-brand-950/50 border-l-4 border-brand-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {conv.farmerName}
                </p>
                <span className="text-[10px] font-mono text-slate-400">{conv.farmerIdString}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                {conv.lastMessage || 'No messages yet'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedConv.farmerName}
                </h3>
                <span className="text-[10px] text-brand-600 font-mono">
                  {selectedConv.farmerIdString}
                </span>
              </div>
              {partnerTyping && (
                <span className="text-xs text-brand-600 italic">Farmer is typing...</span>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/60 text-xs">
              {messages.map((msg) => {
                const isMe = msg.senderRole === 'ADMIN';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 shadow-sm space-y-1.5 ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {msg.type === 'IMAGE' && msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="w-full max-h-60 object-cover rounded-xl border border-black/10"
                        />
                      )}
                      {msg.type === 'VIDEO' && msg.mediaUrl && (
                        <video src={msg.mediaUrl} controls className="w-full max-h-60 rounded-xl" />
                      )}
                      {msg.type === 'AUDIO' && msg.mediaUrl && (
                        <AudioPlayer src={msg.mediaUrl} durationSec={msg.mediaDurationSec} />
                      )}
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
                    className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={textInput}
                    onChange={handleInputChange}
                    placeholder="Type message to farmer..."
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />

                  {textInput.trim() || selectedFile ? (
                    <button
                      type="submit"
                      className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRecordingAudio(true)}
                      className="p-2.5 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-xl"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a farmer conversation from the left to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};
