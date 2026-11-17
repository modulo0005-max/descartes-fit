import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../utils/audio';
import { Bell, Sparkles } from 'lucide-react';

interface PitBellProps {
  onRing: () => void;
  canFit: boolean;
  disabled?: boolean;
}

export const PitBell: React.FC<PitBellProps> = ({ onRing, canFit, disabled = false }) => {
  const [isRinging, setIsRinging] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsRinging(true);
    soundEngine.playBellRing();

    if (canFit) {
      // 핏 성공 시 폭죽 효과
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#e60012', '#fbbf24', '#3b82f6', '#10b981', '#a855f7'],
      });
    }

    onRing();

    setTimeout(() => {
      setIsRinging(false);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none my-3">
      {/* 3D 벨 받침대 & 황금 돔 */}
      <div className="relative flex items-center justify-center">
        {/* 황금 벨 후광 오라 (Halo) */}
        <div
          className={`absolute -inset-8 rounded-full blur-2xl transition duration-500 pointer-events-none ${
            canFit
              ? 'bg-amber-400/60 animate-pulse'
              : 'bg-amber-400/20 group-hover:bg-amber-400/35'
          }`}
        />

        {/* 3D 원형 원목/메탈 받침대 */}
        <div className="absolute -bottom-3 w-44 h-10 rounded-full bg-gradient-to-b from-[#8a7a63] via-[#5c4f3d] to-[#3a3022] shadow-[0_10px_20px_rgba(0,0,0,0.25)] border-2 border-[#b8a68b]" />

        {/* 황금 벨 본체 (150px 대형 3D 돔) */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          aria-label={canFit ? '데카르트 핏 종 치기 (승리 선언)' : '중앙 벨'}
          className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
            isRinging ? 'scale-90 translate-y-2' : 'hover:scale-105 active:scale-95 active:translate-y-2'
          } ${
            canFit
              ? 'bg-gradient-to-b from-[#fff3b0] via-[#ffd000] to-[#b38600] border-[#fff7c2] shadow-[0_12px_28px_rgba(255,200,0,0.45)] ring-8 ring-amber-400/60 animate-bounce'
              : 'bg-gradient-to-b from-[#ffea75] via-[#e6a800] to-[#996b00] border-[#ffe885] shadow-[0_10px_22px_rgba(0,0,0,0.25)]'
          }`}
        >
          {/* 상단 벨 손잡이/스프링 플런저 꼭지 */}
          <div className="absolute -top-4 w-10 h-6 bg-gradient-to-t from-[#c28f00] to-[#fff3b0] rounded-t-full shadow-md border-t border-[#fffbe0] flex items-center justify-center">
            <div className="w-4 h-2 bg-[#fffae0] rounded-full opacity-80" />
          </div>

          {/* 빛 반사 하이라이트 곡선 */}
          <div className="absolute top-3 left-6 w-12 h-6 bg-white/40 rounded-full rotate-[-25deg] blur-[1px] pointer-events-none" />

          {/* 벨 아이콘 */}
          <Bell
            className={`w-14 h-14 sm:w-16 sm:h-16 text-[#422900] transition-transform filter drop-shadow ${
              isRinging ? 'animate-bell-ring' : ''
            }`}
          />

          <span className="font-game text-base sm:text-lg font-black tracking-wider text-[#422900] mt-0.5 filter drop-shadow-xs">
            {canFit ? 'FIT!!' : 'BELL'}
          </span>
        </button>
      </div>

      {/* 스마트보드/원거리 시인성 대형 안내 리본 */}
      <div className="mt-6 text-center">
        <div
          className={`font-game text-base sm:text-xl px-6 py-2.5 rounded-2xl border-2 transition-all inline-flex items-center gap-2 ${
            canFit
              ? 'bg-amber-400 text-[#422900] border-[#b38600] ring-4 ring-amber-300/60 shadow-lg animate-pulse scale-105'
              : 'bg-white text-[#262626] border-[#dadada] shadow-sm'
          }`}
        >
          {canFit ? (
            <>
              <Sparkles size={20} className="text-white animate-spin" />
              <span>✨ 9장 세트 완성! 종을 쳐서 승리하세요! ✨</span>
            </>
          ) : (
            <>
              <span>🔔</span>
              <span>같은 함수 9장을 모아 종을 치세요!</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
