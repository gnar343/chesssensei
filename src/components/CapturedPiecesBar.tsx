import React from 'react';
import { ChessPiece } from './ChessPiece.tsx';
import { CapturedPiecesState, PieceColor, PieceType } from '../types/chess.ts';

interface CapturedPiecesBarProps {
  color: PieceColor; // whose captured pieces bar is this? ('w' for white player side, 'b' for black)
  playerName?: string;
  isTurn: boolean;
  captures: PieceType[]; // pieces taken from opponent
  materialAdvantage?: number; // e.g. +3 if this side is ahead
}

export const CapturedPiecesBar: React.FC<CapturedPiecesBarProps> = ({
  color,
  playerName,
  isTurn,
  captures,
  materialAdvantage,
}) => {
  const isWhite = color === 'w';
  const opponentColor: PieceColor = isWhite ? 'b' : 'w';

  // Group captured pieces
  const pieceCounts: Record<PieceType, number> = {
    q: 0,
    r: 0,
    b: 0,
    n: 0,
    p: 0,
    k: 0,
  };

  for (const p of captures) {
    pieceCounts[p] = (pieceCounts[p] || 0) + 1;
  }

  const pieceOrder: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

  return (
    <div
      id={`captured-bar-${color}`}
      className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
        isTurn
          ? 'bg-amber-50/90 border border-amber-300 shadow-sm'
          : 'bg-stone-100/70 border border-stone-200'
      }`}
    >
      {/* Player info & Turn indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`w-3.5 h-3.5 rounded-full border shadow-xs ${
            isWhite ? 'bg-white border-stone-400' : 'bg-stone-900 border-stone-700'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
            {playerName || (isWhite ? '白 (White)' : '黒 (Black)')}
            {isTurn && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-md uppercase tracking-wider animate-pulse">
                手番
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Captured pieces */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5 flex-wrap justify-end">
          {pieceOrder.map((type) => {
            const count = pieceCounts[type];
            if (!count) return null;
            return (
              <div key={type} className="flex items-center bg-white/70 px-1 py-0.5 rounded border border-stone-200">
                <div className="w-4 h-4">
                  <ChessPiece type={type} color={opponentColor} />
                </div>
                {count > 1 && (
                  <span className="text-[10px] font-bold text-stone-600 ml-0.5">
                    ×{count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {materialAdvantage && materialAdvantage > 0 ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
            +{materialAdvantage}
          </span>
        ) : null}
      </div>
    </div>
  );
};
