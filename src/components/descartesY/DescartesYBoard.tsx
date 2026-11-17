import React, { useState, useEffect, useCallback } from 'react';
import { FunctionCard, FunctionFamily } from '../../types/math';
import { FUNCTION_CARDS } from '../../data/functionCards';
import { Card } from '../common/Card';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy } from 'lucide-react';

interface DescartesYBoardProps {
  allowedFamilies?: FunctionFamily[];
}

interface BattleCondition {
  title: string;
  xValue: number;
  evaluatorFn: (card: FunctionCard) => number | null;
  desc: string;
}

const BATTLE_CONDITIONS: BattleCondition[] = [
  {
    title: 'x = 1 대입 함숫값 f(1) 배틀!',
    xValue: 1,
    evaluatorFn: (c) => c.evaluator(1),
    desc: '각 카드의 x에 1을 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
  },
  {
    title: 'x = 2 대입 함숫값 f(2) 배틀!',
    xValue: 2,
    evaluatorFn: (c) => c.evaluator(2),
    desc: '각 카드의 x에 2를 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
  },
  {
    title: 'y절편 f(0) 크기 배틀!',
    xValue: 0,
    evaluatorFn: (c) => c.evaluator(0),
    desc: 'y축과 만나는 교점의 y좌표(y절편)가 더 큰 쪽이 승리합니다.',
  },
  {
    title: 'x = -1 대입 함숫값 f(-1) 배틀!',
    xValue: -1,
    evaluatorFn: (c) => c.evaluator(-1),
    desc: '각 카드의 x에 -1을 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
  },
];

