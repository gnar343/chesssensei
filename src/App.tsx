import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  RotateCcw,
  Sparkles,
  Shield,
  Cpu,
  HelpCircle,
  Award,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { ChessBoard } from './components/ChessBoard.tsx';
import { CapturedPiecesBar } from './components/CapturedPiecesBar.tsx';
import { MoveControls } from './components/MoveControls.tsx';
import { MoveList } from './components/MoveList.tsx';
import { PgnModal } from './components/PgnModal.tsx';
import { EngineAnalysisPanel } from './components/EngineAnalysisPanel.tsx';
import {
  getCapturedPieces,
  parsePgnToMoves,
  SAMPLE_GAMES,
} from './utils/chessUtils.ts';
import {
  MoveRecord,
  PieceColor,
  StepAnalysisData,
  MentorExplanation,
} from './types/chess.ts';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function App() {
  // PGN and Moves state
  const [currentPgn, setCurrentPgn] = useState<string>(SAMPLE_GAMES[0].pgn);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 is startpos
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Engine state
  const [engineStatus, setEngineStatus] = useState<{
    ready: boolean;
    engineName: string;
    busy: boolean;
  }>({
    ready: false,
    engineName: 'Stockfish 18 Lite WASM',
    busy: false,
  });

  // Step analysis data cache & state
  const [analysisCache, setAnalysisCache] = useState<Record<number, StepAnalysisData>>({});
  const [currentAnalysis, setCurrentAnalysis] = useState<StepAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Mentor explanation state
  const [mentorAdviceCache, setMentorAdviceCache] = useState<Record<number, MentorExplanation>>({});
  const [currentMentorAdvice, setCurrentMentorAdvice] = useState<MentorExplanation | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Load default game on initial mount
  useEffect(() => {
    loadPgnString(SAMPLE_GAMES[0].pgn);
    checkEngineStatus();
  }, []);

  // Poll engine status once or when needed
  const checkEngineStatus = async () => {
    try {
      const res = await fetch('/api/engine/status');
      const data = await res.json();
      if (data.status === 'ok' && data.engine) {
        setEngineStatus(data.engine);
      }
    } catch (err) {
      console.warn('Engine status fetch error:', err);
    }
  };

  // Load and parse PGN
  const loadPgnString = (pgnText: string): { success: boolean; error?: string } => {
    const { moves: parsedMoves, headers: parsedHeaders, error } = parsePgnToMoves(pgnText);
    if (error) {
      return { success: false, error };
    }

    setCurrentPgn(pgnText);
    setMoves(parsedMoves);
    setHeaders(parsedHeaders);
    setCurrentIndex(parsedMoves.length > 0 ? 0 : -1);
    setAnalysisCache({});
    setMentorAdviceCache({});
    setCurrentAnalysis(null);
    setCurrentMentorAdvice(null);
    return { success: true };
  };

  // Current position FEN
  const currentFen = currentIndex === -1
    ? START_FEN
    : moves[currentIndex]?.afterFen || START_FEN;

  const currentMove = currentIndex >= 0 ? moves[currentIndex] : undefined;

  // Last move from/to squares for board highlighting
  const lastMoveHighlight = currentMove
    ? { from: currentMove.from, to: currentMove.to }
    : null;

  // Captured pieces and material
  const capturedState = React.useMemo(() => {
    return getCapturedPieces(currentFen);
  }, [currentFen]);

  // Turn calculation
  const currentTurn: PieceColor = currentIndex === -1
    ? 'w'
    : currentMove?.color === 'w' ? 'b' : 'w';

  // Analyze step when currentIndex changes
  const runStepAnalysis = useCallback(
    async (index: number) => {
      if (index < 0 || !moves[index]) {
        setCurrentAnalysis(null);
        setCurrentMentorAdvice(null);
        return;
      }

      // Check cache first
      if (analysisCache[index]) {
        setCurrentAnalysis(analysisCache[index]);
        if (mentorAdviceCache[index]) {
          setCurrentMentorAdvice(mentorAdviceCache[index]);
        } else {
          setCurrentMentorAdvice(null);
        }
        return;
      }

      const move = moves[index];
      setIsAnalyzing(true);
      setCurrentAnalysis(null);
      setCurrentMentorAdvice(null);

      try {
        const response = await fetch('/api/engine/analyze-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beforeFen: move.beforeFen,
            afterFen: move.afterFen,
            moveSan: move.san,
          }),
        });

        const result = await response.json();
        if (result.status === 'ok' && result.data) {
          const stepData: StepAnalysisData = result.data;
          setAnalysisCache((prev) => ({ ...prev, [index]: stepData }));
          setCurrentAnalysis(stepData);

          // Check if engine status updated
          if (!engineStatus.ready) {
            checkEngineStatus();
          }
        }
      } catch (err) {
        console.error('Error analyzing step:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [moves, analysisCache, mentorAdviceCache, engineStatus.ready]
  );

  // Trigger analysis when move index changes
  useEffect(() => {
    if (currentIndex >= 0 && moves[currentIndex]) {
      runStepAnalysis(currentIndex);
    } else {
      setCurrentAnalysis(null);
      setCurrentMentorAdvice(null);
    }
  }, [currentIndex, moves, runStepAnalysis]);

  // Handle request for Mentor advice
  const handleRequestMentorAdvice = async (userNote?: string) => {
    if (currentIndex < 0 || !currentMove || !currentAnalysis) return;

    setIsAiThinking(true);
    try {
      const response = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moveSan: currentMove.san,
          turn: currentMove.color,
          stepData: currentAnalysis,
          userHypothesis: userNote,
        }),
      });

      const result = await response.json();
      if (result.status === 'ok' && result.advice) {
        setMentorAdviceCache((prev) => ({ ...prev, [currentIndex]: result.advice }));
        setCurrentMentorAdvice(result.advice);
      }
    } catch (err) {
      console.error('Mentor advice error:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col selection:bg-amber-200">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900 tracking-tight">
                  チェス先生AI
                </h1>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/60">
                  初心者向け指導モード
                </span>
              </div>
              <p className="text-xs text-stone-500">
                最善手の暗記ではなく、相手の狙いと警戒点を理解し自立判断力を養う
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-open-pgn-modal"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>棋譜を開く / サンプル</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chessboard & Controls (5 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-3">
          {/* Top Player Captured Bar */}
          <CapturedPiecesBar
            color={isFlipped ? 'w' : 'b'}
            playerName={isFlipped ? headers.White : headers.Black}
            isTurn={currentTurn === (isFlipped ? 'w' : 'b')}
            captures={isFlipped ? capturedState.blackCaptures : capturedState.whiteCaptures}
            materialAdvantage={
              isFlipped
                ? capturedState.materialDifference
                : -capturedState.materialDifference
            }
          />

          {/* Chessboard */}
          <ChessBoard
            fen={currentFen}
            lastMove={lastMoveHighlight}
            orientation={isFlipped ? 'b' : 'w'}
          />

          {/* Bottom Player Captured Bar */}
          <CapturedPiecesBar
            color={isFlipped ? 'b' : 'w'}
            playerName={isFlipped ? headers.Black : headers.White}
            isTurn={currentTurn === (isFlipped ? 'b' : 'w')}
            captures={isFlipped ? capturedState.whiteCaptures : capturedState.blackCaptures}
            materialAdvantage={
              isFlipped
                ? -capturedState.materialDifference
                : capturedState.materialDifference
            }
          />

          {/* Move Controller */}
          <MoveControls
            currentIndex={currentIndex}
            totalMoves={moves.length}
            currentMove={currentMove}
            onGoToMove={(idx) => setCurrentIndex(idx)}
            onFlipBoard={() => setIsFlipped(!isFlipped)}
            isFlipped={isFlipped}
          />
        </div>

        {/* Right Column: Teacher AI & Analysis (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          {/* Game Title & Header Card */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                現在検討中の棋譜
              </span>
              <h2 className="text-sm font-bold text-stone-800">
                {headers.Event || 'チェス対局検討'}
                {headers.Result && (
                  <span className="ml-2 text-xs font-mono font-normal text-stone-500">
                    ({headers.Result})
                  </span>
                )}
              </h2>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-3">
                <span>白: {headers.White || 'Player 1'}</span>
                <span>vs</span>
                <span>黒: {headers.Black || 'Player 2'}</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-amber-700 font-semibold hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              別の棋譜を学ぶ
            </button>
          </div>

          {/* Teacher AI and Engine Analysis Panel */}
          <EngineAnalysisPanel
            currentMove={currentMove}
            currentIndex={currentIndex}
            analysisData={currentAnalysis}
            isLoading={isAnalyzing}
            engineStatus={engineStatus}
            onRequestMentorAdvice={handleRequestMentorAdvice}
            mentorAdvice={currentMentorAdvice}
            isAiThinking={isAiThinking}
          />

          {/* Move History Table */}
          <MoveList
            moves={moves}
            currentIndex={currentIndex}
            onSelectMove={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </main>

      {/* PGN Modal */}
      <PgnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoadPgn={loadPgnString}
      />
    </div>
  );
}
