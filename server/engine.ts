import { createRequire } from 'module';
import { Chess } from 'chess.js';

const require = createRequire(import.meta.url);

export interface PvAnalysis {
  rank: number;
  scoreCp?: number;
  mate?: number;
  depth: number;
  moves: string[]; // e.g. ["e7e5", "d2d4"]
  sanMoves: string[]; // e.g. ["e5", "d4"] verified legal SAN
  isLegal: boolean;
}

export interface PositionAnalysisResult {
  fen: string;
  bestMove?: string;
  bestMoveSan?: string;
  pvList: PvAnalysis[];
  engineName: string;
  timeMs: number;
}

class StockfishManager {
  private engine: any = null;
  private isInitialized = false;
  private isBusy = false;
  private engineName = 'Stockfish 18 Lite';

  async init(): Promise<void> {
    if (this.isInitialized && this.engine) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const stockfish = require('stockfish');
        const timeout = setTimeout(() => {
          reject(new Error('Engine initialization timed out (10s)'));
        }, 10000);

        stockfish('lite-single').then((engineInstance: any) => {
          clearTimeout(timeout);
          this.engine = engineInstance;
          this.isInitialized = true;

          // Configure UCI listener
          this.engine.listener = (msg: string) => {
            if (msg.startsWith('id name ')) {
              this.engineName = msg.replace('id name ', '').trim();
            }
          };

          this.engine.sendCommand('uci');
          setTimeout(() => {
            this.engine.sendCommand('setoption name MultiPV value 3');
            this.engine.sendCommand('isready');
            resolve();
          }, 300);
        }).catch((err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  isReady(): boolean {
    return this.isInitialized && this.engine !== null;
  }

  getStatus(): { ready: boolean; engineName: string; busy: boolean } {
    return {
      ready: this.isReady(),
      engineName: this.engineName,
      busy: this.isBusy,
    };
  }

  /**
   * Analyzes a position given by FEN.
   * MultiPV = 3, depth default 10, max timeout default 5000ms.
   * Validates all PV moves using chess.js to ensure strict legality.
   */
  async analyze(
    fen: string,
    depth = 10,
    timeoutMs = 5000
  ): Promise<PositionAnalysisResult> {
    if (!this.isReady()) {
      await this.init();
    }

    // Verify FEN legality with chess.js first
    let validator: Chess;
    try {
      validator = new Chess(fen);
    } catch (err: any) {
      throw new Error(`無効な局面（FEN）です: ${err.message || err}`);
    }

    if (validator.isGameOver()) {
      return {
        fen,
        pvList: [],
        engineName: this.engineName,
        timeMs: 0,
      };
    }

    if (this.isBusy) {
      // If engine is currently busy with previous command, stop it
      try {
        this.engine.sendCommand('stop');
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    this.isBusy = true;
    const startTime = Date.now();

    return new Promise<PositionAnalysisResult>((resolve, reject) => {
      const pvMap = new Map<number, { depth: number; scoreCp?: number; mate?: number; moves: string[] }>();
      let bestMove = '';

      let timer: NodeJS.Timeout | null = setTimeout(() => {
        if (this.engine) {
          try {
            this.engine.sendCommand('stop');
          } catch {
            // ignore
          }
        }
        cleanup();
        reject(new Error('エンジン解析がタイムアウトしました'));
      }, timeoutMs);

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this.isBusy = false;
        if (this.engine) {
          this.engine.listener = () => {};
        }
      };

      this.engine.listener = (rawChunk: string) => {
        if (typeof rawChunk !== 'string') return;
        const lines = rawChunk.split(/\r?\n/);

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse: info depth 10 seldepth 14 multipv 1 score cp -20 ... pv e7e5 d2d4
          if (line.includes(' pv ')) {
            const depthMatch = line.match(/\bdepth (\d+)\b/);
            const multiPvMatch = line.match(/\bmultipv (\d+)\b/);
            const cpMatch = line.match(/\bscore cp (-?\d+)\b/);
            const mateMatch = line.match(/\bscore mate (-?\d+)\b/);
            const pvIndex = line.indexOf(' pv ');

            const currentDepth = depthMatch ? parseInt(depthMatch[1], 10) : 1;
            const multipv = multiPvMatch ? parseInt(multiPvMatch[1], 10) : 1;
            const movesStr = pvIndex !== -1 ? line.substring(pvIndex + 4).trim() : '';
            const moves = movesStr ? movesStr.split(/\s+/) : [];

            const existing = pvMap.get(multipv);
            if (!existing || currentDepth >= existing.depth) {
              pvMap.set(multipv, {
                depth: currentDepth,
                scoreCp: cpMatch ? parseInt(cpMatch[1], 10) : undefined,
                mate: mateMatch ? parseInt(mateMatch[1], 10) : undefined,
                moves,
              });
            }
          }

          if (line.includes('bestmove ')) {
            const match = line.match(/\bbestmove\s+(\S+)/);
            bestMove = match ? match[1] : '';
            cleanup();

            // Validate each PV using chess.js rules
            const pvList: PvAnalysis[] = [];
            const entries = Array.from(pvMap.entries()).sort(([a], [b]) => a - b);

            for (const [rank, item] of entries) {
              const tempChess = new Chess(fen);
              const sanMoves: string[] = [];
              let isLegal = true;

              for (const uciMove of item.moves) {
                try {
                  const from = uciMove.substring(0, 2);
                  const to = uciMove.substring(2, 4);
                  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

                  const moveResult = tempChess.move({ from, to, promotion });
                  if (moveResult) {
                    sanMoves.push(moveResult.san);
                  } else {
                    isLegal = false;
                    break;
                  }
                } catch {
                  isLegal = false;
                  break;
                }
              }

              pvList.push({
                rank,
                scoreCp: item.scoreCp,
                mate: item.mate,
                depth: item.depth,
                moves: item.moves,
                sanMoves,
                isLegal,
              });
            }

            // Convert best move to SAN if possible
            let bestMoveSan: string | undefined = undefined;
            if (bestMove && bestMove !== '(none)') {
              try {
                const tempChess = new Chess(fen);
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
                const result = tempChess.move({ from, to, promotion });
                if (result) bestMoveSan = result.san;
              } catch {
                // ignore
              }
            }

            resolve({
              fen,
              bestMove,
              bestMoveSan,
              pvList,
              engineName: this.engineName,
              timeMs: Date.now() - startTime,
            });
            return;
          }
        }
      };

      try {
        this.engine.sendCommand('stop');
        this.engine.sendCommand(`position fen ${fen}`);
        this.engine.sendCommand(`go depth ${depth}`);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }
}

export const stockfishManager = new StockfishManager();
