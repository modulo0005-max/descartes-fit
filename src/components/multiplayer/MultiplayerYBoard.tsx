import React, { useState } from 'react';
import { useMultiplayerGame, BATTLE_CONDITIONS } from '../../hooks/useMultiplayerGame';
import { Card } from '../common/Card';
import { CardDetailModal } from '../common/CardDetailModal';
import { FunctionCard } from '../../types/math';
import {
  Swords,
  LogOut,
  Users,
  Trophy,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react';

interface MultiplayerYBoardProps {
  multiplayer: ReturnType<typeof useMultiplayerGame>;
  onLeave: () => void;
}

export const MultiplayerYBoard: React.FC<MultiplayerYBoardProps> = ({
  multiplayer,
  onLeave,
}) => {
  const { roomState, submitCardY } = multiplayer;
  const [selectedCard, setSelectedCard] = useState<FunctionCard | null>(null);
  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);

  const yState = roomState.yState;
  const round = yState?.round ?? 1;
  const conditionIndex = yState?.conditionIndex ?? 0;
  const condition = BATTLE_CONDITIONS[conditionIndex] || BATTLE_CONDITIONS[0];
  const hasSubmitted = yState?.hasSubmitted ?? false;
  const roundResult = yState?.roundResult ?? null;
  const scores = yState?.scores ?? {};

  // 선택된 카드의 현재 조건 평가값 계산
  let previewValue: number | null = null;
  if (selectedCard) {
    try {
      previewValue = condition.evaluatorFn(selectedCard);
    } catch {
      previewValue = null;
    }
  }

  const handleSubmit = () => {
    if (!selectedCard || hasSubmitted) return;
    submitCardY(selectedCard);
    setSelectedCard(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 select-none">
      {/* 1. 상단 헤더 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e60012] flex items-center justify-center text-white font-game text-2xl shadow-md border-b-4 border-[#99000c]">
            ⚔️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-game text-xl sm:text-2xl font-black text-[#111827]">
                데카르트 Y 실시간 대전
              </span>
              <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-lg bg-red-100 text-[#e60012] border border-red-200 tracking-wider">
                ROOM: {roomState.roomId}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  roomState.role === 'host'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {roomState.role === 'host' ? '선생님 (호스트)' : '학생 (참가자)'}
              </span>
            </div>
            <div className="text-xs text-[#727272] flex items-center gap-2 mt-0.5">
              <span className="font-bold text-[#e60012] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                좌표 함숫값 크기 배틀 (총 5라운드)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold">
                <Users size={14} className="text-[#e60012]" />
                참여 플레이어 {roomState.players.length}명
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dadada] bg-white hover:bg-red-50 hover:border-red-300 text-xs font-bold text-[#727272] hover:text-[#e60012] transition"
        >
          <LogOut size={15} />
          <span>방 나가기</span>
        </button>
      </div>

      {/* 2. 라운드 미션 & 스코어보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 미션 조건 배너 (2열) */}
        <div className="md:col-span-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-md flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0 border border-white/30">
            🎯
          </div>
          <div>
            <div className="text-xs font-black tracking-wider uppercase opacity-90">
              ROUND {round} / 5
            </div>
            <h2 className="font-game text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              {condition.title}
            </h2>
            <p className="text-xs text-white/90 mt-1 font-medium">
              {condition.desc}
            </p>
          </div>
        </div>

        {/* 실시간 플레이어 스코어 현황 (1열) */}
        <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-black text-[#857b70] uppercase tracking-wider flex items-center gap-1 mb-2">
            <Trophy size={14} className="text-[#e60012]" />
            <span>실시간 누적 스코어</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-24">
            {roomState.players.map((p) => {
              const score = scores[p.peerId] || 0;
              return (
                <div
                  key={p.peerId}
                  className="flex items-center justify-between text-xs font-bold p-1.5 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{p.avatar}</span>
                    <span>{p.name} {p.peerId === roomState.myPeerId && '(나)'}</span>
                  </span>
                  <span className="font-game font-black text-sm text-[#e60012]">
                    {score}승
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 중앙 배틀 아레나 (제출 대기 중 vs 라운드 결과 발표) */}
      <div className="game-board-mat p-4 sm:p-6 rounded-3xl border-2 border-[#ded8cf] shadow-sm">
        {roundResult ? (
          /* 라운드 결과 공개 뷰 */
          <div className="text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e60012] text-white font-game text-sm font-black shadow-md">
              <Sparkles size={16} />
              <span>라운드 {roundResult.round} 출전 카드 전원 공개!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center max-w-5xl mx-auto">
              {roundResult.submissions.map((sub) => {
                const isWinner = sub.peerId === roundResult.winnerPeerId;
                return (
                  <div
                    key={sub.peerId}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      isWinner
                        ? 'bg-amber-50 border-amber-400 shadow-xl ring-4 ring-amber-300 scale-105'
                        : 'bg-white border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{sub.avatar}</span>
                      <span className="font-game font-bold text-sm text-[#111827]">
                        {sub.name}
                      </span>
                      {isWinner && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">
                          🏆 라운드 승!
                        </span>
                      )}
                    </div>

                    <div className="w-full">
                      <Card
                        card={sub.card}
                        size="sm"
                        selectable={false}
                        showProperties={false}
                      />
                    </div>

                    <div className="mt-3 w-full py-1.5 rounded-xl bg-gray-100 text-center font-game font-black text-sm">
                      {sub.value !== null ? (
                        <span className="text-[#e60012]">
                          f({condition.xValue}) = {sub.value}
                        </span>
                      ) : (
                        <span className="text-gray-400">정의되지 않음</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs font-bold text-[#727272] animate-pulse">
              잠시 후 다음 라운드로 자동으로 진행됩니다...
            </div>
          </div>
        ) : (
          /* 출전 카드 제출 진행 중 뷰 */
          <div className="text-center py-6 space-y-4">
            <h3 className="font-game text-lg font-black text-[#111827] flex items-center justify-center gap-2">
              <Swords size={20} className="text-[#e60012]" />
              <span>이번 라운드에 출전시킬 카드를 선택하세요</span>
            </h3>

            {hasSubmitted ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xl shadow">
                  <Check size={24} />
                </div>
                <div className="font-game font-black text-emerald-800 text-base">
                  출전 카드 제출 완료!
                </div>
                <p className="text-xs text-emerald-700">
                  다른 플레이어들이 카드를 제출할 때까지 잠시만 기다려 주세요.<br />
                  모두 제출하면 동시에 카드가 오픈됩니다!
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white/70 border border-[#dadada] rounded-2xl max-w-md mx-auto text-xs text-[#727272] flex items-center justify-center gap-2">
                <Clock size={16} className="text-amber-500 shrink-0" />
                <span>
                  아래 손패에서 가장 큰 함숫값을 가질 것 같은 카드를 고른 후 <strong>[출전하기]</strong>를 누르세요.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 내 손패 및 출전 결정 바 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#dadada]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roomState.myAvatar}</span>
            <span className="font-game text-lg font-black text-[#111827]">
              내 손패 ({roomState.myHand.length}장 남음)
            </span>
          </div>

          {/* 출전 확정 버튼 */}
          {!hasSubmitted && selectedCard && (
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-[#484848]">
                예상 값:{' '}
                <strong className="text-[#e60012] font-mono text-sm">
                  f({condition.xValue}) = {previewValue !== null ? previewValue : '미정의'}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-nintendo-red px-6 py-2.5 text-sm font-game font-black cursor-pointer shadow-md"
              >
                ⚔️ 이 카드로 출전하기!
              </button>
            </div>
          )}
        </div>

        {/* 손패 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {roomState.myHand.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            return (
              <div
                key={card.id}
                className={`relative transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-4 ring-[#e60012] rounded-2xl transform -translate-y-2 shadow-lg'
                    : 'hover:-translate-y-1'
                } ${hasSubmitted ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {isSelected && (
                  <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-[#e60012] text-white font-game text-[10px] font-black shadow">
                    출전 선택됨
                  </span>
                )}
                <Card
                  card={card}
                  size="sm"
                  selected={isSelected}
                  selectable={!hasSubmitted}
                  onSelect={() => setSelectedCard(card)}
                  onInspect={(c) => setInspectedCard(c)}
                  showProperties={true}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 카드 상세 모달 */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* 게임 오버 승리 팝업 */}
      {roomState.status === 'game_over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#e60012] p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <h2 className="font-game text-3xl font-black text-[#111827]">
              5라운드 배틀 최종 우승!
            </h2>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-[#e60012]">
              🎉 <strong>{roomState.winner}</strong> 님이 최종 승리를 차지했습니다!
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onLeave}
                className="btn-nintendo-red w-full py-3 text-base font-game font-black cursor-pointer"
              >
                로비로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
