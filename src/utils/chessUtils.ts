import { Chess, Square } from 'chess.js';
import { CapturedPiecesState, MoveRecord, PieceType, SamplePgn } from '../types/chess.ts';

const INITIAL_PIECES: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Computes the captured pieces and material count from a FEN string.
 */
export function getCapturedPieces(fen: string): CapturedPiecesState {
  const chess = new Chess(fen);
  const currentWhiteCounts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const currentBlackCounts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        if (piece.color === 'w') {
          currentWhiteCounts[piece.type]++;
        } else {
          currentBlackCounts[piece.type]++;
        }
      }
    }
  }

  // Black pieces captured by White
  const whiteCaptures: PieceType[] = [];
  // White pieces captured by Black
  const blackCaptures: PieceType[] = [];

  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (const type of ['q', 'r', 'b', 'n', 'p'] as PieceType[]) {
    whiteMaterial += currentWhiteCounts[type] * PIECE_VALUES[type];
    blackMaterial += currentBlackCounts[type] * PIECE_VALUES[type];

    const capturedBlackCount = Math.max(0, INITIAL_PIECES[type] - currentBlackCounts[type]);
    for (let i = 0; i < capturedBlackCount; i++) {
      whiteCaptures.push(type);
    }

    const capturedWhiteCount = Math.max(0, INITIAL_PIECES[type] - currentWhiteCounts[type]);
    for (let i = 0; i < capturedWhiteCount; i++) {
      blackCaptures.push(type);
    }
  }

  return {
    whiteCaptures,
    blackCaptures,
    materialDifference: whiteMaterial - blackMaterial,
  };
}

/**
 * Parses a PGN string and extracts full move-by-move records with FENs and validation.
 */
export function parsePgnToMoves(pgnText: string): {
  moves: MoveRecord[];
  headers: Record<string, string>;
  error?: string;
} {
  const cleanPgn = pgnText.trim();
  if (!cleanPgn) {
    return { moves: [], headers: {}, error: 'PGNデータが空です' };
  }

  const chess = new Chess();
  try {
    chess.loadPgn(cleanPgn, { strict: false });
  } catch (err: any) {
    return {
      moves: [],
      headers: {},
      error: `PGNの解析に失敗しました: ${err.message || '構文または非合法手エラー'}`,
    };
  }

  const headers = chess.header();
  const history = chess.history({ verbose: true });

  // Replay from start to capture beforeFen and afterFen for each move
  const replayer = new Chess();
  const moves: MoveRecord[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const beforeFen = replayer.fen();
    const played = replayer.move({
      from: move.from as Square,
      to: move.to as Square,
      promotion: move.promotion,
    });

    if (!played) {
      return {
        moves: [],
        headers,
        error: `第${i + 1}手の再生中に非合法手が検出されました: ${move.san}`,
      };
    }

    moves.push({
      moveNumber: Math.floor(i / 2) + 1,
      color: move.color,
      san: move.san,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      beforeFen,
      afterFen: replayer.fen(),
    });
  }

  return { moves, headers };
}

/**
 * Beginner-friendly educational sample games.
 */
export const SAMPLE_GAMES: SamplePgn[] = [
  {
    id: 'scholars-mate-lesson',
    title: 'スカラーズ・メイトの教訓',
    subtitle: 'わずか4手での奇襲と弱点f7の守り方',
    category: 'オープニング・基本の罠',
    description:
      '初心者が最も頻繁に遭遇する白の4手詰み奇襲。キングの横の弱点「f7」をビショップとクイーンで狙う仕組みと、早すぎるクイーン出撃の代償を学びます。',
    pgn: `[Event "初心者のための教訓戦"]
[Site "Chess Mentor Arena"]
[Date "2026.01.10"]
[Round "1"]
[White "Scholar's Attacker"]
[Black "Defending Learner"]
[Result "1-0"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`,
  },
  {
    id: 'scholars-defense-counter',
    title: '早すぎるクイーンへの反撃',
    subtitle: '相手の狙いを見抜き、手得を奪う正しい受け方',
    category: '守備と反撃',
    description:
      '先ほどのスカラーズ・メイトに対し、慌てずポーンとナイトで守りながら白のクイーンを攻撃して駒を展開する理想的な反撃実戦譜です。',
    pgn: `[Event "守備と反撃の模範"]
[Site "Chess Mentor Arena"]
[Date "2026.02.15"]
[Round "2"]
[White "Aggressive Queen"]
[Black "Calm Defender"]
[Result "0-1"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 g6 4. Qf3 Nf6 5. Ne2 Bg7 6. Nbc3 O-O 7. d3 d6 8. Bg5 Be6 9. O-O-O h6 10. Bxf6 Qxf6 11. Qxf6 Bxf6 0-1`,
  },
  {
    id: 'knight-fork-trap',
    title: 'ナイトフォーク（両取り）の落とし穴',
    subtitle: 'c7のマスを見落としてルークを失う瞬間',
    category: '戦術・タクティクス',
    description:
      'ピースの利きや守りの不在を見落とし、白のナイトにキングとルークを同時に狙われる（フォーク）典型的な初心者の反省局です。',
    pgn: `[Event "戦術見落としの検討局"]
[Site "Chess Mentor Arena"]
[Date "2026.03.01"]
[Round "3"]
[White "Tactics Hunter"]
[Black "Careless Player"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 d6 4. Nc3 h6 5. d4 exd4 6. Nxd4 Bd7 7. Nxc6 Bxc6 8. Nd5 Nf6 9. Bf4 Be7 10. Qd3 O-O 11. O-O-O a6 12. g4 b5 13. Bb3 a5 14. g5 hxg5 15. Bxg5 a4 16. Nxe7+ Qxe7 17. Bd5 Bxd5 18. exd5 Qe5 19. f4 Qe4 20. Bxf6 Qxf4+ 21. Kb1 Qxf6 1-0`,
  },
  {
    id: 'back-rank-mate',
    title: 'バックランク（最終段）メイト',
    subtitle: 'キングの逃げ道（ルフト）を作らなかった悲劇',
    category: 'エンドゲーム・終盤の守り',
    description:
      'ポーンが壁になってキングが前へ逃げられない状態で、相手のルークが第8ランクに侵入して一発でゲームが終わる有名な詰みの教訓です。',
    pgn: `[Event "バックランクの教訓"]
[Site "Chess Mentor Arena"]
[Date "2026.04.12"]
[Round "4"]
[White "Rook Infiltrator"]
[Black "Trapped King"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. Bg5 h6 16. Bd2 c5 17. d5 c4 18. b4 a5 19. a4 axb4 20. cxb4 bxa4 21. Rxa4 Rxa4 22. Bxa4 Qc7 23. Bc3 Ra8 24. Bc2 Ra3 25. Qd2 Nb6 26. Ra1 Rxa1+ 27. Bxa1 Bc8 28. Bc3 Bd7 29. Ne2 Na4 30. Bxa4 Bxa4 31. Qa2 Bb5 32. Qa5 Qxa5 33. bxa5 Nxe4 34. Bb4 Be7 35. Nxe5 dxe5 36. Bxe7 c3 37. Nc1 f5 38. f3 Nd2 39. d6 Kf7 40. a6 Bxa6 41. d7 Kxe7 1-0`,
  },
];
