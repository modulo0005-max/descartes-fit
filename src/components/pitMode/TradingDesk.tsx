import React from 'react';
import { Player, FitSubRule } from '../../types/game';
import { RefreshCw, Sparkles, Layers } from 'lucide-react';

interface TradingDeskProps {
  players: Player[];
  playerOfferCount: number;
  onTradeWithBot: (botId: string) => void;
  canTrade: boolean;
  fitSubRule?: FitSubRule;
}

export const TradingDesk: React.FC<TradingDeskProps> = ({
  players,
  playerOfferCount,
  onTradeWithBot,
  canTrade,
  fitSubRule = 'classic',
}) => {
  const bots = players.filter((p) => !p.isHuman);

  // 무언(Silent) 모드 시 손가락 이모지 변환
  const getCalloutText = (count: number) => {
    if (fitSubRule === 'silent') {
      const emoji = count === 1 ? '👆' : count === 2 ? '✌️' : '🤟';
      return `${emoji} [무언] ${count}장!`;
    }
    return `📣 "${count}장 교환할 사람!!"`;
  };

  const getBotTheme = (idx: number) => {
    const themes = [
      { bg: 'bg-sky-50', border: 'border-sky-300', ring: 'ring-sky-200', text: 'text-sky-800', badge: 'bg-sky-600' },
      { bg: 'bg-amber-50', border: 'border-amber-300', ring: 'ring-amber-200', text: 'text-amber-800', badge: 'bg-amber-600' },
      { bg: 'bg-emerald-50', border: 'border-emerald-300', ring: 'ring-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-600' },
    ];
    return themes[idx % themes.length];
  };

  const gridColsClass =
    bots.length === 1
      ? 'grid-cols-1 max-w-sm'
      : bots.length === 2
        ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
        : 'grid-cols-1 md:grid-cols-3 max-w-5xl';

  return (
    <div className={`grid ${gridColsClass} gap-4 sm:gap-6 w-full mx-auto my-2 select-none`}>
      {bots.map((bot, idx) => {
        const theme = getBotTheme(idx);
        const isOffering = !!bot.currentTradeOffer;
        const offerCount = bot.currentTradeOffer?.count || 0;
        const isMatch = playerOfferCount > 0 && playerOfferCount === offerCount;

        return (
          <div
            key={bot.id}
            className={`relative p-5 rounded-3xl border-3 transition-all duration-200 flex flex-col items-center justify-between min-h-[220px] ${
              isMatch
                ? 'bg-red-50/70 border-[#e60012] shadow-xl ring-4 ring-red-200 scale-102'
                : 'bg-white border-[#e2ded5] shadow-sm hover:shadow-md'
            }`}
          >
            {/* 상단: 만화풍 대형 호가 말풍선 (Comic Speech Bubble) */}
            <div className="h-16 flex items-center justify-center w-full mb-2">
              {isOffering ? (
                <div
                  className={`game-speech-bubble px-4 py-2 font-game text-base sm:text-lg animate-bounce ${
                    isMatch
                      ? 'game-speech-bubble-match text-white font-black'
                      : 'text-[#262626]'
                  }`}
                >
                  <span className="filter drop-shadow-xs">{getCalloutText(offerCount)}</span>
                </div>
              ) : (
                <div className="text-xs text-[#8a857b] font-game italic bg-[#f7f5f0] px-4 py-1.5 rounded-full border border-[#e8e4db]">
                  카드를 고르는 중...
                </div>
              )}
            </div>

            {/* AI 캐릭터 포디움 (Nintendo Podiums) */}
            <div className="flex items-center gap-3.5 w-full justify-center my-1.5">
              <div className="relative">
                {/* 3D 원형 아바타 프레임 */}
                <div className={`w-16 h-16 rounded-2xl ${theme.bg} border-2 ${theme.border} flex items-center justify-center shadow-inner`}>
                  <span className="text-4xl filter drop-shadow-sm">{bot.avatar}</span>
                </div>
                {/* 보유 카드 장수 배지 */}
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#262626] text-white font-game text-xs font-black shadow-md flex items-center gap-0.5 border border-white">
                  <Layers size={11} />
                  <span>{bot.hand.length}장</span>
                </div>
              </div>

              <div className="text-left">
                <div className="font-game text-base text-[#111827] flex items-center gap-1">
                  <span>{bot.name}</span>
                </div>
                <div className="text-xs font-bold text-[#727272]">
                  스코어: <strong className="text-[#e60012]">{bot.score}승</strong>
                </div>
              </div>
            </div>

            {/* 오픈 핸드(초보자 멘토링) 모드 힌트 */}
            {fitSubRule === 'open_hand' && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 my-1">
                👀 수집 목표: {bot.targetFamily || '탐색중'}
              </div>
            )}

            {/* 하단 교환 액션 인터랙션 */}
            <div className="w-full mt-3">
              {isOffering && isMatch ? (
                <button
                  type="button"
                  disabled={!canTrade}
                  onClick={() => onTradeWithBot(bot.id)}
                  className="btn-nintendo-red w-full py-2.5 font-game text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <RefreshCw size={18} className="animate-spin" />
                  <Sparkles size={16} />
                  <span>{offerCount}장 맞교환하기!</span>
                </button>
              ) : isOffering ? (
                <div className="text-center font-bold text-xs text-[#727272] py-2 bg-[#faf8f5] rounded-xl border border-[#ebe7df]">
                  {playerOfferCount === 0
                    ? `내 손패에서 ${offerCount}장을 터치하세요`
                    : `선택 장수(${playerOfferCount}장) 불일치`}
                </div>
              ) : (
                <div className="text-center font-bold text-xs text-[#8a857b] py-2 bg-[#faf8f5] rounded-xl border border-[#ebe7df]">
                  호가 대기중
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
