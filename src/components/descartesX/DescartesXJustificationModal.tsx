import React, { useState } from 'react';
import { FunctionCard, PropertyTag } from '../../types/math';
import { FAMILY_METAS } from '../../data/functionCards';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { soundEngine } from '../../utils/audio';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ReasonOption {
  id: string;
  type: 'family' | 'property';
  propertyTag?: PropertyTag;
  label: string;
  mathFormula: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    id: 'same_family',
    type: 'family',
    label: '동일 함수 계열',
    mathFormula: '두 카드가 같은 종류의 함수 식 (예: 둘 다 이차함수, 둘 다 유리함수 등)',
  },
  {
    id: 'origin_symmetry',
    type: 'property',
    propertyTag: 'origin_symmetry',
    label: '원점 대칭 (기함수 / Odd Function)',
    mathFormula: 'f(-x) = -f(x), (0, 0)을 중심으로 180° 회전대칭',
  },
  {
    id: 'y_axis_symmetry',
    type: 'property',
    propertyTag: 'y_axis_symmetry',
    label: 'y축 대칭 (우함수 / Even Function)',
    mathFormula: 'f(-x) = f(x), y축을 대칭축으로 좌우 선대칭',
  },
  {
    id: 'always_increasing',
    type: 'property',
    propertyTag: 'always_increasing',
    label: '실수 전체(또는 정의역)에서 항상 증가',
    mathFormula: 'x₁ < x₂ 일 때 항상 f(x₁) < f(x₂)',
  },
  {
    id: 'always_decreasing',
    type: 'property',
    propertyTag: 'always_decreasing',
    label: '실수 전체(또는 정의역)에서 항상 감소',
    mathFormula: 'x₁ < x₂ 일 때 항상 f(x₁) > f(x₂)',
  },
  {
    id: 'has_asymptote',
    type: 'property',
    propertyTag: 'has_asymptote',
    label: '점근선(Asymptote) 보유',
    mathFormula: 'x → ∞ 또는 분모=0 근처에서 어떤 직선에 한없이 가까워짐',
  },
  {
    id: 'passes_origin',
    type: 'property',
    propertyTag: 'passes_origin',
    label: '원점 (0, 0) 통과 (y절편이 0)',
    mathFormula: 'f(0) = 0 을 만족',
  },
  {
    id: 'has_max_or_min',
    type: 'property',
    propertyTag: 'has_max_or_min',
    label: '최댓값 또는 최솟값(꼭짓점) 존재',
    mathFormula: '포물선 꼭짓점에서 최댓값 또는 최솟값을 가짐 (고1)',
  },
  {
    id: 'limited_domain',
    type: 'property',
    propertyTag: 'limited_domain',
    label: '정의역 제한 있음 (불연속 또는 시작점 존재)',
    mathFormula: '분모 ≠ 0 또는 근호 안 ≥ 0 으로 인해 x 범위가 제한됨',
  },
  {
    id: 'all_real_domain',
    type: 'property',
    propertyTag: 'all_real_domain',
    label: '정의역이 모든 실수 ℝ',
    mathFormula: '정의되지 않는 x 없이 모든 실수에서 정의됨',
  },
];

interface DescartesXJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  topCard: FunctionCard | null;
  selectedCard: FunctionCard | null;
  onConfirmSuccess: (reasonLabel: string) => void;
}

