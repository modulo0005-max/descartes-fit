import React from 'react';
import { Modal } from '../common/Modal';
import { CURRICULUM_PRESETS, CurriculumPresetId } from '../../data/curriculums';
import { FunctionFamily } from '../../types/math';
import { FAMILY_METAS } from '../../data/functionCards';
import { GraduationCap, Check, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePreset: CurriculumPresetId;
  onSelectPreset: (presetId: CurriculumPresetId) => void;
  customFamilies: FunctionFamily[];
  onToggleCustomFamily: (family: FunctionFamily) => void;
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  activePreset,
  onSelectPreset,
  customFamilies,
  onToggleCustomFamily,
}) => {
  const allFamilies: FunctionFamily[] = [
    'linear',
    'quadratic',
    'cubic',
    'rational',
    'irrational',
    'exponential',
    'logarithmic',
    'trigonometric',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="학생 학년별 교육과정 함수 세팅"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-[#484848] select-none">
        {/* 상단 안내 배너 (닌텐도 레드 소프트 배너) */}
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#484848] leading-relaxed flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#e60012] text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap size={18} />
          </div>
          <div>
            <span className="font-black text-[#111827] text-sm block mb-0.5">
              학생 연령 및 학년에 맞춘 함수 카드 필터링
            </span>
            아직 배우지 않은 함수(예: 고1에게 삼각·지수·로그·삼차함수)를 엄격히 제외하고, 현재 학교에서 배운 함수 카드로만 게임 덱(36장)을 정밀하게 구성할 수 있습니다.
          </div>
        </div>

        {/* 교육과정 프리셋 카드 그리드 (닌텐도 스위치 UI 스타일) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(CURRICULUM_PRESETS) as CurriculumPresetId[]).map((pid) => {
            const preset = CURRICULUM_PRESETS[pid];
            const isSelected = activePreset === pid;

            return (
              <div
                key={pid}
                onClick={() => onSelectPreset(pid)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px] ${
                  isSelected
                    ? 'bg-red-50/50 border-[#e60012] ring-4 ring-red-100 shadow-md'
                    : 'bg-white border-[#e5e7eb] hover:border-[#ac000d]/40 hover:shadow-md'
                }`}
              >
                {/* 닌텐도 레드 체크 배지 */}
                {isSelected && (
                  <div className="absolute -top-2.5 -right-2.5 z-10 w-7 h-7 rounded-full bg-[#e60012] text-white flex items-center justify-center font-bold shadow-md animate-bounce">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-black text-base text-[#111827] flex items-center gap-1.5">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                        isSelected
                          ? 'bg-[#e60012] text-white border-[#e60012]'
                          : 'bg-[#f8f8f8] text-[#484848] border-[#dadada]'
                      }`}
                    >
                      {preset.targetGrade}
                    </span>
                  </div>

                  {/* 세부 수록 함수 (닌텐도 레드 볼드 서브타이틀) */}
                  <div className="text-xs font-bold text-[#e60012] mb-1.5">
                    {preset.subtitle}
                  </div>

                  <p className="text-xs text-[#727272] leading-relaxed mb-3">
                    {preset.description}
                  </p>
                </div>

                {/* 포함된 함수 뱃지 목록 (고선명 화이트 알약) */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#f0f0f0]">
                  {preset.allowedFamilies.map((fam) => {
                    const meta = FAMILY_METAS[fam];
                    return (
                      <span
                        key={fam}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${meta.badgeBg}`}
                      >
                        {meta.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선생님 맞춤 선택 옵션 (Custom 모드 활성화 시) */}
        {activePreset === 'custom' && (
          <div className="p-5 rounded-2xl bg-[#fdfdfd] border-2 border-[#e5e7eb] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-[#e60012]" />
                사용할 함수를 4개 이상 선택하세요 ({customFamilies.length}/4+ 선택됨)
              </span>
              {customFamilies.length < 4 && (
                <span className="text-xs text-rose-600 font-bold">
                  ⚠️ 4인 대전을 위해 최소 4개 계열이 필요합니다.
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {allFamilies.map((fam) => {
                const meta = FAMILY_METAS[fam];
                const checked = customFamilies.includes(fam);

                return (
                  <button
                    key={fam}
                    type="button"
                    onClick={() => onToggleCustomFamily(fam)}
                    className={`p-3 rounded-xl border-2 text-left text-xs transition flex items-center justify-between ${
                      checked
                        ? 'bg-red-50 border-[#e60012] text-[#111827] font-black shadow-xs'
                        : 'bg-white text-[#727272] border-[#e5e7eb] hover:border-[#dadada]'
                    }`}
                  >
                    <span>{meta.name}</span>
                    <span className="text-[10px] text-[#727272] font-normal">
                      {meta.curriculum.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 하단 닌텐도 프라이머리 적용 버튼 */}
        <div className="pt-3 border-t border-[#f0f0f0]">
          <button
            type="button"
            onClick={onClose}
            className="nintendo-btn-primary w-full py-4 text-lg font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <CheckCircle2 size={20} />
            <span>이 세팅으로 게임 적용하기</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
