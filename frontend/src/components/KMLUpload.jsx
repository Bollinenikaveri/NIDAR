import React, { useState, useRef } from 'react';
import { Upload, File, Check, X } from 'lucide-react';
import { Button } from './ui/button';

const KMLUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.name.toLowerCase().endsWith('.kml')) {
      setUploadStatus('uploading');
      setUploadedFile(file);
      
      // Simulate upload process
      setTimeout(() => {
        setUploadStatus('success');
      }, 1500);
    } else {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold mb-3 text-blue-400">KML Mission Area</h3>
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-3 text-center cursor-pointer
          transition-all duration-300 h-[calc(100%-2rem)]
          ${dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : uploadStatus === 'success' 
              ? 'border-green-500 bg-green-500/10'
              : uploadStatus === 'error'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center h-full">
          {uploadStatus === 'uploading' ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
              <span className="text-xs text-blue-400">Uploading...</span>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <Check className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-xs text-green-400">Upload Complete</span>
              <div className="mt-2 flex items-center">
                <File className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-300 truncate max-w-[120px]">
                  {uploadedFile?.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="ml-1 text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <X className="w-6 h-6 text-red-500 mb-2" />
              <span className="text-xs text-red-400">Invalid file type</span>
              <span className="text-xs text-gray-500">Please upload .kml files only</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs text-gray-300">Drop KML file here</span>
              <span className="text-xs text-gray-500">or click to browse</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KMLUpload;