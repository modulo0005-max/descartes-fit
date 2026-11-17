import React from 'react';
import { FunctionCard } from '../../types/math';
import { FAMILY_METAS, PROPERTY_LABELS } from '../../data/functionCards';
import { CartesianCanvas } from './CartesianCanvas';
import { Info, Check } from 'lucide-react';

interface CardProps {
  card: FunctionCard;
  selected?: boolean;
  onSelect?: (card: FunctionCard) => void;
  onInspect?: (card: FunctionCard) => void;
  size?: 'sm' | 'md' | 'lg';
  selectable?: boolean;
  disabled?: boolean;
  showProperties?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  selected = false,
  onSelect,
  onInspect,
  size = 'md',
  selectable = true,
  disabled = false,
  showProperties = true,
}) => {
  const familyMeta = FAMILY_METAS[card.family];

  const canvasDimensions = {
    sm: { width: 145, height: 95 },
    md: { width: 195, height: 125 },
    lg: { width: 280, height: 175 },
  }[size];

  const handleCardClick = () => {
    if (disabled || !selectable) return;
    if (onSelect) onSelect(card);
  };

  const handleInspectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInspect) onInspect(card);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative group rounded-2xl p-3.5 transition-all duration-200 select-none bg-white border-2 ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-[#e2ded5]'
          : selectable
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-1'
          : ''
      } ${
        selected
          ? 'border-[#e60012] ring-3 ring-red-200 shadow-md'
          : 'border-[#e2ded5] hover:border-[#b3000e]/40'
      }`}
    >
      {/* 선택 표시기: 닌텐도 레드 체크 배지 */}
      {selected && (
        <div className="absolute -top-2.5 -right-2.5 z-10 w-7 h-7 rounded-full bg-[#e60012] text-white flex items-center justify-center font-bold shadow-md animate-bounce">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* 헤더: 계열 뱃지 및 인포 버튼 */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-game border shadow-2xs ${familyMeta.badgeBg}`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: familyMeta.color }}
          />
          {familyMeta.name}
        </span>

        {onInspect && (
          <button
            type="button"
            onClick={handleInspectClick}
            aria-label="상세 정보"
            className="p-1 rounded-full text-[#727272] hover:text-[#e60012] hover:bg-red-50 transition"
          >
            <Info size={14} />
          </button>
        )}
      </div>

      {/* 수식 표기: 호버 시 닌텐도 레드로 변화 (대형 20px Bold 타이포그래피) */}
      <div className="text-center my-1.5 px-2 py-1.5 rounded-xl bg-[#faf8f5] border border-[#e8e4db] shadow-inner">
        <div className="font-mono text-lg sm:text-xl font-black text-[#111827] group-hover:text-[#e60012] transition-colors tracking-tight truncate">
          {card.expression}
        </div>
        <div className="font-game text-xs text-[#727272] truncate mt-0.5">{card.title}</div>
      </div>

      {/* 직교 좌표평면 그래프: 호버 시 scale 1.05 확대 */}
      <div className="flex justify-center my-1 overflow-hidden rounded-md">
        <div className="transform group-hover:scale-105 transition-transform duration-200">
          <CartesianCanvas
            card={card}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            interactive={false}
            showPoints={true}
          />
        </div>
      </div>

      {/* 핵심 수학적 성질 태그 */}
      {showProperties && (
        <div className="mt-2 flex flex-wrap gap-1 justify-center max-w-[210px] mx-auto">
          {card.properties.slice(0, 2).map((prop) => (
            <span
              key={prop}
              className="text-[10px] px-1.5 py-0.5 rounded bg-nintendo-surfaceAlt text-nintendo-fg border border-nintendo-hairline truncate"
              title={PROPERTY_LABELS[prop]?.desc}
            >
              {PROPERTY_LABELS[prop]?.label}
            </span>
          ))}
          {card.properties.length > 2 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-nintendo-surface text-nintendo-muted border border-nintendo-hairline">
              +{card.properties.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
