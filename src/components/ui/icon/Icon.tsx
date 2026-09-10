import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 20, className = '', onClick, style = {} }: IconProps) {
  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        maskImage: `url(/icons/${name}.svg)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        ...style
      }}
    />
  );
}
