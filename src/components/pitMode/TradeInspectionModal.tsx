import React from 'react';
import { Modal } from '../common/Modal';
import { TradeReport } from '../../types/game';
import { FAMILY_METAS, PROPERTY_LABELS } from '../../data/functionCards';
import { CartesianCanvas } from '../common/CartesianCanvas';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface TradeInspectionModalProps {
  report: TradeReport | null;
  onConfirm: () => void;
}

export const TradeInspectionModal: React.FC<TradeInspectionModalProps> = ({
  report,
  onConfirm,
}) => {
  if (!report) return null;

  return (
    <Modal
      isOpen={!!report}
      onClose={onConfirm}
      title="🤝 카드 교환 성사! 새로 획득한 함수 탐구"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-[#484848] select-none">
        {/* 상단 안내 바: 시간 멈춤 고지 */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#e60012] shrink-0" />
            <div>
              <span className="font-bold text-amber-950 block">
                수학적 학습을 위해 교환소 타이머가 일시 정지되었습니다!
              </span>
              <span className="text-[#727272]">
                새로 획득한 함수의 식과 그래프, 수학적 성질(꼭짓점, 절편, 점근선 등)을 차분히 확인하세요.
              </span>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 font-bold text-[11px]">
            ⏱️ 일시정지 중
          </span>
        </div>

        {/* 메인 교환 비교 뷰 (보낸 카드 ➔ 맞교환 ➔ 받은 카드) */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* 1. 내가 보낸 카드 (4열) */}
          <div className="md:col-span-5 bg-[#f8f8f8] border border-[#dadada] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#dadada]">
              <span className="text-xs font-bold text-[#727272] flex items-center gap-1.5">
                <span className="text-base">📤</span> 내가 보낸 카드 ({report.givenCards.length}장)
              </span>
              <span className="text-[11px] text-[#727272]">
                상대: {report.partnerAvatar} {report.partnerName}
              </span>
            </div>

            <div className="space-y-2">
              {report.givenCards.map((card) => {
                const meta = FAMILY_METAS[card.family];
                return (
                  <div
                    key={card.id}
                    className="p-2.5 rounded-xl bg-white border border-[#dadada] shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
                        {meta.name}
                      </span>
                      <span className="text-[10px] text-[#727272] font-mono">{card.id}</span>
                    </div>
                    <div className="font-mono text-base font-bold text-[#111827]">
                      {card.expression}
                    </div>
                    <div className="text-[11px] text-[#727272]">{card.title}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 중앙 화살표 아이콘 (1열) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-[#e60012] text-white flex items-center justify-center shadow-md animate-pulse">
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <Layers className="w-5 h-5 md:hidden" />
            </div>
            <span className="text-[10px] font-bold text-[#e60012] mt-1">맞교환</span>
          </div>

          {/* 2. 내가 새로 받은 카드 (5열) - 대형 그래프 및 고1 수학적 성질 강조 */}
          <div className="md:col-span-5 bg-red-50/40 border-2 border-[#e60012]/40 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-red-200">
              <span className="text-xs font-bold text-[#e60012] flex items-center gap-1.5">
                <Sparkles size={14} />
                <span className="text-base">📥</span> 새로 획득한 카드 ({report.receivedCards.length}장)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#e60012]">
                내 손패로 영입!
              </span>
            </div>

            <div className="space-y-3">
              {report.receivedCards.map((card) => {
                const meta = FAMILY_METAS[card.family];
                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-xl bg-white border border-[#dadada] shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeBg}`}>
                        {meta.name}
                      </span>
                      <span className="text-xs font-bold text-[#111827]">{card.title}</span>
                    </div>

                    {/* 수식 대형 표기 */}
                    <div className="font-mono text-lg font-black text-[#111827] text-center bg-[#f8f8f8] py-1.5 rounded-lg border border-[#dadada]">
                      {card.expression}
                    </div>

                    {/* 직교 좌표평면 그래프 시각화 */}
                    <div className="flex justify-center my-1">
                      <CartesianCanvas
                        card={card}
                        width={220}
                        height={130}
                        showPoints={true}
                      />
                    </div>

                    {/* 고1 핵심 수학적 특징 안내 */}
                    <div className="space-y-1 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between text-[#484848]">
                        <span className="font-bold text-[#727272]">정의역·치역:</span>
                        <span className="font-mono text-[10px]">{card.features.domainStr}</span>
                      </div>

                      {card.features.intercepts && (
                        <div className="flex items-center justify-between text-[#484848]">
                          <span className="font-bold text-[#727272]">절편 특성:</span>
                          <span className="font-medium">{card.features.intercepts}</span>
                        </div>
                      )}

                      {card.features.symmetry && (
                        <div className="flex items-center justify-between text-[#484848]">
                          <span className="font-bold text-[#727272]">대칭성:</span>
                          <span className="font-medium text-[#e60012]">{card.features.symmetry}</span>
                        </div>
                      )}

                      {card.features.asymptotes && (
                        <div className="flex items-center justify-between text-[#484848]">
                          <span className="font-bold text-[#727272]">점근선:</span>
                          <span className="font-medium text-emerald-700">{card.features.asymptotes}</span>
                        </div>
                      )}
                    </div>

                    {/* 성질 태그 목록 */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {card.properties.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#484848] border border-[#dadada]"
                        >
                          {PROPERTY_LABELS[tag]?.label || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 데카르트의 지도 조언 및 수집 진행 상태 */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs leading-relaxed">
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-blue-950 mb-0.5 flex items-center gap-1.5">
              <span>💡 데카르트의 교육적 조언</span>
              <span className="font-normal text-blue-700">
                (현재 주력 계열: {report.targetFamily ? FAMILY_METAS[report.targetFamily].name : '탐색중'} {report.dominantCount}/9장 모음)
              </span>
            </div>
            <div className="text-blue-900 font-medium">{report.comment}</div>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onConfirm}
            className="btn-nintendo-red w-full sm:w-auto px-10 py-3.5 font-game text-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <CheckCircle2 size={22} />
            <span>수학적 원리 확인 완료 (거래 계속하기)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
