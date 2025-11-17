import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateQuestionsFromResume, evaluateAnswer, summarizeInterviewPerformance } from '../services/geminiService';
import ProctoringView from './ProctoringView';
import { Spinner, RecordIcon, ThumbsUpIcon, LightbulbIcon } from './icons';

type ProctoringStatus = 'pending' | 'ready' | 'error';
type InterviewState = 'upload' | 'generating' | 'inProgress' | 'evaluating' | 'summarizing' | 'results';
type RecordingState = 'idle' | 'recording' | 'processing';

interface InterviewResult {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

interface PerformanceSummary {
    strengths: string;
    areasForImprovement: string;
}

// Check for SpeechRecognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

const fileToDataUrl = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        if (base64) {
            resolve({ base64, mimeType });
        } else {
            reject(new Error("Could not read file as base64."));
        }
    };
    reader.onerror = error => reject(error);
  });
};

const ResumeInterviewPage: React.FC<{ onEndSession: () => void }> = ({ onEndSession }) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewState, setInterviewState] = useState<InterviewState>('upload');
  const [error, setError] = useState<string | null>(null);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus>('pending');
  const [proctoringError, setProctoringError] = useState<string>('');
  
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [currentResult, setCurrentResult] = useState<InterviewResult | null>(null);
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const latestTranscript = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const visualizerFrameRef = useRef<number>(0);
  const visualizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    latestTranscript.current = transcribedText;
  }, [transcribedText]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
          setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
          setResumeFile(null);
          return;
      }
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setError('File is too large. Please upload a file smaller than 4MB.');
          setResumeFile(null);
          return;
      }
      setError(null);
      setResumeFile(file);
    }
  };

  const handleStartInterview = useCallback(async () => {
    if (!resumeFile) {
      setError("Please upload a resume to start.");
      return;
    }
    setInterviewState('generating');
    setError(null);
    setQuestions([]);
    
    try {
        const fileData = await fileToDataUrl(resumeFile);
        const generatedQuestions = await generateQuestionsFromResume(fileData);
        if (generatedQuestions && generatedQuestions.length > 0 && !generatedQuestions[0].toLowerCase().includes('could not')) {
          setQuestions(generatedQuestions);
          setCurrentQuestionIndex(0);
          setInterviewState('inProgress');
        } else {
          setError(generatedQuestions[0] || "The AI could not generate questions from this resume. Please try another file.");
          setInterviewState('upload');
        }
    } catch (err) {
        setError("An unexpected error occurred while processing the file.");
        console.error(err);
        setInterviewState('upload');
    }
  }, [resumeFile]);

  const startVisualizer = async () => {
      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          sourceRef.current.connect(analyserRef.current);

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          const draw = () => {
              if (!analyserRef.current || !visualizerRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              const scale = Math.min(1 + (average / 128) * 1.5, 2.5);
              visualizerRef.current.style.transform = `scale(${scale})`;
              visualizerFrameRef.current = requestAnimationFrame(draw);
          };
          draw();
      } catch (err) {
          console.error("Could not start audio visualizer:", err);
      }
  };
  
  const stopVisualizer = () => {
      cancelAnimationFrame(visualizerFrameRef.current);
      if (visualizerRef.current) {
        visualizerRef.current.style.transform = 'scale(1)';
      }
      sourceRef.current?.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current?.disconnect();
  };

  const handleToggleRecording = () => {
    if (!recognition) {
        alert("Speech-to-text is not supported by your browser. Please try Chrome or Edge.");
        return;
    }
    if (recordingState === 'recording') {
        setRecordingState('processing');
        recognition.stop();
        stopVisualizer();
    } else {
        setError(null);
        setTranscribedText('');
        setCurrentResult(null);
        setRecordingState('recording');
        recognition.start();
        startVisualizer();
    }
  };
  
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Use the latest final transcript available
      const finalPart = latestTranscript.current.substring(0, latestTranscript.current.lastIndexOf(interimTranscript.trim().split(' ')[0]))
      setTranscribedText(finalTranscript || interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
        let userMessage = `An error occurred with the microphone: ${event.error}.`;
        if (event.error === 'no-speech') {
            userMessage = 'No speech was detected. Please ensure your microphone is working and speak clearly.';
        } else if (event.error === 'not-allowed') {
            userMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
        }
        setError(userMessage);
        console.error('Speech recognition error', event);
        setRecordingState('idle');
        stopVisualizer();
    };
    
    const evaluate = async (answer: string) => {
        setInterviewState('evaluating');
        const result = await evaluateAnswer(questions[currentQuestionIndex], answer);
        const newResult = {
            question: questions[currentQuestionIndex],
            answer: answer,
            ...result
        };
        setCurrentResult(newResult);
        setInterviewResults(prev => [...prev, newResult]);
        setTranscribedText('');
        latestTranscript.current = '';
        setRecordingState('idle');
        setInterviewState('inProgress');
    };

    recognition.onend = () => {
        if (recordingState === 'processing') {
            const answerToSubmit = latestTranscript.current.trim();
            if (answerToSubmit) {
                evaluate(answerToSubmit);
            } else {
                setError("No answer was recorded. Please try again.");
                setRecordingState('idle');
            }
        } else {
             setRecordingState('idle');
        }
        stopVisualizer();
    };

    return () => {
        if (recognition) {
            recognition.onend = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.stop();
        }
        stopVisualizer();
    };
  }, [recordingState, questions, currentQuestionIndex]);

  const handleNextQuestion = async () => {
    setCurrentResult(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setInterviewState('summarizing');
      const summary = await summarizeInterviewPerformance(interviewResults);
      setPerformanceSummary(summary);
      setInterviewState('results');
    }
  };

  const renderUploadView = () => (
      <div className="text-center flex flex-col items-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">Resume Based Interview</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">Upload your resume. Our AI will generate personalized interview questions.</p>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-8 rounded-lg border border-slate-200 dark:border-slate-700 w-full max-w-md">
            <label htmlFor="resume-upload" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Upload your resume (PDF, DOCX, TXT)</label>
            <input 
                id="resume-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
            {error && <p className="text-red-500 mt-4 text-sm text-left">{error}</p>}
            {resumeFile && !error && <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm text-left">Selected: {resumeFile.name}</p>}
            
            <button 
                onClick={handleStartInterview} 
                disabled={!resumeFile || !!error}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
                Start Interview
            </button>
        </div>
      </div>
  );

  const renderInProgressView = () => (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in-up">
        <p className="text-slate-500 dark:text-slate-400 mb-2 font-medium">Question {currentQuestionIndex + 1} of {questions.length}</p>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 leading-snug text-center">{questions[currentQuestionIndex]}</h2>
        
        <div className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
                 <div className="relative">
                    <div ref={visualizerRef} className="absolute inset-[-10px] bg-indigo-500/30 rounded-full transition-transform duration-100 ease-out" style={{ transform: 'scale(1)' }}></div>
                    <button 
                        onClick={handleToggleRecording}
                        disabled={!!currentResult}
                        className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed ${recordingState === 'recording' ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <RecordIcon className="w-10 h-10 text-white" />
                    </button>
                </div>

                <p className="text-slate-600 dark:text-slate-300 font-medium h-6">
                    {currentResult && "Review your feedback below."}
                    {recordingState === 'idle' && !currentResult && 'Click to record your answer'}
                    {recordingState === 'recording' && 'Recording... Click to Stop & Evaluate'}
                </p>
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
            <textarea
                value={transcribedText}
                readOnly
                placeholder="Your transcribed answer will appear here..."
                className="w-full h-32 p-3 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700"
            />
        </div>
        
        {currentResult ? (
            <div className="w-full p-6 bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 dark:border-green-400/20 rounded-lg animate-fade-in-up">
                <h3 className="font-bold text-lg text-green-800 dark:text-green-300">AI Feedback (Score: {currentResult.score}/5)</h3>
                <p className="text-green-700 dark:text-green-300 mt-2">{currentResult.feedback}</p>
                <button onClick={handleNextQuestion} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                </button>
            </div>
        ) : (
           <div className="h-24"></div> // Placeholder to prevent layout jump
        )}
    </div>
  );
  
  const AccordionItem: React.FC<{ result: InterviewResult, index: number, open: boolean, onToggle: () => void }> = ({ result, index, open, onToggle }) => (
    <div className="bg-white/60 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2>
            <button
                type="button"
                className="flex items-center justify-between w-full p-5 font-medium text-left text-slate-800 dark:text-white"
                onClick={onToggle}
                aria-expanded={open}
            >
                <span className="flex items-center">
                    <span className="font-bold mr-3">Q{index + 1}:</span>
                    <span className="truncate pr-4">{result.question}</span>
                </span>
                <div className="flex items-center">
                     <span className={`mr-4 font-bold ${result.score >= 4 ? 'text-green-500' : result.score === 3 ? 'text-yellow-500' : 'text-red-500'}`}>{result.score}/5</span>
                    <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
                    </svg>
                </div>
            </button>
        </h2>
        <div className={`${open ? '' : 'hidden'}`}>
            <div className="p-5 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 italic p-3 bg-slate-100 dark:bg-slate-900 rounded-md mb-3">Your answer: "{result.answer}"</p>
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-md">
                    <p className="font-semibold text-indigo-800 dark:text-indigo-300">Feedback:</p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">{result.feedback}</p>
                </div>
            </div>
        </div>
    </div>
  );

  const renderResultsView = () => {
    const totalScore = interviewResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = interviewResults.length * 5;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const [openAccordion, setOpenAccordion] = useState<number | null>(null);

    const DonutChart = ({ percentage }: { percentage: number }) => {
        const strokeWidth = 12;
        const radius = 80;
        const normalizedRadius = radius - strokeWidth * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative inline-flex items-center justify-center">
                <svg height={radius * 2} width={radius * 2}>
                    <circle stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={strokeWidth} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
                    <circle
                        stroke="currentColor"
                        className={`transition-all duration-1000 ease-out ${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500'}`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, strokeLinecap: 'round' }}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        transform={`rotate(-90 ${radius} ${radius})`}
                    />
                </svg>
                <span className="absolute text-4xl font-extrabold">{percentage}%</span>
            </div>
        );
    };
    
    return (
        <div className="w-full max-w-5xl p-4 animate-fade-in-up">
             <h1 className="text-4xl font-bold text-center mb-8">Interview Performance</h1>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                 <div className="lg:col-span-1 bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold mb-4">Overall Score</h2>
                    <DonutChart percentage={percentage} />
                    <p className="text-2xl font-bold mt-4">{totalScore} / {maxScore}</p>
                 </div>
                 <div className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">AI Summary</h2>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <ThumbsUpIcon className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Strengths</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{performanceSummary?.strengths}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                             <LightbulbIcon className="w-6 h-6 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Areas for Improvement</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{performanceSummary?.areasForImprovement}</p>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
             
             <div className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8">
                <h2 className="text-xl font-bold mb-4">Score Breakdown</h2>
                <div className="flex justify-between items-end space-x-2 h-40">
                    {interviewResults.map((result, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                            <div className={`w-full rounded-t-md transition-all duration-300 ${result.score >= 4 ? 'bg-green-500' : result.score === 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ height: `${result.score * 20}%` }}></div>
                            <span className="text-xs mt-2 font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white">Q{index + 1}</span>
                        </div>
                    ))}
                </div>
             </div>

             <div>
                <h2 className="text-2xl font-bold text-center mb-6">Detailed Feedback</h2>
                 <div className="space-y-2">
                    {interviewResults.map((result, index) => (
                        <AccordionItem 
                            key={index} 
                            result={result} 
                            index={index} 
                            open={openAccordion === index}
                            onToggle={() => setOpenAccordion(openAccordion === index ? null : index)}
                        />
                    ))}
                </div>
             </div>

            <div className="text-center mt-12">
                <button onClick={onEndSession} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
  };
  
  const renderInterviewContent = () => {
    switch(interviewState) {
        case 'generating':
        case 'evaluating':
        case 'summarizing':
             return (
                <div className="text-center flex flex-col items-center">
                    <Spinner />
                    <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">
                      {interviewState === 'generating' ? 'Analyzing your resume...' : interviewState === 'evaluating' ? 'Evaluating your answer...' : 'Generating performance summary...'}
                    </p>
                </div>
            );
        case 'inProgress': return renderInProgressView();
        case 'results': return renderResultsView();
        case 'upload':
        default: return renderUploadView();
    }
  };

  if (proctoringStatus === 'pending') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <Spinner />
        <p className="mt-4 text-xl text-slate-600 dark:text-slate-300">Waiting for camera & microphone permissions...</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Please check your browser for a permission prompt.</p>
        <div className="opacity-0 invisible absolute">
          <ProctoringView
            onReady={() => setProctoringStatus('ready')}
            onError={(err) => { setProctoringStatus('error'); setProctoringError(err); }}
          />
        </div>
      </div>
    );
  }

  if (proctoringStatus === 'error') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Permission Error</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mb-6">{proctoringError}</p>
        <button onClick={onEndSession} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {renderInterviewContent()}
      <ProctoringView 
        onReady={() => {}} 
        onError={(err) => { setProctoringStatus('error'); setProctoringError(err); }} 
      />
    </div>
  );
};

export default ResumeInterviewPage;