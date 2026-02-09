import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string; // e.g. Team Name to generate initials
}

export const TeamLogo: React.FC<Props> = ({ src, alt, className, fallbackText, ...props }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  // Generate a generic shield if error occurs or no src provided
  if (error || !src) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-inner`}
        title={alt || fallbackText}
      >
        <Shield className="w-1/2 h-1/2 text-gray-600 absolute opacity-20" />
        <span className="text-[10px] md:text-xs font-bold text-gray-400 z-10 uppercase tracking-tighter">
            {fallbackText ? fallbackText.substring(0, 3) : 'FC'}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
      loading="lazy"
      {...props} 
    />
  );
};