import React, { useState } from 'react';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import { Card } from '../common/Card';
import { CardDetailModal } from '../common/CardDetailModal';
import { DescartesXJustificationModal } from '../descartesX/DescartesXJustificationModal';
import { FunctionCard } from '../../types/math';
import {
  Layers,
  LogOut,
  Users,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface MultiplayerXBoardProps {
  multiplayer: ReturnType<typeof useMultiplayerGame>;
  onLeave: () => void;
}

export const MultiplayerXBoard: React.FC<MultiplayerXBoardProps> = ({
  multiplayer,
  onLeave,
}) => {
  const { roomState, playCardX, drawCardX } = multiplayer;
  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);
  const [justificationCandidate, setJustificationCandidate] = useState<FunctionCard | null>(null);

  const xState = roomState.xState;
  const topCard = xState?.topCard || null;
  const isMyTurn = xState?.currentTurnPeerId === roomState.myPeerId;
  const currentTurnPlayer = roomState.players.find(
    (p) => p.peerId === xState?.currentTurnPeerId
  );

  // 나를 제외한 상대 플레이어들
  const otherPlayers = roomState.players.filter(
    (p) => p.peerId !== roomState.myPeerId
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 select-none">
      {/* 1. 상단 헤더 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e60012] flex items-center justify-center text-white font-game text-2xl shadow-md border-b-4 border-[#99000c]">
            🃏
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-game text-xl sm:text-2xl font-black text-[#111827]">
                데카르트 X 실시간 대전
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
                공통 성질 털기 (원카드·우노 룰)
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

      {/* 2. 대전 상황판 & 상대 플레이어 현황 */}
      <div className="game-board-mat p-4 sm:p-6 rounded-3xl border-2 border-[#ded8cf] shadow-sm space-y-6">
        {/* 상대방 카드 잔여 장수 포디움 */}
        <div>
          <div className="text-xs font-black text-[#857b70] uppercase tracking-wider mb-2">
            상대 플레이어 남은 카드
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {otherPlayers.map((player) => {
              const cardCount =
                xState?.playerCardCounts.find((p) => p.peerId === player.peerId)
                  ?.count ?? 5;
              const isHisTurn = xState?.currentTurnPeerId === player.peerId;

              return (
                <div
                  key={player.peerId}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                    isHisTurn
                      ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-200 scale-105'
                      : 'bg-white border-[#dadada] shadow-xs'
                  }`}
                >
                  <span className="text-3xl">{player.avatar}</span>
                  <div>
                    <div className="font-game font-bold text-sm text-[#111827] flex items-center gap-1">
                      <span>{player.name}</span>
                      {player.isHost && (
                        <span className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.2 rounded font-bold">
                          방장
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#727272] flex items-center gap-1.5">
                      <span>남은 카드:</span>
                      <strong
                        className={`text-sm ${
                          cardCount === 1
                            ? 'text-red-600 animate-bounce'
                            : 'text-[#111827]'
                        }`}
                      >
                        {cardCount}장
                      </strong>
                      {cardCount === 1 && (
                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black">
                          🚨 라스트 1장!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 턴 알림 배너 */}
        <div
          className={`p-4 rounded-2xl border-2 text-center font-game transition ${
            isMyTurn
              ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-md animate-pulse'
              : 'bg-white/80 border-[#dadada] text-[#484848]'
          }`}
        >
          {isMyTurn ? (
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-black">
              <Sparkles size={20} className="text-amber-600" />
              <span>
                🎯 내 차례입니다! 바닥 카드와 같은 성질(또는 같은 계열)을 가진 카드를 클릭하세요.
              </span>
            </div>
          ) : (
            <div className="text-sm font-bold flex items-center justify-center gap-2">
              <span>⏳</span>
              <span>
                <strong>{currentTurnPlayer?.name || '상대방'}</strong> 님의 차례입니다... 카드를 내거나 덱에서 1장을 뽑기를 기다리는 중입니다.
              </span>
            </div>
          )}
        </div>

        {/* 중앙 매트: 덱 더미 vs 바닥 오픈 카드 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
          {/* 드로우 덱 (뽑는 카드 더미) */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={drawCardX}
              disabled={!isMyTurn}
              className={`w-44 h-60 rounded-2xl border-4 flex flex-col items-center justify-center gap-3 transition cursor-pointer ${
                isMyTurn
                  ? 'bg-gradient-to-br from-[#e60012] to-[#b3000e] text-white border-white shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw size={32} className={isMyTurn ? 'animate-spin' : ''} />
              <div className="text-center">
                <div className="font-game font-black text-lg">카드 뽑기</div>
                <div className="text-xs font-bold opacity-80">
                  남은 덱: {xState?.deckCount ?? 0}장
                </div>
              </div>
            </button>
            <span className="text-xs font-bold text-[#727272]">
              낼 수 있는 카드가 없을 때 클릭
            </span>
          </div>

          {/* 바닥 카드 (Top Card) */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-black text-[#e60012] uppercase tracking-wider flex items-center gap-1">
              <Layers size={14} />
              <span>현재 바닥 카드 (여기에 맞춰 내세요)</span>
            </div>
            {topCard ? (
              <div className="transform scale-105 shadow-2xl rounded-2xl ring-4 ring-[#e60012]/30">
                <Card
                  card={topCard}
                  size="md"
                  selectable={false}
                  showProperties={false}
                  onInspect={(c) => setInspectedCard(c)}
                />
              </div>
            ) : (
              <div className="w-48 h-64 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                바닥 카드 없음
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 내 손패 영역 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dadada]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roomState.myAvatar}</span>
            <span className="font-game text-lg font-black text-[#111827]">
              내 손패 ({roomState.myHand.length}장)
            </span>
          </div>
          <div className="text-xs text-[#727272] flex items-center gap-1 font-bold">
            <HelpCircle size={14} className="text-[#e60012]" />
            <span>성질 태그 힌트 없음! 식과 그래프를 분석하여 카드를 터치하고 이유를 증명하세요.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {roomState.myHand.map((card) => {
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (isMyTurn) {
                    setJustificationCandidate(card);
                  }
                }}
                className={`relative transition-all ${
                  isMyTurn
                    ? 'transform hover:-translate-y-2 hover:shadow-lg cursor-pointer'
                    : 'opacity-70 cursor-not-allowed'
                }`}
              >
                <Card
                  card={card}
                  size="sm"
                  selectable={false}
                  onInspect={(c) => setInspectedCard(c)}
                  showProperties={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 수학적 이유 설명 모달 */}
      {justificationCandidate && topCard && (
        <DescartesXJustificationModal
          isOpen={true}
          onClose={() => setJustificationCandidate(null)}
          topCard={topCard}
          selectedCard={justificationCandidate}
          onConfirmSuccess={() => {
            playCardX(justificationCandidate);
            setJustificationCandidate(null);
          }}
        />
      )}

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
              배틀 종료!
            </h2>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-[#e60012]">
              🎉 <strong>{roomState.winner}</strong> 님이 손패를 모두 털어내어 승리했습니다!
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
