import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PROPERTY_LABELS } from '../../data/functionCards';
import {
  Bell,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Layers,
  Swords,
  Users,
  Compass,
} from 'lucide-react';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'pit_rules' | 'variant_modes' | 'rush_lab' | 'curriculum' | 'math_dict';

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('pit_rules');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📖 데카르트핏(Descartes Fit) 공식 게임 설명서" maxWidth="3xl">
      <div className="space-y-5 text-[#484848] select-none">
        {/* 상단 탭 네비게이션 */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
          <button
            type="button"
            onClick={() => setActiveTab('pit_rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'pit_rules'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <Bell size={13} />
            1. 데카르트 핏 (메인 교환)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variant_modes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'variant_modes'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <Layers size={13} />
            2. 데카르트 X & Y 모드
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rush_lab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'rush_lab'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <Zap size={13} />
            3. 스피드 매칭 & 함수 랩
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'curriculum'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <GraduationCap size={13} />
            4. 고1 교육과정 반영 안내
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('math_dict')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'math_dict'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <BookOpen size={13} />
            5. 수학 성질 용어사전
          </button>
        </div>

        {/* 탭 1: 데카르트 핏 메인 실시간 물물교환 규칙 */}
        {activeTab === 'pit_rules' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <h4 className="font-bold text-sm text-[#e60012] mb-1 flex items-center gap-1.5">
                <Sparkles size={15} />
                게임 개요 및 최종 승리 조건
              </h4>
              <p className="text-[#484848] text-xs">
                데카르트핏은 1904년 탄생한 세계적인 실시간 주식·상품 거래 보드게임 <strong>'핏(Pit)'</strong>의 규칙을
                수학 함수에 접목한 수학 보드게임입니다. 턴(순서) 없이 모든 참가자가 동시에 소리치며 카드를 맞교환하여,
                <strong>자신의 손패에 한 종류의 함수 카드 9장을 가장 먼저 독점(모두 수집)하고 중앙의 종을 쳐서 "FIT!"을 외치는 사람</strong>이 승리합니다.
              </p>
            </div>

            {/* 인원수별 스케일링 */}
            <div className="p-3.5 rounded-xl bg-white border border-[#dadada]">
              <span className="font-bold text-[#111827] block mb-1.5 text-xs flex items-center gap-1">
                <Users size={14} className="text-[#e60012]" />
                참여 인원수별 덱 구성
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <div className="font-bold text-[#111827]">👥 2인 듀얼</div>
                  <div className="text-[11px] text-[#727272] mt-0.5">2개 함수 × 9장 = <strong>총 18장</strong></div>
                  <div className="text-[10px] text-[#727272]">1:1 빠른 속공 교환전</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <div className="font-bold text-[#111827]">👥 3인 삼파전</div>
                  <div className="text-[11px] text-[#727272] mt-0.5">3개 함수 × 9장 = <strong>총 27장</strong></div>
                  <div className="text-[10px] text-[#727272]">삼각 순환 물물교환</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <div className="font-bold text-[#111827]">👥 4인 표준</div>
                  <div className="text-[11px] text-[#727272] mt-0.5">4개 함수 × 9장 = <strong>총 36장</strong></div>
                  <div className="text-[10px] text-[#727272]">교실 정규 모둠 대전</div>
                </div>
              </div>
            </div>

            {/* 실시간 카드 교환의 황금 철칙 */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300">
              <span className="font-bold text-amber-900 block mb-1 text-xs flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-600" />
                실시간 카드 교환의 황금 철칙 (Golden Rule)
              </span>
              <p className="text-[#484848] mb-2 font-semibold">
                교환에 내놓을 카드는 <strong className="text-[#e60012] underline underline-offset-2">반드시 같은 종류(함수 계열)끼리만 1장, 2장, 또는 3장</strong>이어야 합니다!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
                  <span>가능: 일차함수 2장 묶어서 "2장!" 외치기</span>
                </div>
                <div className="p-2 rounded bg-rose-50 border border-rose-300 text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="flex-shrink-0 text-rose-600" />
                  <span>불가: 일차 1장 + 유리 1장 섞어서 2장 외치기</span>
                </div>
              </div>
            </div>

            {/* 4대 운영 규칙 변형 */}
            <div className="p-3.5 rounded-xl bg-white border border-[#dadada]">
              <span className="font-bold text-[#111827] block mb-2 text-xs">
                교실 환경 맞춤 4대 운영 변형 룰
              </span>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <strong>1) 정통 핏 (Classic):</strong> 교실 전체가 시장처럼 "1장! 2장!"을 육성으로 외치며 빠르게 맞교환하는 본래의 핏 방식입니다.
                </div>
                <div className="p-2 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <strong>2) 무언(손가락) 핏 (Silent):</strong> 옆 반 수업에 방해되지 않도록 입을 다물고 <strong>손가락(👆 1장, ✌️ 2장, 🤟 3장)</strong>으로만 수신호를 보내어 조용히 교환하는 모드입니다.
                </div>
                <div className="p-2 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <strong>3) 오픈 핸드(초보자 멘토링):</strong> 아직 함수 식 구분이 낯선 학생들을 위해 서로의 패 또는 상대가 모으는 함수를 일부 공개하여 전략적 교환을 지도하는 모드입니다.
                </div>
                <div className="p-2 rounded-lg bg-[#f8f8f8] border border-[#dadada]">
                  <strong>4) 2:2 듀오 팀전:</strong> 4명이 2팀으로 마주 앉아, 팀원끼리 서로 다른 함수를 수집하여 두 팀원 모두 9장을 모으거나 팀 합계 18장을 먼저 완성하면 승리합니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 데카르트 X & 데카르트 Y */}
        {activeTab === 'variant_modes' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-white border border-[#dadada]">
              <h4 className="font-bold text-sm text-[#e60012] mb-1 flex items-center gap-1.5">
                <Layers size={16} />
                데카르트 X (Descartes X - 공통 수학 성질 털기)
              </h4>
              <p className="text-[#484848] mb-2">
                보드게임 <strong>우노(UNO)</strong>처럼 바닥에 놓인 카드와 공통점을 가진 카드를 번갈아 내며 자신의 손패를 가장 먼저 0장으로 만드는 사람이 승리합니다.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#484848]">
                <li><strong>같은 함수 종류:</strong> 바닥 카드가 이차함수면 나도 이차함수 카드를 낼 수 있습니다.</li>
                <li><strong>공통 수학 성질:</strong> 함수 종류가 달라도 공통 성질(예: 원점대칭, 최솟값 존재, x축과 만남 등)을 공유하면 낼 수 있습니다.</li>
                <li>낼 수 있는 카드가 없으면 덱에서 1장을 뽑고 턴을 넘깁니다.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#dadada]">
              <h4 className="font-bold text-sm text-[#e60012] mb-1 flex items-center gap-1.5">
                <Swords size={16} />
                데카르트 Y (Descartes Y - 함숫값 좌표 배틀)
              </h4>
              <p className="text-[#484848] mb-2">
                카드 배틀 게임 <strong>탑 트럼프(Top Trumps)</strong>처럼 매 라운드 제시되는 x좌표 조건에 x를 대입하여 더 큰 함숫값 $f(x)$를 가진 카드를 낸 사람이 승리 포인트를 획득합니다.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#484848]">
                <li><strong>조건 예시:</strong> $x=1$ 대입 $f(1)$ 배틀, $y$절편 $f(0)$ 배틀, $x=2$ 대입 $f(2)$ 배틀 등.</li>
                <li>정의역에 해당 x값이 포함되지 않아 정의되지 않는 경우(예: 분모가 0이 되는 유리함수)는 최하위 점수로 처리됩니다.</li>
                <li>각자 가진 카드 중 어느 카드가 해당 좌표에서 가장 큰 값을 가질지 암산과 대입 능력을 겨룹니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 탭 3: 스피드 매칭 & 함수 랩 */}
        {activeTab === 'rush_lab' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-white border border-[#dadada]">
              <h4 className="font-bold text-sm text-[#e60012] mb-1 flex items-center gap-1.5">
                <Zap size={16} />
                스피드 매칭 (Descartes Rush)
              </h4>
              <p className="text-[#484848] mb-2">
                제한 시간 60초 동안 제시되는 수학적 조건(예: "y축 대칭인 함수", "제3사분면을 지나는 함수", "최솟값을 갖는 함수")에 맞는 카드를 보기 중에서 신속하게 클릭하여 콤보 점수를 쌓는 스피드 퀴즈 모드입니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#dadada]">
              <h4 className="font-bold text-sm text-[#e60012] mb-1 flex items-center gap-1.5">
                <Compass size={16} />
                함수 도감 랩 (Function Dex Lab)
              </h4>
              <p className="text-[#484848] mb-2">
                고1 공통수학부터 수1, 수2, 미적분까지 총 72종의 함수 카드를 직교 좌표계 캔버스에서 확대/축소하고, 마우스 커서를 올려 특정 x좌표의 정확한 y값을 실시간으로 확인하며 자율 탐구하는 인터랙티브 학습 공간입니다.
              </p>
            </div>
          </div>
        )}

        {/* 탭 4: 고1 교육과정 반영 안내 */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300">
              <h4 className="font-bold text-sm text-emerald-900 mb-1 flex items-center gap-1.5">
                <GraduationCap size={16} className="text-emerald-700" />
                고등학교 1학년(공통수학) 엄격 준수 가이드라인
              </h4>
              <p className="text-emerald-950 font-medium">
                본 웹 애플리케이션은 2022 개정 고등학교 교육과정을 철저히 준수하여 제작되었습니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#dadada]">
                <span className="font-bold text-[#111827] block mb-1">
                  1. 허용된 4대 기본 함수 계열
                </span>
                <p className="text-[#484848]">
                  고1 공통수학 기본 모드에서는 오직 <strong>일차함수(Linear), 이차함수(Quadratic), 유리함수(Rational), 무리함수(Irrational)</strong>의 4개 계열(총 36장)만 사용됩니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#dadada]">
                <span className="font-bold text-rose-700 block mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  2. '극값(극대/극소)' 표현 완전 배제 원칙
                </span>
                <p className="text-[#484848]">
                  고1 학생은 아직 미적분(도함수의 부호 변화)을 배우지 않았으므로 <strong>'극댓값 / 극솟값'</strong>이라는 용어를 사용해서는 안 됩니다. 대신 중학교 3학년 및 고1 공통수학에서 다루는 <strong>"최댓값 / 최솟값 (꼭짓점의 y좌표)"</strong>으로 완벽하게 대체되어 수록되었습니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#dadada]">
                <span className="font-bold text-rose-700 block mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  3. 삼각함수 '주기함수' 배제 원칙
                </span>
                <p className="text-[#484848]">
                  주기함수는 고2 일반선택 '수학Ⅰ' 삼각함수 단원에서 처음 등장하므로, 고1 공통수학 덱 및 스피드 퀴즈 미션에서는 일체 배제되었습니다. (고2 심화 코스 선택 시에만 활성화됩니다.)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 5: 수학 성질 용어사전 */}
        {activeTab === 'math_dict' && (
          <div className="space-y-3 text-xs leading-relaxed max-h-[420px] overflow-y-auto pr-1">
            {Object.entries(PROPERTY_LABELS).map(([key, item]) => (
              <div key={key} className="p-3 rounded-xl bg-white border border-[#dadada]">
                <div className="font-bold text-[#111827] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-[#e60012] font-mono text-[10px] font-bold">
                    {key}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div className="text-[11px] text-[#727272] mt-1 font-medium">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
