import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  label: string;
  onChange: (base64: string | null) => void;
  currentImage: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onChange, currentImage }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-purple-200 font-serif text-sm uppercase tracking-widest">{label}</span>
      <div className="relative group cursor-pointer border-2 border-dashed border-purple-500/50 hover:border-mystic-accent rounded-xl transition-all duration-300 h-32 flex items-center justify-center bg-void-purple/50 overflow-hidden">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {currentImage ? (
          <img src={currentImage} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="text-center p-4">
            <svg className="w-8 h-8 mx-auto text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-purple-300">点击上传</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;