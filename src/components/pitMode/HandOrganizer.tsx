import React from 'react';
import { FunctionCard, FunctionFamily } from '../../types/math';
import { Card } from '../common/Card';
import { FAMILY_METAS } from '../../data/functionCards';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

interface HandOrganizerProps {
  hand: FunctionCard[];
  selectedCardIds: string[];
  onToggleSelect: (card: FunctionCard) => void;
  onClearSelection: () => void;
  onInspect: (card: FunctionCard) => void;
  canFit: boolean;
  disabled?: boolean;
}

export const HandOrganizer: React.FC<HandOrganizerProps> = ({
  hand,
  selectedCardIds,
  onToggleSelect,
  onClearSelection,
  onInspect,
  canFit,
  disabled = false,
}) => {
  // 계열별 그룹핑 및 카운트
  const familyCounts = hand.reduce<Record<FunctionFamily, number>>((acc, card) => {
    acc[card.family] = (acc[card.family] || 0) + 1;
    return acc;
  }, {} as Record<FunctionFamily, number>);

  // 가장 많이 모은 계열
  const dominantFamily = Object.entries(familyCounts).sort(
    (a, b) => b[1] - a[1]
  )[0] as [FunctionFamily, number] | undefined;

  // 선택된 카드들의 계열 일치성 검증 (핏 규칙: 같은 종류끼리만 교환 가능)
  const selectedCards = hand.filter((c) => selectedCardIds.includes(c.id));
  const selectedFamilies = new Set(selectedCards.map((c) => c.family));
  const isHomogeneous = selectedFamilies.size <= 1;

  return (
    <div className="w-full bg-white border-3 border-[#e5dfd5] rounded-3xl p-6 shadow-sm">
      {/* 상단 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-[#f0ece1]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-game text-xl sm:text-2xl font-black text-[#111827]">
              내 손패 ({hand.length}장)
            </h3>
            {canFit ? (
              <span className="font-game flex items-center gap-1.5 text-sm font-black text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full border-2 border-amber-400 animate-pulse shadow-xs">
                <CheckCircle2 size={18} className="text-amber-600" />
                ✨ 9장 완성! 중앙 벨을 쳐서 승리하세요! ✨
              </span>
            ) : dominantFamily ? (
              <span className="text-sm font-bold text-[#484848]">
                주력 수집:{' '}
                <strong className="font-game text-base text-[#e60012] font-black">
                  {FAMILY_METAS[dominantFamily[0]].name} ({dominantFamily[1]}/9장)
                </strong>
              </span>
            ) : null}
          </div>
        </div>

        {/* 교환 선택 제어 */}
        <div className="flex items-center gap-2">
          {selectedCardIds.length > 0 && (
            <>
              <div
                className={`font-game text-sm px-4 py-1.5 rounded-full border-2 font-black flex items-center gap-2 shadow-xs ${isHomogeneous
                    ? 'bg-red-50 text-[#e60012] border-[#e60012]'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
              >
                {!isHomogeneous ? (
                  <>
                    <AlertCircle size={16} />
                    <span>서로 다른 종류는 함께 교환할 수 없습니다!</span>
                  </>
                ) : (
                  <span>선택 완료: {selectedCardIds.length}장 교환 제안 준비 완료!</span>
                )}
              </div>

              <button
                type="button"
                onClick={onClearSelection}
                className="nintendo-utility-pill flex items-center gap-1.5 text-xs"
              >
                <RotateCcw size={14} />
                <span>선택 취소</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 계열별 현황 바 */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {Object.entries(familyCounts).map(([fam, count]) => {
          const meta = FAMILY_METAS[fam as FunctionFamily];
          return (
            <div
              key={fam}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 shadow-2xs ${meta.badgeBg}`}
            >
              <span className="font-game text-sm">{meta.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/90 font-mono font-black border border-black/10">
                {count}장
              </span>
            </div>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {hand.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          return (
            <Card
              key={card.id}
              card={card}
              size="sm"
              selected={isSelected}
              onSelect={() => onToggleSelect(card)}
              onInspect={() => onInspect(card)}
              disabled={disabled}
              showProperties={false}
            />
          );
        })}
      </div>
    </div>
  );
};
