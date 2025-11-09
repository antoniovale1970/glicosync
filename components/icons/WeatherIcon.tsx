import React from 'react';

// Weather Icons based on WMO Weather interpretation codes
// https://open-meteo.com/en/docs

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path><path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path><path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
);

const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
    </svg>
);

const CloudSunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path>
        <path d="M20 12h2"></path><path d="m19.07 4.93-1.41 1.41"></path>
        <path d="M17.5 22H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
        <path d="M16 12a4 4 0 1 1-8 0"></path>
    </svg>
);

const CloudRainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M8 19v1"></path><path d="M8 14v1"></path>
        <path d="M16 19v1"></path><path d="M16 14v1"></path>
        <path d="M12 21v1"></path><path d="M12 16v1"></path>
    </svg>
);

const CloudFogIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
        <path d="M5 20h14"/>
    </svg>
);

interface WeatherIconProps extends React.SVGProps<SVGSVGElement> {
  code: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ code, ...props }) => {
  const getWeatherIcon = () => {
    if (code === 0) return <SunIcon />;
    if (code >= 1 && code <= 3) return <CloudSunIcon />;
    if (code === 45 || code === 48) return <CloudFogIcon />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRainIcon />;
    // Default icon
    return <CloudIcon />;
  };

  const IconComponent = getWeatherIcon();
  
  return React.cloneElement(IconComponent, props);
};
