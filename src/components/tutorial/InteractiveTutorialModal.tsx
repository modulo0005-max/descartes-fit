import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw,
  Award,
} from 'lucide-react';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRealGame?: () => void;
}

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartRealGame,
}) => {
  const [step, setStep] = useState<number>(1);
  const [demoSelected, setDemoSelected] = useState<number[]>([]);
  const [traded, setTraded] = useState<boolean>(false);
  const [bellRung, setBellRung] = useState<boolean>(false);

  const totalSteps = 5;

  const resetTutorial = () => {
    setStep(1);
    setDemoSelected([]);
    setTraded(false);
    setBellRung(false);
  };

  const handleNextStep = () => {
    soundEngine.playCardFlip();
    setStep((prev) => Math.min(prev + 1, totalSteps + 1));
  };

  const toggleDemoCard = (id: number) => {
    soundEngine.playCardFlip();
    setDemoSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSimulateTrade = () => {
    soundEngine.playTradeSuccess();
    setTraded(true);
  };

  const handleSimulateBell = () => {
    soundEngine.playBellRing();
    soundEngine.playCorrect();
    setBellRung(true);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#e60012', '#38bdf8', '#fbbf24', '#34d399'],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎓 데카르트핏 3분 인터랙티브 튜토리얼"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-[#484848]">
        {/* 상단 진행 프로그레스 바 */}
        <div className="flex items-center justify-between text-xs font-bold text-[#727272] mb-1">
          <span className="flex items-center gap-1.5 text-[#e60012]">
            <Sparkles size={14} />
            {step <= totalSteps ? `단계 ${step} / ${totalSteps}` : '🎉 튜토리얼 완료!'}
          </span>
          <span>{Math.min(Math.round((step / totalSteps) * 100), 100)}% 달성</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#efefef] overflow-hidden">
          <div
            className="h-full bg-[#e60012] transition-all duration-300"
            style={{ width: `${Math.min((step / totalSteps) * 100, 100)}%` }}
          />
        </div>

        {/* 1단계: 게임 목표 소개 */}
        {step === 1 && (
          <div className="p-6 rounded-2xl bg-[#f8f8f8] border border-[#dadada] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-[#e60012] mx-auto flex items-center justify-center text-3xl font-black">
              f(x)
            </div>
            <h3 className="text-2xl font-black text-[#484848]">
              데카르트핏의 목표는 딱 하나!
            </h3>
            <p className="text-base text-[#727272] max-w-lg mx-auto leading-relaxed">
              플레이어들은 실시간으로 카드를 맞교환하여, 자신의 손패에 <strong className="text-[#e60012] font-black underline underline-offset-4">한 종류의 함수 카드 9장</strong>을 가장 먼저 모두 모으고 중앙의 종을 쳐서 <strong className="text-[#e60012]">"FIT!!"</strong>을 외치면 승리합니다!
            </p>
            <div className="p-4 rounded-xl bg-white border border-[#dadada] max-w-md mx-auto text-xs text-[#727272] flex items-center justify-center gap-2">
              <span className="px-2 py-1 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">일차함수 9장</span>
              <span>또는</span>
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">이차함수 9장</span>
              <span>완성 시 승리!</span>
            </div>
          </div>
        )}

        {/* 2단계: 손패 확인 및 목표 설정 */}
        {step === 2 && (
          <div className="p-6 rounded-2xl bg-[#f8f8f8] border border-[#dadada] space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-[#e60012] uppercase tracking-wider block mb-1">
                STEP 2 : 주력 함수 결정하기
              </span>
              <h3 className="text-xl font-bold text-[#484848]">
                내 손패에서 "가장 많은 함수"를 목표로 정하세요!
              </h3>
              <p className="text-sm text-[#727272] mt-1">
                게임이 시작되면 9장의 카드를 받습니다. 손패에 가장 많은 장수를 차지한 함수를 모으는 것이 유리합니다.
              </p>
            </div>

            {/* 샘플 손패 예시 */}
            <div className="p-4 rounded-xl bg-white border border-[#dadada]">
              <span className="text-xs font-bold text-[#727272] block mb-2">
                내 가상 손패 (9장):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center text-xs">
                {[
                  { name: '이차', bg: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' },
                  { name: '이차', bg: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' },
                  { name: '이차', bg: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' },
                  { name: '이차', bg: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' },
                  { name: '일차', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
                  { name: '일차', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
                  { name: '유리', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { name: '유리', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { name: '무리', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-lg border ${item.bg}`}>
                    <span className="text-[10px] block">#{idx + 1}</span>
                    <span className="text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center font-bold">
                💡 이차함수가 4장으로 가장 많으므로, 이번 판은 "이차함수 9장"을 목표로 정하는 것이 최선입니다!
              </div>
            </div>
          </div>
        )}

        {/* 3단계: 교환의 황금 철칙 체험 */}
        {step === 3 && (
          <div className="p-6 rounded-2xl bg-[#f8f8f8] border border-[#dadada] space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-[#e60012] uppercase tracking-wider block mb-1">
                STEP 3 : 교환의 황금 철칙 체험
              </span>
              <h3 className="text-xl font-bold text-[#484848]">
                반드시 "같은 종류의 카드끼리만" 1~3장 교환할 수 있습니다!
              </h3>
              <p className="text-xs text-[#727272] mt-1">
                아래 카드 중 <strong>불필요한 같은 종류 카드(예: 일차함수 2장)</strong>를 클릭해 선택해 보세요!
              </p>
            </div>

            {/* 인터랙티브 선택 체험 슬롯 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 1, fam: '일차함수', expr: 'f(x) = 2x - 4', color: 'border-sky-300 text-sky-700' },
                { id: 2, fam: '일차함수', expr: 'f(x) = -x + 3', color: 'border-sky-300 text-sky-700' },
                { id: 3, fam: '유리함수', expr: 'f(x) = 1/x', color: 'border-emerald-300 text-emerald-700' },
                { id: 4, fam: '무리함수', expr: 'f(x) = √x', color: 'border-rose-300 text-rose-700' },
              ].map((card) => {
                const isSelected = demoSelected.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleDemoCard(card.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${isSelected
                      ? 'border-[#e60012] bg-red-50 ring-2 ring-[#e60012]'
                      : 'border-[#dadada] bg-white hover:border-[#ac000d]'
                      }`}
                  >
                    <span className="text-[10px] font-bold block mb-1">{card.fam}</span>
                    <span className="font-mono text-xs font-bold text-[#484848] block mb-2">
                      {card.expr}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${isSelected ? 'bg-[#e60012] text-white' : 'bg-[#efefef] text-[#727272]'
                        }`}
                    >
                      {isSelected ? '선택됨' : '클릭하여 선택'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 규칙 검증 피드백 */}
            <div className="text-center text-xs">
              {demoSelected.includes(1) && demoSelected.includes(2) && demoSelected.length === 2 ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  완벽합니다! 같은 일차함수 2장을 골랐으므로 "2장 교환!!"을 외칠 수 있습니다!
                </div>
              ) : demoSelected.length > 0 &&
                (demoSelected.includes(3) || demoSelected.includes(4)) &&
                (demoSelected.includes(1) || demoSelected.includes(2)) ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  반칙입니다! 서로 다른 함수(일차+유리)는 섞어서 교환할 수 없습니다!
                </div>
              ) : (
                <div className="p-2 text-[#727272]">
                  위에서 일차함수 카드 2개(1번, 2번)를 동시에 클릭해 보세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4단계: 실시간 호가 & 맞교환 시뮬레이션 */}
        {step === 4 && (
          <div className="p-6 rounded-2xl bg-[#f8f8f8] border border-[#dadada] space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-[#e60012] uppercase tracking-wider block mb-1">
                STEP 4 : 실시간 호가 및 맞교환 체험
              </span>
              <h3 className="text-xl font-bold text-[#484848]">
                상대가 나와 같은 장수를 외칠 때 맞교환하세요!
              </h3>
              <p className="text-xs text-[#727272] mt-1">
                라이벌 오일러가 "2장 교환할 사람!!"을 외치고 있습니다. 버튼을 눌러 맞교환을 성사시켜 보세요!
              </p>
            </div>

            {/* 시뮬레이션 가상 봇 카드 */}
            <div className="p-5 rounded-2xl bg-white border border-[#dadada] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎩</span>
                <div className="text-left">
                  <span className="font-bold text-sm text-[#484848] block">오일러 (AI 라이벌)</span>
                  <div className="px-3 py-1 rounded-full bg-[#e60012] text-white font-black text-xs inline-block animate-bounce mt-1">
                    📣 "2장 교환할 사람!!"
                  </div>
                </div>
              </div>

              {!traded ? (
                <button
                  type="button"
                  onClick={handleSimulateTrade}
                  className="nintendo-btn-primary px-4 py-2 text-sm font-bold flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  2장 맞교환하기!
                </button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 font-black text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300">
                  <CheckCircle2 size={16} /> 교환 성공!
                </div>
              )}
            </div>

            {traded && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs text-center font-bold">
                🎉 교환 성사! 내가 준 일차함수 2장 대신, 오일러에게서 내 목표 카드인 <strong>이차함수 2장</strong>을 새로 받아왔습니다!
              </div>
            )}
          </div>
        )}

        {/* 5단계: 황금 벨 타격 및 승리 선언 */}
        {step === 5 && (
          <div className="p-6 rounded-2xl bg-[#f8f8f8] border border-[#dadada] text-center space-y-4">
            <span className="text-xs font-bold text-[#e60012] uppercase tracking-wider block mb-1">
              STEP 5 : 승리의 순간!
            </span>
            <h3 className="text-2xl font-black text-[#484848]">
              9장이 완성되면 중앙의 황금 벨을 치세요!
            </h3>
            <p className="text-xs text-[#727272] max-w-md mx-auto">
              손패에 목표한 함수 9장이 모두 모였습니다! 아래 황금 벨을 힘차게 클릭하여 <strong>"FIT!!"</strong>을 외쳐보세요!
            </p>

            <div className="py-2">
              <button
                type="button"
                onClick={handleSimulateBell}
                className={`w-32 h-32 rounded-full border-4 shadow-2xl transition-all duration-200 mx-auto flex flex-col items-center justify-center ${bellRung
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-200 scale-95 ring-4 ring-[#e60012]'
                  : 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-amber-200 hover:scale-105 active:scale-90 animate-bounce'
                  }`}
              >
                <Bell size={40} className="text-slate-950 mb-1" />
                <span className="text-xs font-black text-slate-950 tracking-widest">
                  {bellRung ? '🎉 FIT!!' : 'BELL RING'}
                </span>
              </button>
            </div>

            {bellRung && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold animate-in zoom-in-95">
                🔔 <strong>"데카르트 핏!!"</strong> 종이 울리고 라운드 승리를 거두었습니다!
              </div>
            )}
          </div>
        )}

        {/* 수료 완료 화면 */}
        {step > totalSteps && (
          <div className="p-8 rounded-2xl bg-[#f8f8f8] border border-[#dadada] text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Award size={48} />
            </div>
            <h3 className="text-2xl font-black text-[#484848]">
              🎓 데카르트핏 튜토리얼 완주 수료증!
            </h3>
            <p className="text-sm text-[#727272] max-w-md mx-auto leading-relaxed">
              축하합니다! 이제 데카르트핏의 모든 규칙과 교환 요령을 완벽하게 마스터했습니다.
              이제 라이벌 수학자들과의 실전 대결이나 친구들과의 멀티플레이에 도전해 보세요!
            </p>
          </div>
        )}

        {/* 하단 제어 버튼 바 */}
        <div className="flex items-center justify-between pt-4 border-t border-[#dadada]">
          <button
            type="button"
            onClick={resetTutorial}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#727272] hover:bg-[#efefef] transition"
          >
            <RotateCcw size={13} />
            처음부터 다시 보기
          </button>

          <div className="flex items-center gap-2">
            {step <= totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="nintendo-btn-primary px-5 py-2 text-sm font-bold flex items-center gap-1.5"
              >
                <span>다음 단계로</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartRealGame) onStartRealGame();
                }}
                className="nintendo-btn-primary px-6 py-2.5 text-base font-black flex items-center gap-1.5"
              >
                <span>실전 게임 시작하기 ➔</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

