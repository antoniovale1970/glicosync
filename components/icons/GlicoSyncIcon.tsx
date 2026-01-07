
import React from 'react';

export const GlicoSyncIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      {/* Sombra projetada externa */}
      <filter id="shadow_ref" x="-20%" y="-10%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
        <feOffset dx="0" dy="3" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Gradiente do Anel Azul (Base Metálica) */}
      <linearGradient id="ring_grad" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0EA5E9" />
        <stop offset="0.4" stopColor="#0284C7" />
        <stop offset="1" stopColor="#075985" />
      </linearGradient>

      {/* Gradiente de Brilho do Vidro no Anel */}
      <linearGradient id="glass_shine" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="white" stopOpacity="0.6" />
        <stop offset="0.3" stopColor="white" stopOpacity="0" />
        <stop offset="0.7" stopColor="white" stopOpacity="0" />
        <stop offset="1" stopColor="white" stopOpacity="0.4" />
      </linearGradient>

      {/* Gradiente da Gota (Volume 3D) */}
      <radialGradient id="drop_vol" cx="45" cy="65" r="40" fx="40" fy="55" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FF3B3B" />
        <stop offset="0.6" stopColor="#E11D48" />
        <stop offset="1" stopColor="#881337" />
      </radialGradient>
    </defs>

    {/* Sombra de Contato Suave */}
    <circle cx="50" cy="54" r="48" fill="black" fillOpacity="0.1" filter="blur(4px)" />

    {/* O ANEL - Aumentado para raio 45 para maior impacto visual */}
    <g filter="url(#shadow_ref)">
      {/* Corpo do Anel */}
      <circle cx="50" cy="50" r="45" stroke="url(#ring_grad)" strokeWidth="8" />
      {/* Brilho Superior (Glass effect) */}
      <circle cx="50" cy="50" r="45" stroke="url(#glass_shine)" strokeWidth="8" />
      {/* Linha de contorno interna fina */}
      <circle cx="50" cy="50" r="41.5" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.5" />
    </g>

    {/* A GOTA - Reposicionada para o centro exato (Y centralizado) */}
    <g>
      {/* Corpo Principal (Centralizado verticalmente) */}
      <path
        d="M50 17.5C50 17.5 72 43.5 72 60.5C72 72.65 62.15 82.5 50 82.5C37.85 82.5 28 72.65 28 60.5C28 43.5 50 17.5 50 17.5Z"
        fill="url(#drop_vol)"
      />
      {/* O Ponto de Brilho Especular (Ajustado para nova posição da gota) */}
      <circle cx="41.5" cy="54" r="4.5" fill="white" fillOpacity="0.9" />
      
      {/* Reflexo secundário na curva inferior (Ajustado para nova posição da gota) */}
      <path
        d="M38 73.5C42 76.5 48 77.5 54 76.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.2"
      />
    </g>
  </svg>
);
