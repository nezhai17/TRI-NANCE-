import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  inverted = false,
}) => {
  const dimensions = {
    sm: { icon: 20, text: 'text-base' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 36, text: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Geometric 3-facet intelligence emblem representing Sentiment, Risk, and Evidence */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {/* Facet 1: Sentiment Dimension (Apex to Right) */}
        <polygon
          points="16,2 30,26 16,18"
          fill={inverted ? '#60A5FA' : '#4263A5'}
          opacity="0.95"
        />
        {/* Facet 2: Risk Dimension (Apex to Left) */}
        <polygon
          points="16,2 2,26 16,18"
          fill={inverted ? '#93C5FD' : '#172B4D'}
          opacity="0.85"
        />
        {/* Facet 3: Evidence Intelligence (Bottom Base Bridge) */}
        <polygon
          points="2,26 30,26 16,18"
          fill={inverted ? '#38BDF8' : '#2A4365'}
          opacity="0.9"
        />
        {/* Central Core Focal Point */}
        <circle cx="16" cy="18" r="1.5" fill="#FFFFFF" opacity="0.9" />
      </svg>

      {showText && (
        <span
          className={`font-semibold tracking-tight ${dimensions.text} ${
            inverted ? 'text-white' : 'text-brand-navy'
          }`}
        >
          Tri<span className="text-brand-accent">-nance</span>
        </span>
      )}
    </div>
  );
};
