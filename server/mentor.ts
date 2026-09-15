import { GoogleGenAI } from '@google/genai';
import { Chess } from 'chess.js';
import { MentorExplanation, StepAnalysisData } from '../src/types/chess.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function generateMentorAdvice(params: {
  moveSan: string;
  turn: 'w' | 'b';
  stepData: StepAnalysisData;
  userHypothesis?: string;
}): Promise<MentorExplanation> {
  const { moveSan, turn, stepData, userHypothesis } = params;
  const ai = getAiClient();

  // Primary PVs and tactical flags
  const bestReply = stepData.after.pvList[0];
  const replyMoves = bestReply ? bestReply.sanMoves.slice(0, 4).join(' ') : '';
  const isCheck = stepData.tacticalFlags.isCheck;
  const isCheckmate = stepData.tacticalFlags.isCheckmate;

  if (ai) {
    try {
      const prompt = `あなたはチェスの初心者を温かく導く「先生AI」です。
目的は、最善手や評価値をただ丸暗記させることではなく、相手の狙いや警戒点、自分の手の問題点を理解し、次回は自分の頭で正しく判断できるようにすることです。

【局面・着手データ】
- プレイヤー手番: ${turn === 'w' ? '白' : '黒'}
- 指された手: ${moveSan}
- 王手（チェック）状態: ${isCheck ? 'あり' : 'なし'}
- 詰み（チェックメイト）状態: ${isCheckmate ? 'あり' : 'なし'}
- 相手の有力な応手（Stockfish検証済）: ${replyMoves || 'なし'}
- プレイヤーが考えたこの手の狙い: ${userHypothesis ? `「${userHypothesis}」` : '（無記入・まずは解説を希望）'}

【教育上の重要方針】
1. 悪い手と一方的に決めつけず、もし成立するならどんな条件が必要か、あるいはどんな具体的な不利益（駒損やキングの危険など）が生じるかを論理的に説明してください。
2. 相手の意図を断定せず、「〜の狙いが考えられます」「〜を警戒しておくと安心です」という表現を使ってください。
3. 難しい用語（ピン、フォーク、テンポ、ルフト、バックランク等）を使う場合は、初心者向けに短い解説を添えてください。
4. 以下のJSONフォーマットのみを厳密に出力してください（Markdownのコードブロック \`\`\`json も可）。

JSON出力スキーマ:
{
  "hint": "局面の直感的なヒント（1〜2文）",
  "caution": "まず警戒すべき最重要の危険（1文）",
  "threats": ["相手の狙い1", "相手の狙い2"],
  "targetFeasibility": "ユーザーの考えた狙いが成立するか、またはどのような前提が必要かの説明（2〜3文）",
  "detailedExplanation": "盤面の構造、駒の働き、この手の長所と短所の詳しい説明（3〜4文）",
  "concreteSteps": ["${replyMoves || '相手の応手手順'}"],
  "lessonPrinciple": "次回同じような場面で使える原則・教訓（格言や考え方）",
  "glossary": [
    {"term": "用語名", "explanation": "簡単な説明"}
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text) as MentorExplanation;
        if (parsed.hint && parsed.caution) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini API call error, falling back to rule-based mentor:', err);
    }
  }

  // Fallback intelligent mentor logic when API key is not present or failed
  return generateRuleBasedAdvice(moveSan, turn, stepData, userHypothesis);
}

/**
 * Intelligent rule-based mentor response grounded in engine PVs and chess mechanics.
 */
function generateRuleBasedAdvice(
  moveSan: string,
  turn: 'w' | 'b',
  stepData: StepAnalysisData,
  userHypothesis?: string
): MentorExplanation {
  const isCheckmate = stepData.tacticalFlags.isCheckmate;
  const isCheck = stepData.tacticalFlags.isCheck;
  const bestReply = stepData.after.pvList[0];
  const replySan = bestReply?.sanMoves[0] || '相手の手';
  const fullPvSan = bestReply?.sanMoves.slice(0, 4).join(' ') || '';

  // Checkmate scenario
  if (isCheckmate) {
    return {
      hint: 'キングへの攻撃が決まり、逃げ道のないチェックメイトの局面です。',
      caution: 'キングが完全に包囲されており、有効な合い駒や逃げ道がありません。',
      threats: ['キングの退路遮断と直接攻撃'],
      targetFeasibility: '攻撃の狙いが完璧に成立し、勝負が決着しました。',
      detailedExplanation: `着手「${moveSan}」によりキングへの王手が防げない状態（チェックメイト）になりました。序盤からキング周辺のマス（特にf7やf2、あるいは最終段）の防備が手薄になったことが決定打となっています。`,
      concreteSteps: [moveSan],
      lessonPrinciple: 'キングの安全はチェスの最優先事項です。攻撃に気を取られず、王手をかけられたときの逃げ道を常に意識しましょう。',
      glossary: [
        { term: 'チェックメイト', explanation: 'キングへの王手を防ぐ手が一切ない詰みの状態' },
      ],
    };
  }

  // Check scenario
  if (isCheck) {
    return {
      hint: `相手キングに王手（${moveSan}）がかかっています。相手は必ず対応（逃げる・取る・合い駒）しなければなりません。`,
      caution: '相手が合い駒をした際、自分の駒が反撃に晒されないか確認しましょう。',
      threats: [`相手の反撃手: ${replySan}`],
      targetFeasibility: userHypothesis
        ? `狙い「${userHypothesis}」について: 王手によって相手の動きを強制できていますが、次の合い駒や逃げ手に対してさらなる継続手があるか確認が必要です。`
        : '王手によって主導権を握っていますが、駒損なく優勢を維持できるかが焦点です。',
      detailedExplanation: `着手「${moveSan}」によって相手に即座の対応を迫っています。相手は「${fullPvSan}」のように受けに回る可能性が高い局面です。`,
      concreteSteps: bestReply ? [bestReply.sanMoves.join(' ')] : [replySan],
      lessonPrinciple: '王手（チェック）は強力ですが、有効な受け手がある場合は相手に駒の展開を進めさせてしまうこともあります。「目的のある王手」を心がけましょう。',
      glossary: [
        { term: '合い駒（インターポジション）', explanation: '王手された直線上に自分の駒を挟んで守る技術' },
      ],
    };
  }

  // Normal position advice based on engine reply
  const altMoves = stepData.before.pvList.slice(0, 2).map((p) => p.sanMoves[0]).filter(Boolean);

  return {
    hint: `着手「${moveSan}」によって盤面に変化が起きました。相手の最も有力な対抗策は「${replySan}」です。`,
    caution: `相手の「${replySan}」によって、自分のどのマスや駒が狙われる可能性があるか確認してください。`,
    threats: [
      `相手が「${replySan}」から狙ってくる展開筋`,
      '中央のマスや手番（テンポ）の主導権争い',
    ],
    targetFeasibility: userHypothesis
      ? `あなたの考えた狙い「${userHypothesis}」は自然な発想です。ただし相手の応手（${replySan}）に対して隙が生じていないかを合わせて考えることが上達の鍵になります。`
      : `この手は盤面を前進させる一着です。相手の応手（${replySan}）に対してどのような計画で対応するかを意識してみましょう。`,
    detailedExplanation: `着手「${moveSan}」のあと、Stockfishエンジンの検証では相手の応手として「${fullPvSan || replySan}」が有力な読み筋として挙がっています。指す前には他に「${altMoves.join(' や ') || '他の展開手'}」といった候補手も考えられる局面でした。`,
    concreteSteps: bestReply ? [bestReply.sanMoves.slice(0, 5).join(' ')] : [replySan],
    lessonPrinciple: '「自分の指したい手」だけでなく、「相手が次に一番指したい手」を一手予想してから指す習慣をつけましょう。',
    glossary: [
      { term: 'テンポ（手得）', explanation: '相手に無駄な対応を強いることで、自分だけ駒を有効に進める時間的利益のこと' },
      { term: '展開（ディベロップメント）', explanation: '初期位置の駒（特にナイトやビショップ）を中央に向けて活躍しやすい位置へ進めること' },
    ],
  };
}
