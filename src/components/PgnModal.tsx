import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, BookOpen } from 'lucide-react';
import { SAMPLE_GAMES } from '../utils/chessUtils.ts';
import { SamplePgn } from '../types/chess.ts';

interface PgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPgn: (pgn: string) => { success: boolean; error?: string };
}

export const PgnModal: React.FC<PgnModalProps> = ({
  isOpen,
  onClose,
  onLoadPgn,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'paste' | 'file'>('samples');
  const [pastedPgn, setPastedPgn] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleApplyPgn = (pgnString: string) => {
    setErrorMsg(null);
    const result = onLoadPgn(pgnString);
    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'PGNの読み込みに失敗しました');
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setErrorMsg(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleApplyPgn(content);
      }
    };
    reader.onerror = () => {
      setErrorMsg('ファイルの読み取り中にエラーが発生しました');
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleApplyPgn(content);
      }
    };
    reader.onerror = () => {
      setErrorMsg('ファイルの読み取り中にエラーが発生しました');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              棋譜（PGN）の選択・読み込み
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              学習用のお手本棋譜を選ぶか、ご自身のPGN棋譜を取り込んで検討します。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-white">
          <button
            onClick={() => {
              setActiveTab('samples');
              setErrorMsg(null);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'samples'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            教材サンプル実戦譜
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMsg(null);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            テキスト貼り付け
          </button>
          <button
            onClick={() => {
              setActiveTab('file');
              setErrorMsg(null);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ファイルアップロード
          </button>
        </div>

        {/* Error notification if any */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'samples' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SAMPLE_GAMES.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleApplyPgn(game.pgn)}
                  className="group p-4 rounded-2xl border border-stone-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 mb-1.5">
                      {game.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-xs font-medium text-amber-600/90 mt-0.5">
                      {game.subtitle}
                    </p>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-mono">
                    <span>終局譜</span>
                    <span className="text-amber-600 font-semibold group-hover:translate-x-1 transition-transform">
                      この棋譜を開く →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-stone-700">
                PGN形式の棋譜テキストを入力してください:
              </label>
              <textarea
                value={pastedPgn}
                onChange={(e) => setPastedPgn(e.target.value)}
                placeholder={`[Event "Casual Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4 ...`}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-stone-50"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleApplyPgn(pastedPgn)}
                  disabled={!pastedPgn.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                >
                  棋譜を読み込む
                </button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                  dragOver
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                }`}
              >
                <div className="p-3 bg-stone-100 rounded-full text-stone-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    PGNファイルをここにドラッグ＆ドロップ
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    拡張子 .pgn または .txt に対応しています
                  </p>
                </div>
                <label className="mt-2 px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer shadow-xs transition-colors">
                  ファイルを選択
                  <input
                    type="file"
                    accept=".pgn,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
