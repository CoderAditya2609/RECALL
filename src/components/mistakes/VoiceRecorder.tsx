import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { VoiceMemo } from '../../types';

interface VoiceRecorderProps {
  voiceMemo?: VoiceMemo;
  onChange: (memo?: VoiceMemo) => void;
  readOnly?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ voiceMemo, onChange, readOnly = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newMemo: VoiceMemo = {
            id: `voice-${Date.now()}`,
            audioUrl: base64Audio,
            durationSeconds: recordDuration,
            createdAt: new Date().toISOString(),
          };
          onChange(newMemo);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Unable to access microphone. Please ensure microphone permissions are granted in browser.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!voiceMemo?.audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(voiceMemo.audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDelete = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    onChange(undefined);
  };

  const handleGenerateVoiceInsight = async () => {
    if (!voiceMemo) return;
    setIsSummarizing(true);
    // Simulate / fetch brief
    setTimeout(() => {
      onChange({
        ...voiceMemo,
        transcript: 'Student verbal reflection: Analyzed why boundary condition l <= n - 1 was overlooked during timed test.',
        summary: 'Identified speed anxiety during multi-concept options. Solution: slow down 3 seconds on boundary checks.',
      });
      setIsSummarizing(false);
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-zinc-800">
          <Volume2 className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
          <span>Voice Academic Memo</span>
        </div>
        {voiceMemo && (
          <span className="text-[10px] font-mono font-bold text-zinc-500">
            {formatTime(voiceMemo.durationSeconds)}
          </span>
        )}
      </div>

      {!voiceMemo ? (
        !readOnly && (
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-zinc-300">
            {isRecording ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-mono font-bold text-rose-700">
                    RECORDING: {formatTime(recordDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-bold border border-zinc-300"
                  >
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>DONE</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <p className="text-[11px] text-zinc-500 font-medium font-sans">
                  Verbally explain what went wrong and your mental takeaway.
                </p>
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold transition-colors shadow-2xs"
                >
                  <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>RECORD VOICE</span>
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-zinc-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-7 h-7 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors shadow-xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
              </button>
              <div className="flex items-center gap-1">
                {[40, 70, 90, 60, 30, 80, 50, 90, 100, 65, 40, 75, 55, 85].map((h, idx) => (
                  <span
                    key={idx}
                    className={`w-0.5 rounded-full transition-all duration-150 ${
                      isPlaying ? 'bg-zinc-950 animate-pulse' : 'bg-zinc-300'
                    }`}
                    style={{ height: `${(h / 100) * 16}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-500 ml-1">
                Voice Memo ({formatTime(voiceMemo.durationSeconds)})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {!voiceMemo.transcript && (
                <button
                  type="button"
                  disabled={isSummarizing}
                  onClick={handleGenerateVoiceInsight}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 border border-zinc-300 text-zinc-800 text-[10px] font-mono font-bold hover:bg-zinc-200"
                  title="Summarize key takeaway from audio"
                >
                  {isSummarizing ? (
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-950" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-zinc-950 stroke-[2.5]" />
                  )}
                  <span>SUMMARIZE</span>
                </button>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Delete recording"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {voiceMemo.summary && (
            <div className="p-2.5 rounded-lg bg-zinc-100 border border-zinc-300 text-xs text-zinc-800 font-medium">
              <span className="font-mono text-zinc-950 font-black uppercase text-[10px] block mb-0.5">
                AI Voice Takeaway:
              </span>
              {voiceMemo.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
