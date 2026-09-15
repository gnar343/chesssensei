export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface MoveRecord {
  moveNumber: number;
  color: PieceColor;
  san: string;
  from: string;
  to: string;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  beforeFen: string;
  afterFen: string;
  comment?: string;
  userNote?: string;
}

export interface CapturedPiecesState {
  whiteCaptures: PieceType[]; // pieces captured by white (black pieces)
  blackCaptures: PieceType[]; // pieces captured by black (white pieces)
  materialDifference: number; // positive = white ahead, negative = black ahead
}

export interface PvAnalysisItem {
  rank: number;
  scoreCp?: number;
  mate?: number;
  depth: number;
  moves: string[];
  sanMoves: string[];
  isLegal: boolean;
}

export interface PositionAnalysis {
  fen: string;
  bestMove?: string;
  bestMoveSan?: string;
  pvList: PvAnalysisItem[];
  engineName: string;
  timeMs: number;
}

export interface StepAnalysisData {
  moveSan: string;
  before: PositionAnalysis;
  after: PositionAnalysis;
  tacticalFlags: {
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    turnAfter: PieceColor;
  };
}

export interface MentorExplanation {
  threats: string[]; // 相手の狙い
  caution: string; // まず警戒することを一つ
  targetFeasibility: string; // ユーザーの狙いが成立するか
  lessonPrinciple: string; // 次回に使える考え方
  hint: string; // 段階的開示1: ヒント
  detailedExplanation: string; // 段階的開示2: 詳しい説明
  concreteSteps: string[]; // 段階的開示3: 具体的な手順
  glossary?: { term: string; explanation: string }[];
}

export interface SamplePgn {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  pgn: string;
}
