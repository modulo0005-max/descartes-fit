import React, { useState, useEffect, useCallback } from 'react';
import { FunctionCard, FunctionFamily } from '../../types/math';
import { FUNCTION_CARDS } from '../../data/functionCards';
import { Card } from '../common/Card';
import { DescartesXJustificationModal } from './DescartesXJustificationModal';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Layers, RotateCcw, Trophy, ShieldCheck } from 'lucide-react';

interface DescartesXBoardProps {
  allowedFamilies?: FunctionFamily[];
}

export const DescartesXBoard: React.FC<DescartesXBoardProps> = ({
  allowedFamilies = ['linear', 'quadratic', 'rational', 'irrational'],
}) => {
  const [deck, setDeck] = useState<FunctionCard[]>([]);
  const [playerHand, setPlayerHand] = useState<FunctionCard[]>([]);
  const [aiHand, setAiHand] = useState<FunctionCard[]>([]);
  const [topCard, setTopCard] = useState<FunctionCard | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [log, setLog] = useState<string>('카드를 5장씩 나누어 가졌습니다. 바닥 카드와 공통 성질을 가진 카드를 내세요!');
  const [justificationCandidate, setJustificationCandidate] = useState<FunctionCard | null>(null);

  // 게임 초기화 (각자 5장씩 배분, 바닥 1장 오픈)
  const initGame = useCallback(() => {
    const pool = FUNCTION_CARDS.filter((c) => allowedFamilies.includes(c.family));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    const pHand = shuffled.slice(0, 5);
    const aHand = shuffled.slice(5, 10);
    const center = shuffled[10];
    const remainDeck = shuffled.slice(11);

    setPlayerHand(pHand);
    setAiHand(aHand);
    setTopCard(center);
    setDeck(remainDeck);
    setTurn('player');
    setIsGameOver(false);
    setWinner(null);
    setLog('게임 시작! 바닥 카드와 같은 성질(원점대칭, 대칭축, 점근선 등)을 가진 카드를 클릭하세요.');
    soundEngine.playCardFlip();
  }, [allowedFamilies]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // 두 카드가 공통 성질을 공유하는지 검사
  const checkHasCommonProperty = (c1: FunctionCard, c2: FunctionCard): boolean => {
    if (c1.family === c2.family) return true; // 같은 계열이면 언제든 낼 수 있음
    return c1.properties.some((p) => c2.properties.includes(p));
  };

  // 플레이어가 손패를 터치했을 때: 즉시 내지 않고 수학적 근거 제시 모달 오픈
  const handleClickHandCard = (card: FunctionCard) => {
    if (turn !== 'player' || isGameOver || !topCard) return;
    setJustificationCandidate(card);
  };

  // 수학적 근거 검증 성공 후 카드 내기 확정
  const handleConfirmPlayCard = (card: FunctionCard, reasonLabel: string) => {
    soundEngine.playTradeSuccess();
    const newHand = playerHand.filter((c) => c.id !== card.id);
    setPlayerHand(newHand);
    setTopCard(card);

    if (newHand.length === 0) {
      soundEngine.playCorrect();
      setIsGameOver(true);
      setWinner('플레이어');
      setLog(`🎉 축하합니다! [${reasonLabel}] 근거를 증명하고 손패를 모두 털어내어 승리했습니다!`);
      confetti({ particleCount: 150, spread: 90 });
      return;
    }

    setTurn('ai');
    setLog(`내가 [${reasonLabel}] 근거를 제시하고 [${card.expression}] 카드를 냈습니다! 오일러의 턴입니다.`);
  };

  // 덱에서 1장 뽑기
  const handleDrawCard = () => {
    if (turn !== 'player' || isGameOver) return;
    if (deck.length === 0) {
      setLog('덱이 모두 소진되어 차례를 넘깁니다.');
      setTurn('ai');
      return;
    }

    soundEngine.playCardFlip();
    const drawn = deck[0];
    setDeck((prev) => prev.slice(1));
    setPlayerHand((prev) => [...prev, drawn]);
    setTurn('ai');
    setLog(`낼 수 있는 카드가 없어 덱에서 1장을 뽑았습니다. 오일러의 턴입니다.`);
  };

  // AI 턴 자율 실행
  useEffect(() => {
    if (turn !== 'ai' || isGameOver || !topCard) return;

    const timer = setTimeout(() => {
      // 낼 수 있는 카드가 있는지 탐색
      const playable = aiHand.find((c) => checkHasCommonProperty(c, topCard));

      if (playable) {
        soundEngine.playTradeCall();
        const newAiHand = aiHand.filter((c) => c.id !== playable.id);
        setAiHand(newAiHand);
        setTopCard(playable);

        if (newAiHand.length === 0) {
          setIsGameOver(true);
          setWinner('오일러 (AI)');
          soundEngine.playBellRing();
          setLog('오일러가 손패를 모두 털어내어 승리했습니다!');
          return;
        }

        setTurn('player');
        setLog(`오일러가 [${playable.expression}] 카드를 냈습니다! 나의 턴입니다.`);
      } else {
        // AI도 낼 게 없으면 1장 뽑기
        if (deck.length > 0) {
          const drawn = deck[0];
          setDeck((prev) => prev.slice(1));
          setAiHand((prev) => [...prev, drawn]);
          setLog('오일러가 낼 카드가 없어 덱에서 1장을 뽑았습니다. 나의 턴입니다.');
        } else {
          setLog('오일러가 패스했습니다. 나의 턴입니다.');
        }
        setTurn('player');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [turn, isGameOver, aiHand, topCard, deck]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 text-[#484848]">
      {/* 상단 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#dadada] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-[#e60012] font-black text-sm">
            DESCARTE X
          </div>
          <div>
            <h2 className="text-xl font-black text-[#484848] flex items-center gap-2">
              데카르트 X (성질 털어내기 모드)
            </h2>
            <p className="text-xs text-[#727272]">
              바닥 카드와 <strong>같은 계열</strong>이거나 <strong>공통 성질(대칭성, 점근선, 증감)</strong>을 공유하는 카드를 1장씩 내려놓아 먼저 0장을 만드세요!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f8f8f8] hover:bg-[#efefef] text-xs font-bold text-[#484848] border border-[#dadada] transition"
        >
          <RotateCcw size={14} /> 새 게임 시작
        </button>
      </div>

      {/* 승리 배너 */}
      {isGameOver && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 border-2 border-[#e60012] text-center shadow-lg">
          <Trophy size={48} className="mx-auto text-amber-500 mb-2 animate-bounce" />
          <h3 className="text-2xl font-black text-[#e60012] mb-1">
            🎉 {winner} 승리!
          </h3>
          <p className="text-sm text-[#727272] mb-4">손패를 가장 먼저 모두 털어냈습니다.</p>
          <button
            type="button"
            onClick={initGame}
            className="nintendo-btn-primary px-6 py-2.5 text-sm font-bold"
          >
            다시 한 판 하기 ➔
          </button>
        </div>
      )}

      {/* 게임 경기장: 상단 AI 손패 수 / 중앙 바닥 카드 및 덱 / 하단 플레이어 손패 */}
      <div className="flex flex-col gap-5 p-6 rounded-3xl bg-[#f8f8f8] border border-[#dadada]">
        {/* 상단 오일러 (AI) 상태 */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#dadada]">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🎩</span>
            <div>
              <span className="font-bold text-sm text-[#484848] block">오일러 (AI)</span>
              <span className="text-xs text-[#727272]">남은 카드: <strong>{aiHand.length}장</strong></span>
            </div>
          </div>
          {turn === 'ai' && (
            <span className="text-xs font-bold text-[#e60012] px-3 py-1 bg-red-50 rounded-full border border-red-200 animate-pulse">
              오일러가 카드를 생각 중...
            </span>
          )}
        </div>

        {/* 중앙: 바닥 카드 & 드로우 덱 & 시스템 안내 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
          {/* 바닥 카드 (Discard Pile Top) */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#e60012] mb-1.5 uppercase tracking-wider">
              ▼ 현재 바닥 카드 (여기에 맞춰 내세요)
            </span>
            {topCard && (
              <div className="ring-4 ring-[#e60012] rounded-xl shadow-xl">
                <Card card={topCard} size="md" selectable={false} showProperties={false} />
              </div>
            )}
          </div>

          {/* 카드 뽑는 덱 (Draw Deck) */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#727272] mb-1.5">
              남은 카드 덱 ({deck.length}장)
            </span>
            <button
              type="button"
              onClick={handleDrawCard}
              disabled={turn !== 'player' || isGameOver}
              className="w-36 h-48 rounded-xl bg-gradient-to-br from-[#e60012] to-[#ac000d] text-white flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 border-2 border-white"
            >
              <Layers size={36} className="mb-2" />
              <span className="text-xs font-black tracking-wider">덱에서 1장 뽑기</span>
              <span className="text-[10px] opacity-80 mt-1">(낼 카드가 없을 때)</span>
            </button>
          </div>
        </div>

        {/* 상태 메시지 띠 */}
        <div className="p-3 rounded-xl bg-white border border-[#dadada] text-center text-xs font-bold text-[#484848]">
          📢 {log}
        </div>

        {/* 하단 내 손패 (클릭하여 내기) */}
        <div className="bg-white p-4 rounded-2xl border border-[#dadada]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#dadada]">
            <span className="font-bold text-sm text-[#484848] flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#e60012]" />
              내 손패 ({playerHand.length}장) - 성질 태그 힌트 없음 (스스로 식과 그래프를 분석하세요)
            </span>
            {turn === 'player' && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                내 턴입니다!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {playerHand.map((card) => {
              return (
                <div
                  key={card.id}
                  onClick={() => handleClickHandCard(card)}
                  className="cursor-pointer transition-all hover:-translate-y-2 hover:shadow-md"
                >
                  <Card card={card} size="sm" selectable={false} showProperties={false} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 수학적 이유 설명 모달 */}
      {justificationCandidate && topCard && (
        <DescartesXJustificationModal
          isOpen={true}
          onClose={() => setJustificationCandidate(null)}
          topCard={topCard}
          selectedCard={justificationCandidate}
          onConfirmSuccess={(reason) => {
            handleConfirmPlayCard(justificationCandidate, reason);
            setJustificationCandidate(null);
          }}
        />
      )}
    </div>
  );
};

