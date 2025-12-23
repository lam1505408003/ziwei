
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
    <div className="flex flex-col gap-3">
      {label && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>}
      <div className="relative group cursor-pointer border-2 border-dashed border-white/60 bg-white/10 hover:bg-white/30 hover:border-indigo-300 transition-all h-32 flex items-center justify-center overflow-hidden rounded-3xl backdrop-blur-md">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {currentImage ? (
          <img src={currentImage} alt="面相预览" className="w-full h-full object-cover transition-all group-hover:scale-105" />
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/40 flex items-center justify-center mb-2 border border-white group-hover:scale-110 transition-transform shadow-inner">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase">上传生物面相数据</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
