import React, { useRef } from 'react';

interface Props {
  onUpload: (files: FileList) => void;
}

export const CalendarUploader: React.FC<Props> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer bg-white dark:bg-slate-800 shadow-sm"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept=".ics" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Outlook .ics files supported</p>
      </div>
    </div>
  );
};