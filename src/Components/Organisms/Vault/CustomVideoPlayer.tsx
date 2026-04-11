"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlayArrow, Pause, VolumeUp, VolumeOff, Fullscreen } from "@mui/icons-material";

interface Props {
    src: string;
    title?: string;
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function CustomVideoPlayer({ src, title = "Video preview" }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, [src]);

    const progress = useMemo(() => {
        if (!duration) return 0;
        return Math.min(100, (currentTime / duration) * 100);
    }, [currentTime, duration]);

    async function togglePlay() {
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) {
            await el.play();
        } else {
            el.pause();
        }
    }

    function onSeek(percent: number) {
        const el = videoRef.current;
        if (!el || !duration) return;
        el.currentTime = (Math.max(0, Math.min(100, percent)) / 100) * duration;
    }

    function toggleMute() {
        const el = videoRef.current;
        if (!el) return;
        el.muted = !el.muted;
        setIsMuted(el.muted);
    }

    function setPlayerVolume(next: number) {
        const el = videoRef.current;
        if (!el) return;
        const v = Math.max(0, Math.min(1, next));
        el.volume = v;
        el.muted = v === 0;
        setVolume(v);
        setIsMuted(el.muted);
    }

    async function toggleFullscreen() {
        if (!wrapperRef.current) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }
        await wrapperRef.current.requestFullscreen();
    }

    return (
        <div ref={wrapperRef} className="w-full rounded-xl overflow-hidden bg-black border border-white/10">
            <video
                ref={videoRef}
                src={src}
                className="w-full max-h-[70vh] bg-black"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLVideoElement).currentTime)}
                onLoadedMetadata={(e) => {
                    const el = e.currentTarget as HTMLVideoElement;
                    setDuration(el.duration || 0);
                }}
            />
            <div className="p-3 space-y-2 bg-black/80 text-white">
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
                    <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
                <input
                    aria-label="Seek video"
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={progress}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="w-full"
                />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-white/10"
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        title={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </button>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-white/10"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                        title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                    </button>
                    <input
                        aria-label="Volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setPlayerVolume(Number(e.target.value))}
                    />
                    <span className="text-xs text-white/80 ml-auto">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-white/10"
                        onClick={toggleFullscreen}
                        aria-label="Fullscreen"
                        title="Fullscreen">
                        <Fullscreen fontSize="small" />
                    </button>
                </div>
                <p className="text-xs text-white/60 truncate">{title}</p>
            </div>
        </div>
    );
}
