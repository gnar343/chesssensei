import React from 'react';
import { PieceColor, PieceType } from '../types/chess.ts';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // Crisp, beautiful SVG paths for standard chess pieces
  switch (type) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-king-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? '#0f172a' : '#f8fafc'} strokeWidth="1.7" />
            <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
          </g>
        </svg>
      );
    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-queen-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-6-1.5-18.5-1.5-27 0z" />
            <path d="M11.5 30c3.5-1 17.5-1 21 0m-20 3.5c3.5-1 17.5-1 20 0m-19 3.5c3.5-1 17.5-1 19 0" />
          </g>
        </svg>
      );
    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-rook-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2.5-4.5l1.5-16.5h13l1.5 16.5h-16zm-3-16.5l-1.5-4h25l-1.5 4h-22z" />
            <path d="M11 11h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4z" />
            <path d="M12 35.5h21m-20-4h19" stroke={isWhite ? '#cbd5e1' : '#475569'} />
          </g>
        </svg>
      );
    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-bishop-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            <path d="M17.5 26h10M15 30h15m-7.5-14v5m-3-2.5h6" stroke={isWhite ? '#0f172a' : '#f8fafc'} />
          </g>
        </svg>
      );
    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-knight-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
            <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.693 2.012-3 1-1.612-1.009-.49-4.47 0-6 1.5-2.5 3.5-4 5-7 0 0-2.5-.5-3.5-2 1.5-1 3.5-1 3.5-1 .5-2 2-4 3.5-4.5 1.5-.5 3.5 0 4.5.5 1 .5 2 1.5 2 2.5 0 .5-.5 1-1 1.5 2 .5 2 2 2 3.5z" />
            <circle cx="16" cy="18" r="1.2" fill={isWhite ? '#0f172a' : '#f8fafc'} />
            <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm15-6c-2.5 0-3.5 2.5-3.5 2.5" />
            <path d="M9.5 39.5c6.5.5 21.5.5 27 0" />
          </g>
        </svg>
      );
    case 'p': // Pawn
    default:
      return (
        <svg viewBox="0 0 45 45" className={className} id={`piece-pawn-${color}`}>
          <g fill={isWhite ? '#ffffff' : '#1e293b'} stroke={isWhite ? '#1e293b' : '#f8fafc'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.03-3.02 1.49-5.18 4.57-5.38 8.17H32.5c-.2-3.6-2.36-6.68-5.38-8.17 1.45-1.19 2.38-3 2.38-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
            <path d="M12 36.5c6.5.5 14.5.5 21 0" />
          </g>
        </svg>
      );
  }
};
