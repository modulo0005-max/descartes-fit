import React, { useState } from 'react';
import { usePropertyRush } from '../../hooks/usePropertyRush';
import { Card } from '../common/Card';
import { CardDetailModal } from '../common/CardDetailModal';
import { FunctionCard, FunctionFamily } from '../../types/math';
import { PROPERTY_LABELS } from '../../data/functionCards';
import { Zap, Clock, Flame, Award, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

interface PropertyRushBoardProps {
  allowedFamilies?: FunctionFamily[];
}

export const PropertyRushBoard: React.FC<PropertyRushBoardProps> = ({
  allowedFamilies = ['linear', 'quadratic', 'rational', 'irrational'],
}) => {
  const {
    isActive,
    score,
    combo,
    maxCombo,
    timeLeft,
    currentMission,
    options,
    feedback,
    roundHistory,
    startGame,
    submitAnswer,
  } = usePropertyRush(allowedFamilies);

  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);

  // 로컬스토리지 최고 점수
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('descartes_rush_high_score') || '0', 10);
  });

  if (!isActive && roundHistory.length > 0) {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('descartes_rush_high_score', score.toString());
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 select-none">
      {/* 게임 대기 또는 결과 화면 */}
      {!isActive ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-[#dadada] text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-[#e60012] border border-red-200 flex items-center justify-center mb-4 shadow-xs">
            <Zap className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-3xl font-black text-[#111827] mb-2">
            함수 성질 스피드 매칭 (Rush Mode)
          </h2>
          <p className="text-sm text-[#727272] max-w-md mb-6 leading-relaxed">
            제시된 함수의 수학적 성질(대칭성, 점근선, 최댓값/최솟값, 절편 등)을 만족하는 카드를 빠르게 선택하세요! 콤보를 이어갈수록 가산점이 폭발합니다.
          </p>

          {/* 결과 요약 (게임 직후인 경우) */}
          {roundHistory.length > 0 && (
            <div className="w-full max-w-md p-5 rounded-2xl bg-[#f8f8f8] border border-[#dadada] mb-6 shadow-xs">
              <div className="flex justify-around items-center mb-4">
                <div>
                  <span className="text-xs text-[#727272] block font-bold">최종 획득 점수</span>
                  <span className="text-3xl font-black text-[#e60012] font-mono">
                    {score.toLocaleString()}점
                  </span>
                </div>
                <div className="h-8 w-px bg-[#dadada]" />
                <div>
                  <span className="text-xs text-[#727272] block font-bold">최대 연속 콤보</span>
                  <span className="text-2xl font-black text-amber-600 font-mono">
                    🔥 {maxCombo} COMBO
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#727272]">
                역대 최고 점수: <strong className="text-[#111827]">{Math.max(score, highScore)}점</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={startGame}
            className="nintendo-btn-primary px-8 py-3.5 text-base font-black shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Zap size={18} fill="currentColor" />
            <span>{roundHistory.length === 0 ? '스피드 매칭 시작 (45초)' : '다시 도전하기'}</span>
          </button>

          {/* 지난 라운드 복습/오답노트 */}
          {roundHistory.length > 0 && (
            <div className="w-full max-w-2xl mt-8 text-left">
              <h3 className="font-bold text-sm text-[#111827] mb-3 flex items-center gap-2">
                <Award size={16} className="text-[#e60012]" />
                방금 푼 문제 수학 복습 노트
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {roundHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      item.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.isCorrect ? (
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-[#111827]">
                          {item.mission.title}
                        </div>
                        <div className="text-[11px] text-[#727272]">
                          선택 카드: <span className="font-mono text-[#e60012] font-bold">{item.chosen.expression}</span> ({item.chosen.title})
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#dadada] font-bold text-[#484848]">
                      {PROPERTY_LABELS[item.mission.property]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 게임 진행 중 화면 */
        <div className="flex flex-col gap-6">
          {/* 상단 통계 바: 시간, 점수, 콤보 */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-[#dadada] shadow-sm">
            {/* 남은 시간 */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                  timeLeft <= 10
                    ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-ping'
                    : 'bg-red-50 text-[#e60012] border border-red-200'
                }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] text-[#727272] font-bold uppercase tracking-wider block">
                  남은 시간
                </span>
                <span
                  className={`text-2xl font-black font-mono ${
                    timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-[#111827]'
                  }`}
                >
                  {timeLeft}초
                </span>
              </div>
            </div>

            {/* 현재 점수 */}
            <div className="text-center">
              <span className="text-[10px] text-[#727272] font-bold uppercase tracking-wider block">
                SCORE
              </span>
              <span className="text-2xl font-black text-[#e60012] font-mono">
                {score.toLocaleString()}
              </span>
            </div>

            {/* 콤보 */}
            <div className="flex items-center justify-end gap-2">
              {combo > 1 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-sm animate-bounce">
                  <Flame size={16} fill="currentColor" className="text-amber-600" />
                  {combo} COMBO!
                </div>
              ) : (
                <div className="text-xs text-[#727272] font-bold">100점 / 정답</div>
              )}
            </div>
          </div>

          {/* 시간 게이지 바 */}
          <div className="w-full h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 10
                  ? 'bg-rose-500'
                  : timeLeft <= 20
                  ? 'bg-amber-500'
                  : 'bg-[#e60012]'
              }`}
              style={{ width: `${(timeLeft / 45) * 100}%` }}
            />
          </div>

          {/* 중앙 미션 문제 배너 */}
          <div
            className={`p-5 rounded-2xl border-2 transition-all duration-200 shadow-sm relative overflow-hidden ${
              feedback === 'correct'
                ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-100'
                : feedback === 'wrong'
                ? 'bg-rose-50 border-rose-500 ring-4 ring-rose-100 animate-shake'
                : 'bg-white border-[#dadada]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#e60012] border border-red-200">
                🎯 다음 성질을 만족하는 카드는?
              </span>
              <span className="text-xs text-amber-800 font-bold flex items-center gap-1">
                <Lightbulb size={13} className="text-amber-600" />
                {currentMission.hint}
              </span>
            </div>

            <h3 className="text-xl font-black text-[#111827] mb-1">
              {currentMission.title}
            </h3>
            <p className="text-xs text-[#484848] leading-relaxed">
              {currentMission.description}
            </p>
          </div>

          {/* 4개 카드 보기 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {options.map((card) => (
              <div
                key={card.id}
                onClick={() => submitAnswer(card)}
                className="cursor-pointer transform hover:-translate-y-1.5 transition-all active:scale-95"
              >
                <Card
                  card={card}
                  size="md"
                  selectable={false}
                  onInspect={(c) => setInspectedCard(c)}
                  showProperties={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 카드 상세 모달 */}
      <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />
    </div>
  );
};