export const DescartesYBoard: React.FC<DescartesYBoardProps> = ({
  allowedFamilies = ['linear', 'quadratic', 'rational', 'irrational'],
}) => {
  const [playerHand, setPlayerHand] = useState<FunctionCard[]>([]);
  const [aiHand, setAiHand] = useState<FunctionCard[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [condition, setCondition] = useState<BattleCondition>(BATTLE_CONDITIONS[0]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [battleResult, setBattleResult] = useState<{
    playerCard: FunctionCard;
    aiCard: FunctionCard;
    playerVal: number | null;
    aiVal: number | null;
    winner: 'player' | 'ai' | 'tie';
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // 게임 시작 (각 5장 배분)
  const initGame = useCallback(() => {
    const pool = FUNCTION_CARDS.filter((c) => allowedFamilies.includes(c.family));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    setPlayerHand(shuffled.slice(0, 5));
    setAiHand(shuffled.slice(5, 10));
    setCurrentRound(1);
    setPlayerScore(0);
    setAiScore(0);
    setBattleResult(null);
    setIsGameOver(false);
    setCondition(BATTLE_CONDITIONS[Math.floor(Math.random() * BATTLE_CONDITIONS.length)]);
    soundEngine.playCardFlip();
  }, [allowedFamilies]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // 플레이어 카드 출전
  const handleSelectCard = (pCard: FunctionCard) => {
    if (battleResult || isGameOver) return;

    // AI 카드 1장 무작위 출전
    const aCard = aiHand[Math.floor(Math.random() * aiHand.length)];

    let pVal: number | null = null;
    let aVal: number | null = null;

    try {
      pVal = condition.evaluatorFn(pCard);
    } catch {
      pVal = null;
    }

    try {
      aVal = condition.evaluatorFn(aCard);
    } catch {
      aVal = null;
    }

    // null(정의역 밖)인 경우 -999 처리
    const compP = pVal !== null && isFinite(pVal) ? pVal : -999;
    const compA = aVal !== null && isFinite(aVal) ? aVal : -999;

    let roundWinner: 'player' | 'ai' | 'tie' = 'tie';
    if (compP > compA) {
      roundWinner = 'player';
      setPlayerScore((s) => s + 100);
      soundEngine.playCorrect();
    } else if (compA > compP) {
      roundWinner = 'ai';
      setAiScore((s) => s + 100);
      soundEngine.playWrong();
    } else {
      roundWinner = 'tie';
      soundEngine.playBellRing();
    }

    setBattleResult({
      playerCard: pCard,
      aiCard: aCard,
      playerVal: pVal,
      aiVal: aVal,
      winner: roundWinner,
    });

    setPlayerHand((prev) => prev.filter((c) => c.id !== pCard.id));
    setAiHand((prev) => prev.filter((c) => c.id !== aCard.id));
  };

  // 다음 라운드 진행
  const handleNextRound = () => {
    if (currentRound >= 5) {
      setIsGameOver(true);
      if (playerScore >= aiScore) {
        confetti({ particleCount: 150, spread: 90 });
      }
      return;
    }

    setCurrentRound((r) => r + 1);
    setBattleResult(null);
    setCondition(BATTLE_CONDITIONS[Math.floor(Math.random() * BATTLE_CONDITIONS.length)]);
    soundEngine.playCardFlip();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 text-[#484848]">
      {/* 상단 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#dadada] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-[#9333ea] font-black text-sm">
            DESCARTE Y
          </div>
          <div>
            <h2 className="text-xl font-black text-[#484848] flex items-center gap-2">
              데카르트 Y (좌표 함숫값 대소 배틀)
            </h2>
            <p className="text-xs text-[#727272]">
              제시된 특정 x 좌표에서 함숫값 f(x)이 더 높은 카드를 출전시켜 점수를 획득하세요! (총 5라운드)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f8f8f8] hover:bg-[#efefef] text-xs font-bold text-[#484848] border border-[#dadada] transition"
        >
          <RotateCcw size={14} /> 새 배틀 시작
        </button>
      </div>

      {/* 스코어보드 & 라운드 조건 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#f8f8f8] p-5 rounded-3xl border border-[#dadada]">
        <div className="text-center p-3 bg-white rounded-xl border border-[#dadada]">
          <span className="text-xs text-[#727272] font-bold block">내 점수</span>
          <span className="text-3xl font-black text-[#e60012] font-mono">{playerScore}점</span>
        </div>

        {/* 중앙 미션 조건 */}
        <div className="p-4 bg-gradient-to-r from-red-50 to-purple-50 rounded-2xl border-2 border-[#e60012] text-center">
          <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider block mb-1">
            ROUND {currentRound} / 5
          </span>
          <h3 className="text-lg font-black text-[#484848] mb-1">{condition.title}</h3>
          <p className="text-xs text-[#727272]">{condition.desc}</p>
        </div>

        <div className="text-center p-3 bg-white rounded-xl border border-[#dadada]">
          <span className="text-xs text-[#727272] font-bold block">오일러 (AI) 점수</span>
          <span className="text-3xl font-black text-[#484848] font-mono">{aiScore}점</span>
        </div>
      </div>

      {/* 최종 게임 오버 배너 */}
      {isGameOver ? (
        <div className="p-8 rounded-3xl bg-white border-2 border-[#e60012] text-center shadow-xl space-y-3">
          <Trophy size={56} className="mx-auto text-amber-500 animate-bounce" />
          <h3 className="text-3xl font-black text-[#484848]">
            {playerScore > aiScore ? '🎉 플레이어 최종 승리!' : playerScore === aiScore ? '무승부!' : '오일러 승리!'}
          </h3>
          <p className="text-base text-[#727272]">
            최종 스코어: 나 <strong>{playerScore}점</strong> vs 오일러 <strong>{aiScore}점</strong>
          </p>
          <button
            type="button"
            onClick={initGame}
            className="nintendo-btn-primary px-8 py-3 text-base font-bold"
          >
            배틀 다시 도전하기 ➔
          </button>
        </div>
      ) : battleResult ? (
        /* 라운드 배틀 결과 화면 */
        <div className="p-6 rounded-3xl bg-white border border-[#dadada] text-center space-y-4 animate-in zoom-in-95">
          <span className="text-xs font-bold text-[#e60012] uppercase tracking-wider block">
            BATTLE RESULT
          </span>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#727272] mb-1">내 카드</span>
              <Card card={battleResult.playerCard} size="md" selectable={false} />
              <span className="mt-2 text-lg font-black font-mono text-[#e60012]">
                f({condition.xValue}) = {battleResult.playerVal !== null ? battleResult.playerVal.toFixed(2) : '정의 안됨'}
              </span>
            </div>

            <div className="text-3xl font-black text-[#727272] my-auto">VS</div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#727272] mb-1">오일러 카드</span>
              <Card card={battleResult.aiCard} size="md" selectable={false} />
              <span className="mt-2 text-lg font-black font-mono text-[#484848]">
                f({condition.xValue}) = {battleResult.aiVal !== null ? battleResult.aiVal.toFixed(2) : '정의 안됨'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f8f8] max-w-md mx-auto text-sm font-bold text-[#484848]">
            {battleResult.winner === 'player'
              ? '✨ 내 함숫값이 더 높아 라운드 승리 (+100점)!'
              : battleResult.winner === 'ai'
                ? '오일러의 함숫값이 더 높아 패배했습니다.'
                : '함숫값이 동일하여 무승부입니다.'}
          </div>

          <button
            type="button"
            onClick={handleNextRound}
            className="nintendo-btn-primary px-6 py-2.5 text-sm font-bold"
          >
            {currentRound >= 5 ? '최종 결과 확인하기 ➔' : '다음 라운드로 ➔'}
          </button>
        </div>
      ) : (
        /* 카드 선택 화면 */
        <div className="bg-[#f8f8f8] p-5 rounded-3xl border border-[#dadada]">
          <div className="text-center mb-3">
            <h4 className="text-base font-bold text-[#484848]">
              {condition.title}에 가장 유리한 카드를 아래에서 1장 선택하세요!
            </h4>
            <span className="text-xs text-[#727272]">
              팁: x={condition.xValue}을 넣었을 때 가장 큰 값이 나오는 카드를 전략적으로 내보내세요.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {playerHand.map((card) => (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className="cursor-pointer hover:-translate-y-2 transition-all"
              >
                <Card card={card} size="sm" selectable={false} showProperties={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

