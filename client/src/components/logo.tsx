export function RobloxLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill="url(#logoGradient)" 
        stroke="white" 
        strokeWidth="2"
      />
      
      {/* Inner checkmark circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="32" 
        fill="white" 
        fillOpacity="0.2"
      />
      
      {/* Checkmark */}
      <path
        d="M35 48L44 57L68 33"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Username search icon */}
      <circle
        cx="75"
        cy="25"
        r="8"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M81 31L85 35"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="50%" stopColor="#764ba2" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}