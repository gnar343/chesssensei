import React, { useState } from 'react';
import {
  Cpu,
  ShieldAlert,
  Target,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import {
  MoveRecord,
  PositionAnalysis,
  PvAnalysisItem,
  StepAnalysisData,
} from '../types/chess.ts';

interface EngineAnalysisPanelProps {
  currentMove?: MoveRecord;
  currentIndex: number;
  analysisData: StepAnalysisData | null;
  isLoading: boolean;
  engineStatus: { ready: boolean; engineName: string; busy: boolean };
  onHighlightPvMoves?: (moves: string[]) => void;
  onRequestMentorAdvice: (userNote?: string) => Promise<void>;
  mentorAdvice: {
    threats: string[];
    caution: string;
    targetFeasibility: string;
    lessonPrinciple: string;
    hint: string;
    detailedExplanation: string;
    concreteSteps: string[];
    glossary?: { term: string; explanation: string }[];
  } | null;
  isAiThinking: boolean;
}

export const EngineAnalysisPanel: React.FC<EngineAnalysisPanelProps> = ({
  currentMove,
  currentIndex,
  analysisData,
  isLoading,
  engineStatus,
  onHighlightPvMoves,
  onRequestMentorAdvice,
  mentorAdvice,
  isAiThinking,
}) => {
  // Education principle: evaluation score & best move hidden by default
  const [showEngineRawScores, setShowEngineRawScores] = useState(false);
  const [activeAnalysisView, setActiveAnalysisView] = useState<'after' | 'before'>('after');
  const [userHypothesis, setUserHypothesis] = useState('');
  const [unfoldedStage, setUnfoldedStage] = useState<number>(1); // 1: Hint, 2: Detail, 3: Concrete steps

  if (currentIndex === -1) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center text-stone-500 py-12">
        <Target className="w-10 h-10 text-stone-300 mb-3" />
        <h4 className="text-sm font-semibold text-stone-700">検討したい着手を選んでください</h4>
        <p className="text-xs text-stone-400 max-w-sm mt-1">
          盤面下の「次へ」ボタン、または右の棋譜リストから手を選択すると、UCIエンジン（Stockfish）による前後の解析と先生AIの解説が始まります。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
      {/* Engine Status Header */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-stone-800">
            {engineStatus.engineName || 'Stockfish 18 Lite WASM'}
          </span>
          {engineStatus.ready ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              エンジン接続中
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              未接続
            </span>
          )}
        </div>

        {/* Evaluation reveal toggle (Educational policy) */}
        <button
          onClick={() => setShowEngineRawScores(!showEngineRawScores)}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          title="初心者の自立判断を促すため、初期状態では数値を伏せています"
        >
          {showEngineRawScores ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>評価値・最善手を隠す</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>評価値・最善手を見る（上級者向）</span>
            </>
          )}
        </button>
      </div>

      {/* Main Analysis Area */}
      <div className="p-4 flex flex-col gap-4">
        {/* Step 1: User's intent prompt (MVP Step 5) */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ?
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  {currentMove?.color === 'w' ? '白' : '黒'}の着手「{currentMove?.san}」
                  — この手の狙いは何でしょうか？
                </h4>
                <p className="text-[11px] text-stone-500">
                  質問に答えずにそのまま解説を見ることも可能です。自分の言葉で考えることで判断力が向上します。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={userHypothesis}
              onChange={(e) => setUserHypothesis(e.target.value)}
              placeholder="例: ナイトを攻撃して追い払う狙い、中央を制圧するため、など"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRequestMentorAdvice(userHypothesis);
                }
              }}
            />
            <button
              onClick={() => onRequestMentorAdvice(userHypothesis)}
              disabled={isAiThinking}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              {isAiThinking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>先生が思考中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>先生に尋ねる</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Progressive Disclosure Mentor Advice (MVP 6 & 7) */}
        {mentorAdvice && (
          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
            <div className="p-3.5 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                先生AIの段階的アドバイス
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setUnfoldedStage(1)}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    unfoldedStage >= 1
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  ① ヒント
                </button>
                <button
                  onClick={() => setUnfoldedStage(2)}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    unfoldedStage >= 2
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  ② 詳しい説明
                </button>
                <button
                  onClick={() => setUnfoldedStage(3)}
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    unfoldedStage >= 3
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  ③ 具体的手順
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3.5">
              {/* Stage 1: Hint */}
              {unfoldedStage >= 1 && (
                <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>局面のヒントと警戒点</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {mentorAdvice.hint}
                  </p>
                  {mentorAdvice.caution && (
                    <div className="mt-2 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>警戒点:</strong> {mentorAdvice.caution}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 2: Detailed Explanation */}
              {unfoldedStage >= 2 && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>詳しい解説 & 狙いの成立可否</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                    {mentorAdvice.detailedExplanation}
                  </p>
                  {mentorAdvice.targetFeasibility && (
                    <p className="text-xs text-stone-600 bg-stone-100 p-2 rounded-lg">
                      <strong>狙いの成立状況:</strong> {mentorAdvice.targetFeasibility}
                    </p>
                  )}
                  {mentorAdvice.lessonPrinciple && (
                    <div className="text-xs font-medium text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <strong>次回に使える考え方:</strong> {mentorAdvice.lessonPrinciple}
                    </div>
                  )}
                </div>
              )}

              {/* Stage 3: Concrete moves */}
              {unfoldedStage >= 3 && (
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ルール検証済みの具体的手順</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {mentorAdvice.concreteSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono bg-stone-50 px-2.5 py-1.5 rounded border border-stone-200 flex items-center justify-between"
                      >
                        <span className="text-stone-700">{step}</span>
                        <span className="text-[10px] text-emerald-600 font-sans font-bold">
                          ✅ 合法手検証済
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Glossary terms if any */}
              {mentorAdvice.glossary && mentorAdvice.glossary.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    チェス用語の解説
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {mentorAdvice.glossary.map((g, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] bg-stone-100 text-stone-700 px-2 py-1 rounded-md border border-stone-200"
                      >
                        <strong className="font-semibold text-stone-900">{g.term}:</strong>{' '}
                        {g.explanation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Engine Deep Analysis (Before vs After Position) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveAnalysisView('after')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeAnalysisView === 'after'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                指した後の局面（相手の狙い）
              </button>
              <button
                onClick={() => setActiveAnalysisView('before')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeAnalysisView === 'before'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                指す前の局面（他の候補手）
              </button>
            </div>

            {analysisData && (
              <span className="text-[10px] font-mono text-stone-400">
                解析時間: {analysisData.after.timeMs + analysisData.before.timeMs}ms
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-stone-50/50">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              <span className="text-xs font-semibold text-stone-600">
                UCIエンジン（Stockfish）が局面と読み筋を計算中...
              </span>
            </div>
          ) : analysisData ? (
            <div className="flex flex-col gap-2">
              {activeAnalysisView === 'after' ? (
                // After move analysis: Opponent's reply and threats
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-stone-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                    <strong>相手の視点:</strong> あなたの「{currentMove?.san}」に対し、相手が狙える最有力手と手順です。
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {analysisData.after.pvList.map((pv) => (
                      <div
                        key={pv.rank}
                        className="p-3 hover:bg-stone-50 transition-colors flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 text-[10px] flex items-center justify-center font-bold">
                              {pv.rank}
                            </span>
                            応手: <strong className="font-mono text-amber-700">{pv.sanMoves[0] || pv.moves[0]}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {pv.isLegal ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ルール検証済
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                要確認
                              </span>
                            )}

                            {showEngineRawScores && (
                              <span className="text-xs font-mono font-bold text-stone-600">
                                {pv.mate !== undefined
                                  ? `#${pv.mate}`
                                  : pv.scoreCp !== undefined
                                  ? (pv.scoreCp / 100).toFixed(2)
                                  : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Full PV line */}
                        <div className="text-xs font-mono text-stone-600 bg-stone-50 p-2 rounded-lg flex items-center justify-between overflow-x-auto">
                          <span>
                            {pv.sanMoves.length > 0
                              ? pv.sanMoves.join(' ')
                              : pv.moves.join(' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Before move analysis: Alternative moves that were available
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-stone-600 bg-stone-100 p-2.5 rounded-xl">
                    <strong>この手番で考えられた選択肢:</strong> エンジンが候補として計算した上位の着手です。
                  </div>

                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {analysisData.before.pvList.map((pv) => (
                      <div
                        key={pv.rank}
                        className="p-3 hover:bg-stone-50 transition-colors flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 text-[10px] flex items-center justify-center font-bold">
                              {pv.rank}
                            </span>
                            候補手: <strong className="font-mono text-stone-900">{pv.sanMoves[0] || pv.moves[0]}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {pv.isLegal && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ルール検証済
                              </span>
                            )}

                            {showEngineRawScores && (
                              <span className="text-xs font-mono font-bold text-stone-600">
                                {pv.mate !== undefined
                                  ? `#${pv.mate}`
                                  : pv.scoreCp !== undefined
                                  ? (pv.scoreCp / 100).toFixed(2)
                                  : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Full PV line */}
                        <div className="text-xs font-mono text-stone-600 bg-stone-50 p-2 rounded-lg flex items-center justify-between overflow-x-auto">
                          <span>
                            {pv.sanMoves.length > 0
                              ? pv.sanMoves.join(' ')
                              : pv.moves.join(' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
              解析データがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
