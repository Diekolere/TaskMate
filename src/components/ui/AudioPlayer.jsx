import React, { useState, useRef, useEffect } from 'react';

export default function AudioPlayer({ src, durationProp, isMe }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(durationProp || 0);
    const [isLoading, setIsLoading] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Sync durationProp if it changes or initializes
    useEffect(() => {
        if (durationProp) {
            setDuration(durationProp);
        }
    }, [durationProp]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => {
            const current = audio.currentTime;
            // Bound check currentTime against duration to prevent overflow if duration is Infinity
            if (duration > 0 && current > duration) {
                setCurrentTime(duration);
            } else {
                setCurrentTime(current);
            }
        };
        const onLoadedMetadata = () => {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            } else if (durationProp) {
                setDuration(durationProp);
            }
            setIsLoading(false);
        };
        const onCanPlayThrough = () => {
            setIsLoading(false);
        };
        const onWaiting = () => setIsLoading(true);
        const onPlaying = () => setIsLoading(false);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('canplaythrough', onCanPlayThrough);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('ended', onEnded);

        // If source changes, reset state
        setIsLoading(true);
        setCurrentTime(0);
        setIsPlaying(false);

        // Check if metadata is already loaded
        if (audio.readyState >= 1) {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            } else if (durationProp) {
                setDuration(durationProp);
            }
            setIsLoading(false);
        }

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('ended', onEnded);
        };
    }, [src, durationProp, duration]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Pause all other audio elements on the page before playing this one
            document.querySelectorAll('audio').forEach(audioEl => {
                if (audioEl !== audioRef.current) {
                    audioEl.pause();
                }
            });
            audioRef.current.play().catch(err => console.error("Audio playback error:", err));
        }
    };

    const handleSeek = (e) => {
        if (!audioRef.current || duration === 0) return;
        const seekPercent = parseFloat(e.target.value);
        const seekTime = (seekPercent / 100) * duration;
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const toggleSpeed = () => {
        if (!audioRef.current) return;
        let nextRate = 1;
        if (playbackRate === 1) nextRate = 1.5;
        else if (playbackRate === 1.5) nextRate = 2;
        else nextRate = 1;

        audioRef.current.playbackRate = nextRate;
        setPlaybackRate(nextRate);
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Render a simulated visualizer bar array
    const barCount = 22;
    // Use a pseudo-random hash of src to generate consistent height patterns for the voice note
    const getWaveformHeights = () => {
        const heights = [];
        let hash = 0;
        if (src) {
            for (let i = 0; i < src.length; i++) {
                hash = src.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        for (let i = 0; i < barCount; i++) {
            const val = Math.abs(Math.sin(hash + i)) * 100;
            // clamp between 25% and 90% for aesthetically pleasing waveform bounds
            heights.push(Math.max(25, Math.min(90, val)));
        }
        return heights;
    };

    const heights = getWaveformHeights();

    return (
        <div className={`flex items-center gap-3 w-64 p-1 select-none ${isMe ? 'text-white' : 'text-gray-800'}`}>
            <audio ref={audioRef} src={src} preload="metadata" />
            
            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                type="button"
                className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-95 shadow-sm border ${
                    isMe 
                        ? 'bg-white text-[#10B981] border-white/10 hover:bg-white/95' 
                        : 'bg-[#10B981] text-white border-green-600/10 hover:bg-[#059669]'
                }`}
            >
                {isLoading ? (
                    <span className="material-icons animate-spin text-lg">sync</span>
                ) : isPlaying ? (
                    <span className="material-icons text-xl">pause</span>
                ) : (
                    <span className="material-icons text-xl translate-x-[1px]">play_arrow</span>
                )}
            </button>

            {/* Progress & Waveform container */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="relative flex items-end gap-[2px] h-7 mb-1">
                    {/* Waveform Visualization */}
                    {heights.map((h, i) => {
                        const barProgress = (i / barCount) * 100;
                        const isPlayed = progressPercent >= barProgress;
                        return (
                            <div
                                key={i}
                                className="w-[3px] rounded-full transition-colors duration-150"
                                style={{
                                    height: `${h}%`,
                                    backgroundColor: isPlayed
                                        ? (isMe ? '#FFFFFF' : '#10B981')
                                        : (isMe ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)')
                                }}
                            />
                        );
                    })}

                    {/* Invisible range input for seeking overlay */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progressPercent}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ zIndex: 10 }}
                    />
                </div>

                {/* Time display */}
                <div className="flex justify-between items-center text-[10px] opacity-75 font-semibold leading-none px-[2px]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 0)}</span>
                </div>
            </div>

            {/* Speed Selector (WhatsApp style: 1x, 1.5x, 2x) */}
            <button
                onClick={toggleSpeed}
                type="button"
                className={`text-[9px] font-black tracking-tight px-1.5 py-0.5 rounded shrink-0 border uppercase font-mono ${
                    isMe 
                        ? 'border-white/30 hover:bg-white/10 text-white' 
                        : 'border-gray-300 hover:bg-gray-150 text-gray-500 hover:text-gray-700'
                }`}
            >
                {playbackRate}x
            </button>
        </div>
    );
}