export const DescartesXJustificationModal: React.FC<DescartesXJustificationModalProps> = ({
  isOpen,
  onClose,
  topCard,
  selectedCard,
  onConfirmSuccess,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  if (!isOpen || !topCard || !selectedCard) return null;

  const handleVerify = () => {
    if (!selectedReasonId) {
      setErrorFeedback('공통 성질(이유)을 하나 선택해 주세요.');
      return;
    }

    const option = REASON_OPTIONS.find((r) => r.id === selectedReasonId);
    if (!option) return;

    // 검증 로직
    let isValid = false;
    let failureDetail = '';

    if (option.type === 'family') {
      isValid = topCard.family === selectedCard.family;
      if (!isValid) {
        failureDetail = `바닥 카드는 [${FAMILY_METAS[topCard.family]?.name}]이고, 낸 카드는 [${FAMILY_METAS[selectedCard.family]?.name}]로 서로 다른 계열입니다.`;
      }
    } else if (option.propertyTag) {
      const topHasIt = topCard.properties.includes(option.propertyTag);
      const selectedHasIt = selectedCard.properties.includes(option.propertyTag);

      isValid = topHasIt && selectedHasIt;

      if (!isValid) {
        if (!topHasIt && !selectedHasIt) {
          failureDetail = '두 카드 모두 이 성질을 만족하지 않습니다.';
        } else if (!topHasIt) {
          failureDetail = `바닥 카드 [${topCard.expression}]는 이 성질을 만족하지 않습니다.`;
        } else {
          failureDetail = `내가 낸 카드 [${selectedCard.expression}]는 이 성질을 만족하지 않습니다.`;
        }
      }
    }

    if (isValid) {
      soundEngine.playCorrect();
      setErrorFeedback(null);
      onConfirmSuccess(option.label);
      onClose();
    } else {
      soundEngine.playWrong();
      setErrorFeedback(`❌ 오답입니다! ${failureDetail} 수식과 그래프를 다시 관찰해 보세요.`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📐 수학적 이유 설명 (공통 성질 증명)"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-[#484848] select-none">
        {/* 설명 배너 */}
        <div className="p-4 rounded-2xl bg-[#fdfdfd] border border-[#dadada] flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#e60012] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-[#111827]">스스로 사고하는 수학적 증명 모드:</strong> 성질 태그 힌트는 제공되지 않습니다. 바닥 카드의 수식/그래프와 내가 선택한 카드의 수식/그래프를 면밀히 비교하여 <strong>두 함수가 공유하는 참인 수학적 이유</strong>를 선택하세요!
          </div>
        </div>

        {/* 바닥 카드 vs 낼 카드 비교 (성질 태그는 의도적으로 숨김: showProperties=false) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* 좌측: 바닥 카드 */}
          <div className="p-3.5 rounded-2xl bg-[#f8f8f8] border border-[#dadada] flex flex-col items-center">
            <div className="text-xs font-black text-[#857b70] uppercase tracking-wider mb-2">
              바닥 카드 (기준)
            </div>
            <Card
              card={topCard}
              size="sm"
              selectable={false}
              showProperties={false}
            />
          </div>

          {/* 우측: 내가 낼 카드 */}
          <div className="p-3.5 rounded-2xl bg-red-50/50 border-2 border-red-200 rounded-2xl flex flex-col items-center">
            <div className="text-xs font-black text-[#e60012] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={13} />
              <span>내가 내려놓을 카드</span>
            </div>
            <Card
              card={selectedCard}
              size="sm"
              selectable={false}
              showProperties={false}
            />
          </div>
        </div>

        {/* 이유 선택 다지선다 (Reason Grid) */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-[#111827] flex items-center gap-1.5">
            <HelpCircle size={15} className="text-[#e60012]" />
            <span>두 함수가 공유하는 공통 성질(이유)을 선택하세요:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {REASON_OPTIONS.map((opt) => {
              const isSelected = selectedReasonId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSelectedReasonId(opt.id);
                    setErrorFeedback(null);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-50 border-[#e60012] shadow-xs ring-2 ring-red-100'
                      : 'bg-white border-[#dadada] hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-game font-bold text-xs text-[#111827]">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-[#e60012]" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#727272] mt-1 leading-snug">
                    {opt.mathFormula}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 에러 피드백 알림 */}
        {errorFeedback && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <XCircle size={16} className="shrink-0" />
            <span>{errorFeedback}</span>
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#dadada]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#dadada] text-xs font-bold text-[#727272] hover:bg-gray-100 transition"
          >
            취소하고 손패로 돌아가기
          </button>

          <button
            type="button"
            onClick={handleVerify}
            className="btn-nintendo-red px-6 py-2.5 text-xs font-game font-black shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>근거 제출 및 카드 내기</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
};
