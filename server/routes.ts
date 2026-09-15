import { Router } from 'express';
import { stockfishManager } from './engine.ts';
import { generateMentorAdvice } from './mentor.ts';
import { Chess } from 'chess.js';

export const apiRouter = Router();

// Engine status endpoint
apiRouter.get('/engine/status', async (req, res) => {
  try {
    if (!stockfishManager.isReady()) {
      await stockfishManager.init().catch((err) => {
        console.warn('Initial engine warm-up warning:', err.message);
      });
    }
    res.json({
      status: 'ok',
      engine: stockfishManager.getStatus(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      error: err.message || 'エンジン状態の取得に失敗しました',
    });
  }
});

// Single position analysis
apiRouter.post('/engine/analyze', async (req, res) => {
  try {
    const { fen, depth = 10, timeoutMs = 6000 } = req.body;
    if (!fen) {
      return res.status(400).json({ error: 'FEN文字列が必要です' });
    }

    const result = await stockfishManager.analyze(fen, depth, timeoutMs);
    res.json({
      status: 'ok',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      error: err.message || '局面の解析中にエラーが発生しました',
    });
  }
});

// Analyze both "before" and "after" move (MVP Requirement 3 & 4)
apiRouter.post('/engine/analyze-step', async (req, res) => {
  try {
    const { beforeFen, afterFen, moveSan } = req.body;

    if (!beforeFen || !afterFen) {
      return res.status(400).json({ error: 'beforeFen と afterFen が必要です' });
    }

    // Verify legality of both positions with chess.js
    const chessBefore = new Chess(beforeFen);
    const chessAfter = new Chess(afterFen);

    // Analyze before position (what alternatives were available?)
    const beforeResult = await stockfishManager.analyze(beforeFen, 10, 5000);

    // Analyze after position (what is opponent's reply and threat?)
    const afterResult = await stockfishManager.analyze(afterFen, 10, 5000);

    // Identify material imbalance or tactical events
    const isCheck = chessAfter.inCheck();
    const isCheckmate = chessAfter.isCheckmate();
    const isDraw = chessAfter.isDraw();

    res.json({
      status: 'ok',
      data: {
        moveSan,
        before: beforeResult,
        after: afterResult,
        tacticalFlags: {
          isCheck,
          isCheckmate,
          isDraw,
          turnAfter: chessAfter.turn(), // 'w' or 'b'
        },
      },
    });
  } catch (err: any) {
    console.error('Analyze step error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message || '着手前後の解析に失敗しました',
    });
  }
});

// Teacher AI Explanation endpoint (MVP Requirement 5, 6, 7)
apiRouter.post('/ai/mentor', async (req, res) => {
  try {
    const { moveSan, turn, stepData, userHypothesis } = req.body;

    if (!moveSan || !stepData) {
      return res.status(400).json({ error: 'moveSan と stepData が必要です' });
    }

    const advice = await generateMentorAdvice({
      moveSan,
      turn: turn || 'w',
      stepData,
      userHypothesis,
    });

    res.json({
      status: 'ok',
      advice,
    });
  } catch (err: any) {
    console.error('Mentor advice error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message || '先生AIの解説生成に失敗しました',
    });
  }
});
