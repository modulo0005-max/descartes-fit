import React, { useState } from 'react';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import { Card } from '../common/Card';
import { PitBell } from '../pitMode/PitBell';
import { CardDetailModal } from '../common/CardDetailModal';
import { FunctionCard } from '../../types/math';
import { FAMILY_METAS } from '../../data/functionCards';
import {
  Users,
  LogOut,
  ArrowRightLeft,
  Volume2,
  Clock,
  Layers,
} from 'lucide-react';

interface MultiplayerGameBoardProps {
  multiplayer: ReturnType<typeof useMultiplayerGame>;
  onLeave: () => void;
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  multiplayer,
  onLeave,
}) => {
  const {
    roomState,
    selectedCardIds,
    toggleSelectCard,
    broadcastOffer,
    cancelOffer,
    acceptTradeFromPeer,
    ringMultiplayerBell,
  } = multiplayer;

  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);

  // 내 손패에서 지배적인 계열 및 완성 여부 계산
  const hand = roomState.myHand;
  const familyCounts: Record<string, number> = {};
  hand.forEach((c) => {
    familyCounts[c.family] = (familyCounts[c.family] || 0) + 1;
  });

  const dominantFamilyEntry = Object.entries(familyCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const dominantFamily = dominantFamilyEntry ? dominantFamilyEntry[0] : null;
  const dominantCount = dominantFamilyEntry ? dominantFamilyEntry[1] : 0;
  const canFit = hand.length === 9 && dominantCount === 9;

  // 나를 제외한 상대 플레이어들
  const otherPlayers = roomState.players.filter(
    (p) => p.peerId !== roomState.myPeerId
  );

  // 내가 현재 외치고 있는 장수
  const myPlayerObj = roomState.players.find(
    (p) => p.peerId === roomState.myPeerId
  );
  const myCurrentOffer = myPlayerObj?.currentOfferCount;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 select-none">
      {/* 1. 상단 멀티플레이어 헤더 (룸코드, 역할, 인원, 나가기) */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e60012] flex items-center justify-center text-white font-game text-2xl shadow-md border-b-4 border-[#99000c]">
            📡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-game text-xl sm:text-2xl font-black text-[#111827]">
                교실 실시간 대전
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
              <span className="flex items-center gap-1 font-bold">
                <Users size={14} className="text-[#e60012]" />
                참여 학생 {roomState.players.length}명
              </span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">실시간 P2P WebRTC 연결 중</span>
            </div>
          </div>
        </div>

        {/* 내 상태 요약 및 나가기 버튼 */}
        <div className="flex items-center gap-3">
          {dominantFamily && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f5f2eb] border border-[#e0dad0] text-xs font-bold text-[#484848]">
              <Layers size={15} className="text-[#e60012]" />
              <span>
                최다 보유:{' '}
                <strong className="text-[#e60012]">
                  {FAMILY_METAS[dominantFamily as keyof typeof FAMILY_METAS]?.name || dominantFamily}
                </strong>{' '}
                ({dominantCount}/9장)
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dadada] bg-white hover:bg-red-50 hover:border-red-300 text-xs font-bold text-[#727272] hover:text-[#e60012] transition"
          >
            <LogOut size={15} />
            <span>방 나가기</span>
          </button>
        </div>
      </div>

      {/* 2. 교실 거래소 매트 (상대방 포디움 + 중앙 황금 피트 벨 + 실시간 시장 로그) */}
      <div className="game-board-mat p-4 sm:p-6 rounded-3xl border-2 border-[#ded8cf] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* 좌측 3열: 교환 상대방 포디움 & 중앙 황금 벨 */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
            {/* 상대 플레이어 거래 포디움 */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black text-[#857b70] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft size={14} className="text-[#e60012]" />
                  교실 거래 상대 ({otherPlayers.length}명)
                </span>
                <span className="text-xs text-[#857b70]">
                  상대방이 외친 장수와 동일한 수의 카드를 선택하고 [맞교환]을 누르세요.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherPlayers.map((player) => {
                  const hasOffer = typeof player.currentOfferCount === 'number';
                  const offerMatchesMySelection =
                    hasOffer && selectedCardIds.length === player.currentOfferCount;

                  return (
                    <div
                      key={player.peerId}
                      className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        hasOffer
                          ? 'bg-white border-[#e60012] shadow-md ring-2 ring-red-100'
                          : 'bg-white/80 border-[#dadada] shadow-xs'
                      }`}
                    >
                      {/* 외침 말풍선 (Speech Bubble) */}
                      <div className="h-14 flex items-center justify-center w-full">
                        {hasOffer ? (
                          <div className="game-speech-bubble px-3 py-1.5 text-center animate-bounce">
                            <span className="font-game text-sm sm:text-base font-black text-[#e60012]">
                              📢 &ldquo;{player.currentOfferCount}장 교환!&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#999] font-medium flex items-center gap-1">
                            <Clock size={13} />
                            카드 살피는 중...
                          </span>
                        )}
                      </div>

                      {/* 캐릭터 아바타 및 이름 */}
                      <div className="flex flex-col items-center my-2">
                        <div className="relative text-3xl sm:text-4xl filter drop-shadow-sm mb-1">
                          {player.avatar}
                          {player.isHost && (
                            <span className="absolute -top-1 -right-2 text-xs">👑</span>
                          )}
                        </div>
                        <div className="font-game font-bold text-sm text-[#111827]">
                          {player.name}
                        </div>
                        <div className="text-[11px] text-[#727272] font-medium">
                          손패: {player.cardCount || 9}장
                        </div>
                      </div>

                      {/* 맞교환 실행 버튼 */}
                      <div className="w-full mt-2">
                        {hasOffer ? (
                          <button
                            type="button"
                            onClick={() => acceptTradeFromPeer(player.peerId)}
                            disabled={!offerMatchesMySelection}
                            className={`w-full py-2 px-3 rounded-xl font-game text-xs font-black flex items-center justify-center gap-1.5 transition ${
                              offerMatchesMySelection
                                ? 'bg-[#e60012] text-white shadow-md hover:bg-[#c90010] active:scale-95 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            <ArrowRightLeft size={14} />
                            <span>
                              {offerMatchesMySelection
                                ? `🤝 ${player.currentOfferCount}장 맞교환!`
                                : `내 카드 ${player.currentOfferCount}장 선택 필요`}
                            </span>
                          </button>
                        ) : (
                          <div className="py-2 text-center text-[11px] text-[#aaa]">
                            외침 대기 중
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 중앙 황금 피트 벨 (데카르트 핏 종 치기) */}
            <div className="flex flex-col items-center justify-center py-4 bg-white/60 rounded-3xl border border-[#e0dad0]">
              <PitBell onRing={ringMultiplayerBell} canFit={canFit} />
              <div className="mt-2 text-center">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-game font-black tracking-wide ${
                    canFit
                      ? 'bg-amber-400 text-amber-950 animate-bounce shadow-md'
                      : 'bg-[#edeae2] text-[#727272]'
                  }`}
                >
                  {canFit
                    ? '🎉 9장 완성! 지금 종을 쳐서 승리하세요!'
                    : '🔔 같은 함수 9장을 모아 종을 치세요!'}
                </span>
              </div>
            </div>
          </div>

          {/* 우측 1열: 실시간 교실 시장 로그 */}
          <div className="flex flex-col h-full bg-white rounded-2xl border-2 border-[#dadada] p-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-[#eee] mb-3 text-xs font-game font-black text-[#111827]">
              <Volume2 size={15} className="text-[#e60012]" />
              <span>실시간 시장 거래 로그</span>
            </div>

            <div className="flex-1 space-y-2 max-h-[380px] overflow-y-auto pr-1 text-xs">
              {roomState.logs.length === 0 ? (
                <div className="text-center py-8 text-[#aaa] text-xs">
                  거래 내역이 여기에 실시간으로 기록됩니다.
                </div>
              ) : (
                roomState.logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl text-[11px] leading-relaxed border ${
                      log.type === 'fit'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold animate-pulse'
                        : log.type === 'trade'
                        ? 'bg-red-50/70 border-red-200 text-[#99000c]'
                        : log.type === 'alert'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-gray-400 mr-1.5">
                      {log.time}
                    </span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 내 손패 및 호가(외치기) 액션 바 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e7eb] p-4 sm:p-6 shadow-sm space-y-4">
        {/* 상단 컨트롤: 내 정보 + 외치기 버튼 */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dadada]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{roomState.myAvatar}</span>
            <div>
              <div className="font-game text-base sm:text-lg font-black text-[#111827] flex items-center gap-2">
                <span>내 손패 ({hand.length}장)</span>
                {myCurrentOffer && (
                  <span className="text-xs font-game px-2.5 py-0.5 rounded-full bg-[#e60012] text-white">
                    현재 &ldquo;{myCurrentOffer}장 교환!&rdquo; 외침 중
                  </span>
                )}
              </div>
              <div className="text-xs text-[#727272]">
                같은 계열 카드를 1~3장 선택한 후 교환을 외치거나 상대방 오퍼를 수락하세요.
              </div>
            </div>
          </div>

          {/* 외치기 액션 버튼군 */}
          <div className="flex items-center gap-2">
            {myCurrentOffer ? (
              <button
                type="button"
                onClick={cancelOffer}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-game text-xs font-black transition border border-gray-300"
              >
                외치기 취소
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => broadcastOffer(selectedCardIds.length)}
                  disabled={selectedCardIds.length === 0 || selectedCardIds.length > 3}
                  className="btn-nintendo-red px-5 py-2.5 text-xs font-game font-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  📢 &ldquo;{selectedCardIds.length > 0 ? selectedCardIds.length : 1}장 교환!&rdquo; 외치기
                </button>
              </>
            )}
          </div>
        </div>

        {/* 손패 카드 9장 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
          {hand.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <div key={card.id} className="relative">
                <Card
                  card={card}
                  selected={isSelected}
                  onSelect={toggleSelectCard}
                  onInspect={(c) => setInspectedCard(c)}
                  size="sm"
                  showProperties={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 카드 상세 검사 모달 */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}

      {/* 5. 승리/게임오버 축하 팝업 */}
      {roomState.status === 'game_over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#e60012] p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <h2 className="font-game text-3xl font-black text-[#111827]">
              데카르트 핏 성사!
            </h2>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-[#e60012]">
              🎉 <strong>{roomState.winner}</strong> 님이 같은 함수 9장을 모두 모아 황금 종을 쳤습니다!
            </div>
            <p className="text-xs text-[#727272]">
              모든 학생이 함수의 수식, 그래프, 정의역/치역 성질을 완벽히 매칭하였습니다.
            </p>
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
