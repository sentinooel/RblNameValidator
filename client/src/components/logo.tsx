export function RobloxLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Roblox square - rotated */}
          <rect
            x="30"
            y="30"
            width="40"
            height="40"
            rx="8"
            fill="url(#robloxGradient)"
            transform="rotate(15 50 50)"
            className="drop-shadow-xl"
          />
          
          {/* Inner square detail */}
          <rect
            x="40"
            y="40"
            width="20"
            height="20"
            rx="3"
            fill="white"
            fillOpacity="0.3"
            transform="rotate(15 50 50)"
          />
          
          {/* Small accent squares */}
          <rect
            x="20"
            y="25"
            width="8"
            height="8"
            rx="2"
            fill="url(#accentGradient)"
            transform="rotate(15 24 29)"
          />
          <rect
            x="72"
            y="67"
            width="6"
            height="6"
            rx="1"
            fill="url(#accentGradient)"
            transform="rotate(15 75 70)"
          />
          
          <defs>
            <linearGradient id="robloxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="50%" stopColor="#4ecdc4" />
              <stop offset="100%" stopColor="#45b7d1" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#feca57" />
              <stop offset="100%" stopColor="#ff9ff3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-red-500 via-teal-500 to-blue-500 bg-clip-text text-transparent">
          RobloxCheck
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Username Checker
        </span>
      </div>
    </div>
  );
}