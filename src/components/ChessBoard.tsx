import React from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPiece } from './ChessPiece.tsx';
import { PieceColor, PieceType } from '../types/chess.ts';

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string } | null;
  orientation?: PieceColor; // 'w' or 'b'
  onSquareClick?: (square: string) => void;
  highlightSquares?: string[];
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove = null,
  orientation = 'w',
  onSquareClick,
  highlightSquares = [],
}) => {
  const chess = React.useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const board = chess.board();
  const inCheck = chess.inCheck();
  const turn = chess.turn();

  // Find king square in check
  let checkKingSquare: string | null = null;
  if (inCheck) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          checkKingSquare = `${files[c]}${8 - r}`;
        }
      }
    }
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedRanks = orientation === 'w' ? ranks : [...ranks].reverse();
  const displayedFiles = orientation === 'w' ? files : [...files].reverse();

  return (
    <div className="relative select-none p-3 bg-stone-900/90 rounded-2xl shadow-xl border border-stone-800 flex flex-col items-center">
      {/* Outer container with fixed aspect ratio */}
      <div className="relative w-full max-w-[480px] aspect-square rounded-xl overflow-hidden shadow-inner border border-stone-700/60 bg-stone-950">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {displayedRanks.map((rank, rIdx) =>
            displayedFiles.map((file, fIdx) => {
              const squareName = `${file}${rank}` as Square;
              const fileIndex = files.indexOf(file);
              const rankIndex = 8 - parseInt(rank, 10);
              const piece = board[rankIndex]?.[fileIndex];

              const isLight = (fileIndex + rankIndex) % 2 === 0;
              const isLastMoveFrom = lastMove?.from === squareName;
              const isLastMoveTo = lastMove?.to === squareName;
              const isKingInCheck = checkKingSquare === squareName;
              const isCustomHighlighted = highlightSquares.includes(squareName);

              return (
                <div
                  key={squareName}
                  id={`square-${squareName}`}
                  onClick={() => onSquareClick?.(squareName)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]'
                  } ${
                    isLastMoveFrom || isLastMoveTo
                      ? 'after:absolute after:inset-0 after:bg-amber-400/40 after:pointer-events-none'
                      : ''
                  } ${
                    isCustomHighlighted
                      ? 'after:absolute after:inset-0 after:bg-cyan-400/40 after:pointer-events-none'
                      : ''
                  } ${
                    isKingInCheck
                      ? 'after:absolute after:inset-0 after:bg-rose-500/50 after:animate-pulse'
                      : ''
                  }`}
                >
                  {/* File label (bottom row) */}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-semibold ${
                        isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
                      } pointer-events-none`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Rank label (left column) */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-semibold ${
                        isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
                      } pointer-events-none`}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div className="w-[82%] h-[82%] z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform hover:scale-105">
                      <ChessPiece
                        type={piece.type as PieceType}
                        color={piece.color as PieceColor}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
