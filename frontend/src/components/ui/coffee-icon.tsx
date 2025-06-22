import React from 'react';

export const CoffeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M10 21h7a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
    <path d="M17 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
    <path d="M17 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
  </svg>
); 