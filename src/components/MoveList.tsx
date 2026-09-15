import React, { useRef, useEffect } from 'react';
import { MoveRecord } from '../types/chess.ts';

interface MoveListProps {
  moves: MoveRecord[];
  currentIndex: number;
  onSelectMove: (index: number) => void;
}

export const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentIndex,
  onSelectMove,
}) => {
  const activeMoveRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  // Group moves into pairs (White move + Black move)
  const pairedMoves: { moveNumber: number; white?: MoveRecord; whiteIdx?: number; black?: MoveRecord; blackIdx?: number }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    pairedMoves.push({
      moveNumber,
      white: moves[i],
      whiteIdx: i,
      black: moves[i + 1],
      blackIdx: i + 1 < moves.length ? i + 1 : undefined,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-full max-h-[360px] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
          棋譜一覧 ({moves.length}手)
        </h3>
        <button
          onClick={() => onSelectMove(-1)}
          className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
            currentIndex === -1
              ? 'bg-stone-800 text-white'
              : 'text-stone-500 hover:text-stone-800 bg-stone-200/60'
          }`}
        >
          初期配置
        </button>
      </div>

      <div className="p-2 overflow-y-auto flex-1 divide-y divide-stone-100 font-mono text-sm">
        {pairedMoves.map((pair) => {
          const isWhiteActive = pair.whiteIdx === currentIndex;
          const isBlackActive = pair.blackIdx === currentIndex;

          return (
            <div key={pair.moveNumber} className="grid grid-cols-12 py-1 items-center hover:bg-stone-50/80 rounded px-1.5">
              {/* Move number */}
              <span className="col-span-2 text-xs font-semibold text-stone-400">
                {pair.moveNumber}.
              </span>

              {/* White move */}
              <div className="col-span-5">
                {pair.white && (
                  <button
                    ref={isWhiteActive ? activeMoveRef : null}
                    onClick={() => onSelectMove(pair.whiteIdx!)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                      isWhiteActive
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-stone-800 hover:bg-stone-200/70'
                    }`}
                  >
                    <span>{pair.white.san}</span>
                    {pair.white.captured && (
                      <span className="text-[10px] opacity-70">x{pair.white.captured}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Black move */}
              <div className="col-span-5">
                {pair.black && (
                  <button
                    ref={isBlackActive ? activeMoveRef : null}
                    onClick={() => onSelectMove(pair.blackIdx!)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                      isBlackActive
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-stone-800 hover:bg-stone-200/70'
                    }`}
                  >
                    <span>{pair.black.san}</span>
                    {pair.black.captured && (
                      <span className="text-[10px] opacity-70">x{pair.black.captured}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
