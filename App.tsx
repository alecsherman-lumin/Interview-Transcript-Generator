import React, { useState, useCallback, useRef } from 'react';
import { TranscriptTurn } from './types';
import processAudioTranscript from './services/geminiService';
import Spinner from './components/Spinner';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};


const Header: React.FC = () => (
  <header className="w-full p-4 bg-gray-900 border-b border-gray-700 flex items-center space-x-3">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m-6 0h12" />
    </svg>
    <h1 className="text-2xl font-bold text-gray-100">Audio Transcript Processor</h1>
  </header>
);

const AudioInput: React.FC<{
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
  onProcess: () => void;
  isLoading: boolean;
}> = ({ audioFile, setAudioFile, onProcess, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      if (files[0].type === 'audio/mpeg') {
        setAudioFile(files[0]);
      } else {
        alert('Please select an MP3 file.');
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleClearFile = () => {
    setAudioFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-300">Audio File Input</h2>
      
      <div 
        className={`flex flex-col items-center justify-center w-full h-full flex-grow p-4 border-2 border-dashed rounded-lg transition-colors duration-200 min-h-[300px] md:min-h-0 ${isDragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="audio/mpeg"
            onChange={(e) => handleFileChange(e.target.files)}
        />

        {audioFile ? (
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
                </svg>
                <p className="mt-2 text-gray-300">{audioFile.name}</p>
                <p className="text-sm text-gray-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                    className="mt-4 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    Clear
                </button>
            </div>
        ) : (
            <div className="text-center text-gray-500 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2">Click to upload or drag and drop</p>
                <p className="text-sm">MP3 file (Max 15 mins recommended)</p>
            </div>
        )}
      </div>

      <div className="flex w-full md:w-auto self-end">
        <button
          onClick={onProcess}
          disabled={isLoading || !audioFile}
          className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <span>Process Transcript</span>
          )}
        </button>
      </div>
    </div>
  );
};


const TranscriptOutput: React.FC<{
  processedTranscript: TranscriptTurn[] | null;
  isLoading: boolean;
  error: string | null;
}> = ({ processedTranscript, isLoading, error }) => (
  <div className="flex flex-col flex-1 p-4 md:p-6">
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-300">Processed Output</h2>
        {processedTranscript && !isLoading && (
            <button
                onClick={() => {
                    const text = processedTranscript.map(turn => `${turn.speaker}:\n${turn.lines.join('\n')}`).join('\n\n');
                    navigator.clipboard.writeText(text);
                }}
                className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25H9a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                <span>Copy</span>
            </button>
        )}
    </div>
    <div className="w-full h-full flex-grow p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-y-auto min-h-[300px] md:min-h-0">
      {isLoading && <Spinner />}
      {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
      {!isLoading && !error && processedTranscript && (
        <div className="space-y-6">
          {processedTranscript.map((turn, index) => (
            <div key={index} className="flex flex-col">
              <span className="font-bold text-indigo-400 mb-1">{turn.speaker}</span>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{turn.lines.join('\n').replace(/^\s+/,'')}</p>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && !processedTranscript && (
        <div className="flex items-center justify-center h-full text-gray-500">
          Upload an MP3 file and click "Process" to see the transcript here.
        </div>
      )}
    </div>
  </div>
);


const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processedTranscript, setProcessedTranscript] = useState<TranscriptTurn[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessTranscript = useCallback(async () => {
    if (!audioFile) return;

    setIsLoading(true);
    setError(null);
    setProcessedTranscript(null);

    try {
      const base64Data = await fileToBase64(audioFile);
      const audioData = {
        mimeType: audioFile.type,
        data: base64Data,
      };
      const result = await processAudioTranscript(audioData);
      setProcessedTranscript(result);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [audioFile]);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-700">
        <AudioInput
          audioFile={audioFile}
          setAudioFile={setAudioFile}
          onProcess={handleProcessTranscript}
          isLoading={isLoading}
        />
        <TranscriptOutput
          processedTranscript={processedTranscript}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
};

export default App;
