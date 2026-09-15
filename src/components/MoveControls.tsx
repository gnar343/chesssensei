import React, { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { MoveRecord } from '../types/chess.ts';

interface MoveControlsProps {
  currentIndex: number; // -1 for starting position, 0 for 1st move, etc.
  totalMoves: number;
  currentMove?: MoveRecord;
  onGoToMove: (index: number) => void;
  onFlipBoard: () => void;
  isFlipped: boolean;
}

export const MoveControls: React.FC<MoveControlsProps> = ({
  currentIndex,
  totalMoves,
  currentMove,
  onGoToMove,
  onFlipBoard,
  isFlipped,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex >= totalMoves - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      onGoToMove(currentIndex + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, totalMoves, onGoToMove]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > -1) {
          onGoToMove(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < totalMoves - 1) {
          onGoToMove(currentIndex + 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        onGoToMove(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        onGoToMove(totalMoves - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalMoves, onGoToMove]);

  return (
    <div id="move-controls" className="w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col gap-3">
      {/* Current position headline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-700">
            {currentIndex === -1 ? (
              <span className="text-stone-500 font-medium">初期配置 (Start Position)</span>
            ) : (
              <span>
                第<strong className="text-stone-900 font-bold">{currentIndex + 1}</strong>手目 / 全{totalMoves}手
                {currentMove && (
                  <span className="ml-2 font-mono text-base font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {currentMove.color === 'w' ? '白' : '黒'} {currentMove.san}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>

        <button
          id="btn-flip-board"
          onClick={onFlipBoard}
          title="盤面を反転する"
          className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isFlipped ? '白視点' : '黒視点'}</span>
        </button>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-400 font-mono">0</span>
        <input
          id="move-progress-slider"
          type="range"
          min={-1}
          max={totalMoves - 1}
          value={currentIndex}
          onChange={(e) => onGoToMove(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
        />
        <span className="text-xs text-stone-400 font-mono">{totalMoves}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            id="btn-first-move"
            onClick={() => onGoToMove(-1)}
            disabled={currentIndex <= -1}
            title="最初へ (Home)"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-stone-100 text-stone-700 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            id="btn-prev-move"
            onClick={() => onGoToMove(currentIndex - 1)}
            disabled={currentIndex <= -1}
            title="一手戻る (←キー)"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-stone-100 text-stone-800 font-medium text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>前へ</span>
          </button>
        </div>

        {/* Play / Pause */}
        <button
          id="btn-play-pause"
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={totalMoves === 0 || currentIndex >= totalMoves - 1}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-stone-800 hover:bg-stone-900 text-white disabled:opacity-40'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>一時停止</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>自動再生</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-next-move"
            onClick={() => onGoToMove(currentIndex + 1)}
            disabled={currentIndex >= totalMoves - 1}
            title="一手進む (→キー)"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-40 disabled:hover:bg-stone-800 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <span>次へ</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            id="btn-last-move"
            onClick={() => onGoToMove(totalMoves - 1)}
            disabled={currentIndex >= totalMoves - 1}
            title="最後へ (End)"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-stone-100 text-stone-700 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
