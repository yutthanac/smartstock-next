import React from 'react';

export interface ThaiBahtProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ThaiBaht: React.FC<ThaiBahtProps> = ({
  size = 24,
  className = '',
  width,
  height,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || size}
      height={height || size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central vertical strike-through line matching Lucide DollarSign */}
      <line x1="10" y1="2" x2="10" y2="22" />
      {/* Top loop of B */}
      <path d="M6 5h6a3.5 3.5 0 0 1 0 7H6" />
      {/* Bottom loop of B */}
      <path d="M6 12h6.5a3.5 3.5 0 0 1 0 7H6" />
      {/* Left vertical backbone */}
      <line x1="6" y1="4" x2="6" y2="20" />
    </svg>
  );
};

export default ThaiBaht;
