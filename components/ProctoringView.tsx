
import React, { useState, useEffect, useRef, memo } from 'react';
import { ScreenIcon } from './icons';

interface ProctoringViewProps {
  onReady: () => void;
  onError: (error: string) => void;
  enableFaceDetection?: boolean;
  onFaceOutOfFrame?: () => void;
}

const ProctoringView: React.FC<ProctoringViewProps> = ({ onReady, onError, enableFaceDetection, onFaceOutOfFrame }) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    let faceDetectionTimer: NodeJS.Timeout | null = null;
    
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userStreamRef.current = stream;
        if (isMounted) {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          onReady();
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error accessing media devices.", err);
          onError("Camera and Mic access was denied. Please allow access in your browser settings (look for an icon in the address bar).");
        }
      }
    };
    setupMedia();
    
    if (enableFaceDetection && onFaceOutOfFrame) {
      const scheduleNextCheck = () => {
        // In a real scenario, this would be replaced by an ML model.
        // Here, we simulate a check every 15-25 seconds.
        const randomInterval = Math.random() * 10000 + 15000;
        faceDetectionTimer = setTimeout(() => {
          if (isMounted) {
            onFaceOutOfFrame();
            scheduleNextCheck(); // Reschedule for the next check
          }
        }, randomInterval);
      };
      // Start the first check after an initial delay
      setTimeout(scheduleNextCheck, 10000);
    }

    return () => {
      isMounted = false;
      userStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      if (faceDetectionTimer) {
        clearTimeout(faceDetectionTimer);
      }
    };
  }, [onReady, onError, enableFaceDetection, onFaceOutOfFrame]);

  const handleScreenShare = async () => {
    setScreenShareError(null);
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
             setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error starting screen share.", err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
             setScreenShareError("Screen sharing permission was denied.");
        } else {
             setScreenShareError("Could not start screen share.");
        }
        setIsScreenSharing(false);
        setTimeout(() => setScreenShareError(null), 5000);
      }
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-800 dark:text-white p-3 rounded-lg shadow-2xl w-64 z-50 border border-slate-200 dark:border-slate-700">
      <video ref={videoRef} autoPlay muted className="w-full rounded-md aspect-video bg-slate-200 dark:bg-slate-900 mb-2"></video>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold">Recording</span>
        </div>
        <button onClick={handleScreenShare} className={`p-2 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-500' : 'bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500'}`} title="Toggle Screen Sharing">
            <ScreenIcon className="w-5 h-5 text-white" />
        </button>
      </div>
       {screenShareError && <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center transition-opacity duration-300">{screenShareError}</p>}
    </div>
  );
};

export default memo(ProctoringView);
