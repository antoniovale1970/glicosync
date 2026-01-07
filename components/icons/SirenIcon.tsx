import React from 'react';

export const SirenIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
        <path d="M5 21a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
        <path d="M21 12h1" />
        <path d="M18.5 4.5 21 2" />
        <path d="M2 12h1" />
        <path d="M12 2v1" />
        <path d="m3 2 2.5 2.5" />
    </svg>
);