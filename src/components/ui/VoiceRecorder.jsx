import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function VoiceRecorder({ onVoiceRecorded, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [visualBars, setVisualBars] = useState([15, 15, 15, 15, 15, 15, 15, 15]);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const shouldDiscardRef = useRef(false);
    const recordingTimeRef = useRef(0);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    const cleanupAudioContext = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
            }
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setVisualBars([15, 15, 15, 15, 15, 15, 15, 15]);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            cleanupAudioContext();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const tick = () => {
        if (!analyserRef.current || !mediaRecorderRef.current) return;

        if (mediaRecorderRef.current.state === 'recording') {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Map frequencies to 8 bars (focus on speech range frequencies)
            const newBars = [];
            for (let i = 0; i < 8; i++) {
                // Read from frequency bins (1 to 8) to skip DC offset in bin 0
                const val = dataArray[i + 1] || 0;
                const norm = val / 255;
                // Use non-linear square root scaling to boost lower volumes perceptually
                const responsivenessBoost = Math.sqrt(norm);
                // Apply a classic waveform shape (symmetric curvature)
                const shapeFactor = i === 0 || i === 7 ? 0.6 : (i === 1 || i === 6 ? 0.8 : 1.0);
                
                const percent = 15 + (responsivenessBoost * shapeFactor * 85);
                newBars.push(Math.max(15, Math.min(100, percent)));
            }
            setVisualBars(newBars);
        } else {
            setVisualBars([15, 15, 15, 15, 15, 15, 15, 15]);
        }

        animationRef.current = requestAnimationFrame(tick);
    };

    const startRecording = async () => {
        if (disabled || isUploading) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            shouldDiscardRef.current = false;

            // AudioContext & Analyser Node setup
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32; // 16 frequency bins
            source.connect(analyser);
            analyserRef.current = analyser;

            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                cleanupAudioContext();
                
                // Cleanup stream tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }

                if (shouldDiscardRef.current) {
                    shouldDiscardRef.current = false;
                    audioChunksRef.current = [];
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // We capture the recording duration immediately
                const finalDuration = recordingTimeRef.current;
                await uploadVoiceNote(audioBlob, finalDuration);
            };

            mediaRecorder.start(200); // deliver data chunks every 200ms
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            
            // Animation loop for volume indicator
            animationRef.current = requestAnimationFrame(tick);
            
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        const next = prev + 1;
                        recordingTimeRef.current = next;
                        return next;
                    }
                    return prev;
                });
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Microphone access denied or not available.');
        }
    };

    const stopAndSendRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            shouldDiscardRef.current = false;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    };

    const cancelRecording = () => {
        cleanupAudioContext();
        if (mediaRecorderRef.current) {
            shouldDiscardRef.current = true;
            mediaRecorderRef.current.stop();
        } else if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        toast.info("Recording discarded");
    };

    const uploadVoiceNote = async (audioBlob, duration) => {
        setIsUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileName = `${user.id}/${Date.now()}.webm`;
            
            const { error: uploadError } = await supabase.storage
                .from('chat_media')
                .upload(fileName, audioBlob, {
                    contentType: 'audio/webm',
                    cacheControl: '36000'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat_media')
                .getPublicUrl(fileName);

            // Pass the public URL and the duration of the audio
            onVoiceRecorded(publicUrl, duration);
        } catch (error) {
            console.error('Failed to upload voice note:', error);
            toast.error('Failed to send voice note.');
        } finally {
            setIsUploading(false);
            setRecordingTime(0);
            recordingTimeRef.current = 0;
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isRecording) {
        return (
            <div className="absolute inset-0 z-20 flex items-center bg-white px-1 sm:px-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between w-full h-11 bg-red-50/95 backdrop-blur-sm rounded-full px-3 sm:px-4 border border-red-100/80 shadow-inner">
                    {/* Discard/Trash Button */}
                    <button
                        onClick={cancelRecording}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-red-100 text-red-500 hover:text-red-600 transition-all hover:scale-105 active:scale-95 shadow-sm border border-red-100"
                        title="Discard recording"
                    >
                        <span className="material-icons text-[18px]">delete_outline</span>
                    </button>

                    {/* Animated Waveform Visualizer & Timer */}
                    <div className="flex-1 flex items-center justify-center gap-3 px-2 sm:px-4 min-w-0">
                        <div className="flex items-center gap-1 shrink-0">
                            <span className={`w-2 h-2 rounded-full bg-red-500 ${!isPaused ? 'animate-pulse' : 'opacity-60'}`} />
                            <span className="text-[10px] sm:text-xs font-black text-red-600 tracking-wider uppercase font-mono hidden xs:inline">
                                {isPaused ? 'PAUSED' : 'REC'}
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-[3px] h-6 w-16 sm:w-20">
                            {visualBars.map((h, idx) => (
                                <span
                                    key={idx}
                                    className="w-[3px] bg-red-500 rounded-full"
                                    style={{
                                        height: `${h}%`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <span className="text-xs sm:text-sm font-black text-red-600 font-mono tracking-tight shrink-0 bg-red-100/50 px-2 py-0.5 rounded-md">
                            {formatTime(recordingTime)}
                        </span>
                    </div>

                    {/* Controls (Pause/Resume & Send) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Pause/Resume Toggle */}
                        <button
                            onClick={isPaused ? resumeRecording : pauseRecording}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-all active:scale-95 shadow-sm border border-gray-100"
                            title={isPaused ? 'Resume recording' : 'Pause recording'}
                        >
                            <span className="material-icons text-[18px]">
                                {isPaused ? 'mic' : 'pause'}
                            </span>
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={stopAndSendRecording}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#10B981] hover:bg-[#059669] text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                            title="Send voice note"
                        >
                            <span className="material-icons text-[18px] translate-x-[0px]">send</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isUploading) {
        return (
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200 shrink-0 shadow-sm animate-pulse">
                <span className="material-icons text-[#10B981] text-[18px] animate-spin">sync</span>
            </div>
        );
    }

    return (
        <button
            onClick={startRecording}
            disabled={disabled}
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#10B981] disabled:opacity-50 shrink-0"
            title="Record voice note"
        >
            <span className="material-icons text-[20px]">mic</span>
        </button>
    );
}
