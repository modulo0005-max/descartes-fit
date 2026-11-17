import React from 'react';
import { FunctionCard } from '../../types/math';
import { FAMILY_METAS, PROPERTY_LABELS } from '../../data/functionCards';
import { Modal } from './Modal';
import { CartesianCanvas } from './CartesianCanvas';

interface CardDetailModalProps {
  card: FunctionCard | null;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
  if (!card) return null;

  const familyMeta = FAMILY_METAS[card.family];

  return (
    <Modal isOpen={!!card} onClose={onClose} title="함수 카드 정밀 분석 랩" maxWidth="2xl">
      <div className="space-y-6 text-[#484848] select-none">
        {/* 상단 헤더 정보 (닌텐도 라이트 뱃지 바) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#f8f8f8] border border-[#dadada]">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${familyMeta.badgeBg}`}
            >
              {familyMeta.name} ({familyMeta.nameEn})
            </span>
            <span className="text-xs text-[#727272] font-semibold">{familyMeta.curriculum}</span>
          </div>
          <div className="text-xs font-semibold text-[#484848]">
            기본형: <span className="font-mono text-[#e60012] font-black">{familyMeta.generalForm}</span>
          </div>
        </div>

        {/* 대형 인터랙티브 직교좌표계 캔버스 */}
        <div className="flex flex-col items-center bg-white border-2 border-[#e5e7eb] rounded-2xl p-4 shadow-sm">
          <div className="text-center mb-3">
            <h3 className="text-2xl font-black font-mono text-[#111827]">{card.expression}</h3>
            <p className="text-xs font-semibold text-[#727272] mt-0.5">{card.title}</p>
          </div>
          <div className="p-2 bg-[#fafafa] rounded-xl border border-[#e5e7eb]">
            <CartesianCanvas
              card={card}
              width={460}
              height={260}
              interactive={true}
              showPoints={true}
              className="w-full max-w-[460px] shadow-sm"
            />
          </div>
          <span className="text-xs font-semibold text-[#727272] mt-2">
            💡 캔버스 위로 마우스를 올리면 좌표 (x, y)를 실시간으로 추적합니다.
          </span>
        </div>

        {/* 함수의 수학적 특징 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
            <span className="text-[#111827] font-black block mb-1">정의역 및 치역</span>
            <div className="text-[#484848]">정의역: <strong className="font-mono">{card.features.domainStr}</strong></div>
            <div className="text-[#484848]">치역: <strong className="font-mono">{card.features.rangeStr}</strong></div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
            <span className="text-[#111827] font-black block mb-1">절편 및 대칭성</span>
            <div className="text-[#484848]">{card.features.intercepts || '특이 절편 없음'}</div>
            <div className="text-[#e60012] font-bold">
              {card.features.symmetry || '특정 대칭성 없음'}
            </div>
          </div>

          {card.features.asymptotes && (
            <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
              <span className="text-[#111827] font-black block mb-1">점근선 (Asymptotes)</span>
              <div className="text-emerald-700 font-mono font-bold">{card.features.asymptotes}</div>
            </div>
          )}

          {card.features.extrema && (
            <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
              <span className="text-[#111827] font-black block mb-1">
                {card.family === 'quadratic' ? '최댓값 / 최솟값 (꼭짓점)' : '극값 (Extrema)'}
              </span>
              <div className="text-[#e60012] font-mono font-bold">{card.features.extrema}</div>
            </div>
          )}
        </div>

        {/* 수학적 성질 태그 목록 */}
        <div>
          <span className="text-xs font-black text-[#111827] block mb-2">보유 수학적 성질</span>
          <div className="flex flex-wrap gap-2">
            {card.properties.map((prop) => (
              <div
                key={prop}
                className="px-3 py-1.5 rounded-xl bg-white text-[#484848] border-2 border-[#e5e7eb] text-xs flex flex-col shadow-2xs"
              >
                <span className="font-black text-[#111827]">
                  {PROPERTY_LABELS[prop]?.label}
                </span>
                <span className="text-[10px] text-[#727272]">
                  {PROPERTY_LABELS[prop]?.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
