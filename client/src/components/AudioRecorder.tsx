import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, durationSec: number) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSendAudio,
  onCancel
}) => {
  const { t, isHindi } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert(
        isHindi
          ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है या समर्थित नहीं है।'
          : 'Microphone permission denied or not supported in this browser.'
      );
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current) return;
    const duration = recordingTime;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSendAudio(audioBlob, duration);
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = () => {
    stopRecordingCleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between w-full p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
        <span className="text-xs font-mono font-bold text-red-700 dark:text-red-300">
          {formatTime(recordingTime)}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {isHindi ? 'रिकॉर्डिंग...' : 'Recording voice note...'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          title="Cancel"
          className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleSend}
          title="Send Voice Note"
          className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isHindi ? 'भेजें' : 'Send'}</span>
        </button>
      </div>
    </div>
  );
};
