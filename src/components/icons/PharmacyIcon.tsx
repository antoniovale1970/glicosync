import React from 'react';

export const PharmacyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M12 11h4"/>
        <path d="M14 9v4"/>
        <path d="M20 6 12 2 4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z"/>
    </svg>
);
