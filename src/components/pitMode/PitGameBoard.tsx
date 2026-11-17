import React, { useState } from 'react';
import { usePitGame } from '../../hooks/usePitGame';
import { TradingDesk } from './TradingDesk';
import { PitBell } from './PitBell';
import { HandOrganizer } from './HandOrganizer';
import { CardDetailModal } from '../common/CardDetailModal';
import { TradeInspectionModal } from './TradeInspectionModal';
import { FunctionCard, FunctionFamily } from '../../types/math';
import { PlayerCount, FitSubRule } from '../../types/game';
import { FAMILY_METAS } from '../../data/functionCards';
import {
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  GraduationCap,
  Users,
  Sparkles,
  QrCode,
  Shield,
  Eye,
  Timer,
  Lightbulb,
} from 'lucide-react';

interface PitGameBoardProps {
  allowedFamilies?: FunctionFamily[];
  curriculumName?: string;
  onOpenCurriculumModal?: () => void;
  playerCount?: PlayerCount;
  onChangePlayerCount?: (count: PlayerCount) => void;
  fitSubRule?: FitSubRule;
  onChangeSubRule?: (rule: FitSubRule) => void;
  onOpenTutorial?: () => void;
  onOpenMultiplayer?: () => void;
}

export const PitGameBoard: React.FC<PitGameBoardProps> = ({
  allowedFamilies = ['linear', 'quadratic', 'rational', 'irrational'],
  curriculumName = '고1 공통수학 코스',
  onOpenCurriculumModal,
  playerCount = 4,
  onChangePlayerCount,
  fitSubRule = 'classic',
  onChangeSubRule,
  onOpenTutorial,
  onOpenMultiplayer,
}) => {
  const [internalPlayerCount, setInternalPlayerCount] = useState<PlayerCount>(playerCount);
  const [internalSubRule, setInternalSubRule] = useState<FitSubRule>(fitSubRule);

  const activePlayerCount = onChangePlayerCount ? playerCount : internalPlayerCount;
  const activeSubRule = onChangeSubRule ? fitSubRule : internalSubRule;

  const handleSetPlayerCount = (count: PlayerCount) => {
    if (onChangePlayerCount) onChangePlayerCount(count);
    else setInternalPlayerCount(count);
  };

  const handleSetSubRule = (rule: FitSubRule) => {
    if (onChangeSubRule) onChangeSubRule(rule);
    else setInternalSubRule(rule);
  };

  const {
    players,
    gameStatus,
    activeFamilies,
    selectedCardIds,
    startNewRound,
    toggleSelectCard,
    clearSelection,
    tradeWithBot,
    ringPitBell,
    canHumanFit,
    tradePacing,
    setTradePacing,
    tradeReport,
    closeTradeReport,
  } = usePitGame(allowedFamilies, activePlayerCount, activeSubRule);

  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);

  const humanPlayer = players.find((p) => p.isHuman);

  // 현재 선택된 카드들의 수학적 정보 요약 (교환 전 수학적 인식 강화)
  const selectedCards = humanPlayer
    ? humanPlayer.hand.filter((c) => selectedCardIds.includes(c.id))
    : [];
  const selectedFamily = selectedCards.length > 0 ? selectedCards[0].family : null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 select-none">
      {/* 1. 상단 라운드 제어 헤더 & 시나리오 선택 바 (닌텐도 아케이드 바) */}
      <div className="bg-white border-3 border-[#e5dfd5] rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 3D 라운드 코인 배지 */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#e60012] to-[#b3000e] text-white flex flex-col items-center justify-center font-game shadow-md border-b-4 border-[#80000a] shrink-0">
              <span className="text-[10px] leading-none opacity-90 tracking-wider">ROUND</span>
              <span className="text-2xl leading-none mt-1 font-black">{gameStatus.round}</span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-game text-2xl sm:text-3xl font-black text-[#111827] flex items-center gap-2 tracking-tight">
                  데카르트 핏 실시간 교환소
                  {gameStatus.phase === 'trading' && (
                    <span className="font-sans inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      실시간 거래중
                    </span>
                  )}
                </h2>

                {onOpenCurriculumModal && (
                  <button
                    type="button"
                    onClick={onOpenCurriculumModal}
                    className="nintendo-utility-pill flex items-center gap-1.5 text-xs border border-[#dadada] ml-1"
                    title="교육과정 변경"
                  >
                    <GraduationCap size={15} className="text-[#e60012]" />
                    <span>{curriculumName}</span>
                  </button>
                )}
              </div>

              {/* 이번 판 등장 함수 계열 배지 */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#727272] mt-1.5">
                <span className="font-bold text-[#484848]">이번 판 함수 세트:</span>
                <div className="flex flex-wrap gap-1">
                  {(activeFamilies.length > 0 ? activeFamilies : allowedFamilies.slice(0, activePlayerCount)).map((fam) => (
                    <span
                      key={fam}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-2xs ${FAMILY_METAS[fam].badgeBg}`}
                    >
                      {FAMILY_METAS[fam].name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 우측 빠른 도구 및 시작 버튼 */}
          <div className="flex items-center gap-2.5">
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="nintendo-utility-pill flex items-center gap-1.5 text-xs"
                title="인터랙티브 튜토리얼 열기"
              >
                <Sparkles size={15} className="text-amber-500" />
                <span>튜토리얼</span>
              </button>
            )}

            {onOpenMultiplayer && (
              <button
                type="button"
                onClick={onOpenMultiplayer}
                className="nintendo-utility-pill flex items-center gap-1.5 text-xs"
                title="스마트폰/태블릿 QR P2P 멀티플레이어 로비 열기"
              >
                <QrCode size={15} className="text-blue-600" />
                <span>QR 멀티</span>
              </button>
            )}

            {gameStatus.phase === 'idle' || gameStatus.phase === 'round_over' ? (
              <button
                type="button"
                onClick={startNewRound}
                className="btn-nintendo-red px-6 py-3 font-game text-lg flex items-center gap-2 cursor-pointer"
              >
                <Play size={20} fill="currentColor" />
                <span>{gameStatus.phase === 'idle' ? '게임 시작 (카드 분배)' : '다음 라운드 시작'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startNewRound}
                className="nintendo-utility-pill flex items-center gap-1.5 text-xs"
              >
                <RotateCcw size={14} />
                <span>재셔플</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. 시나리오 및 운영 룰, 그리고 [학습 속도 조절기] (닌텐도 스위치 스타일 컨트롤 바) */}
        <div className="pt-3 border-t border-[#f0ece1] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 인원수 선택 */}
          <div className="flex items-center gap-2">
            <span className="font-game text-sm text-[#484848] flex items-center gap-1">
              <Users size={15} className="text-[#e60012]" />
              인원:
            </span>
            <div className="flex items-center gap-1 bg-[#f5f2eb] p-1 rounded-2xl border border-[#e0dad0]">
              <button
                type="button"
                disabled={gameStatus.phase === 'trading'}
                onClick={() => handleSetPlayerCount(2)}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  activePlayerCount === 2
                    ? 'bg-[#e60012] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
              >
                2인 듀얼 (18장)
              </button>
              <button
                type="button"
                disabled={gameStatus.phase === 'trading'}
                onClick={() => handleSetPlayerCount(3)}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  activePlayerCount === 3
                    ? 'bg-[#e60012] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
              >
                3인 삼파전 (27장)
              </button>
              <button
                type="button"
                disabled={gameStatus.phase === 'trading'}
                onClick={() => handleSetPlayerCount(4)}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  activePlayerCount === 4
                    ? 'bg-[#e60012] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
              >
                4인 표준 (36장)
              </button>
            </div>
          </div>

          {/* 운영 룰 선택 */}
          <div className="flex items-center gap-2">
            <span className="font-game text-sm text-[#484848] flex items-center gap-1">
              <Shield size={15} className="text-[#e60012]" />
              규칙:
            </span>
            <div className="flex items-center gap-1 bg-[#f5f2eb] p-1 rounded-2xl border border-[#e0dad0]">
              <button
                type="button"
                onClick={() => handleSetSubRule('classic')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  activeSubRule === 'classic'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="정통 핏: 실시간 음성/자막 호가 거래"
              >
                정통 핏
              </button>
              <button
                type="button"
                onClick={() => handleSetSubRule('silent')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition flex items-center gap-1 ${
                  activeSubRule === 'silent'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="무언(손가락) 핏: 손가락(👆✌️🤟) 제스처로만 호가 교환"
              >
                <span>🤫 무언 핏</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetSubRule('open_hand')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition flex items-center gap-1 ${
                  activeSubRule === 'open_hand'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="오픈 핸드(멘토링): AI 수집 목표 공개"
              >
                <Eye size={13} />
                <span>오픈 핸드</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetSubRule('team_2v2')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition flex items-center gap-1 ${
                  activeSubRule === 'team_2v2'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="2:2 듀오 팀전: 마주 보는 파트너와 상호보완 계열 수집"
              >
                <span>🤝 2:2 듀오</span>
              </button>
            </div>
          </div>

          {/* 교육적 교환 속도 조절기 (학습 모드 / 표준 / 스피드) */}
          <div className="flex items-center gap-2">
            <span className="font-game text-sm text-[#484848] flex items-center gap-1">
              <Timer size={15} className="text-[#e60012]" />
              속도:
            </span>
            <div className="flex items-center gap-1 bg-[#f5f2eb] p-1 rounded-2xl border border-[#e0dad0]">
              <button
                type="button"
                onClick={() => setTradePacing('learning')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition flex items-center gap-1 ${
                  tradePacing === 'learning'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="수학 학습 모드: 6초 여유 주기 & 거래 성사 시 탐구 리포트 일시 정지"
              >
                <span>🎓 수학 학습 (권장)</span>
              </button>
              <button
                type="button"
                onClick={() => setTradePacing('normal')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  tradePacing === 'normal'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="표준 모드: 3.8초 간격"
              >
                표준 (3.8초)
              </button>
              <button
                type="button"
                onClick={() => setTradePacing('speed')}
                className={`px-3 py-1.5 rounded-xl font-game text-xs transition ${
                  tradePacing === 'speed'
                    ? 'bg-[#e60012] text-white shadow-xs'
                    : 'text-[#484848] hover:bg-white'
                }`}
                title="스피드 모드: 2.2초 빠른 호가 전환"
              >
                스피드 (2.2초)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 라운드 종료 축하 배너 */}
      {gameStatus.phase === 'round_over' && (
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-50 to-red-50 border-3 border-amber-400 shadow-xl text-center animate-in zoom-in-95">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-2 animate-bounce" />
          <h3 className="font-game text-3xl sm:text-4xl font-black text-[#111827] mb-2">
            🔔 {gameStatus.winner?.name} 데카르트 핏 승리!
          </h3>
          <p className="text-base text-[#484848] mb-5 font-bold">{gameStatus.winReason}</p>
          <button
            type="button"
            onClick={startNewRound}
            className="btn-nintendo-red px-10 py-4 font-game text-xl shadow-lg"
          >
            다음 라운드 도전하기 ➔
          </button>
        </div>
      )}

      {/* 교환 전 수학적 인식 강화 배너 (선택한 카드의 수식 및 수학적 성질 미리보기) */}
      {selectedCards.length > 0 && selectedFamily && (
        <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
              <Lightbulb size={22} />
            </div>
            <div>
              <div className="font-game text-sm font-black text-blue-950 mb-1">
                💡 교환 제안 중인 카드 ({selectedCards.length}장): [{FAMILY_METAS[selectedFamily].name}]
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedCards.map((c) => (
                  <span
                    key={c.id}
                    className="font-mono text-sm font-bold bg-white px-3 py-1 rounded-lg border border-blue-200 text-[#111827] shadow-2xs"
                  >
                    {c.expression}
                  </span>
                ))}
              </div>
              <div className="text-xs text-blue-900 mt-1 font-semibold">
                상대방 AI 중 <strong>&ldquo;{selectedCards.length}장 교환&rdquo;</strong>을 외치고 있는 수학자의 [교환하기] 버튼을 누르면 맞교환됩니다.
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="font-game text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-200 text-blue-950 border border-blue-300">
              동일 계열 {selectedCards.length}장 일치 검증 완료 ✅
            </span>
          </div>
        </div>
      )}

      {/* 3. 메인 경기장: 닌텐도 보드게임 매트 (Tactile Game Board Mat) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        <div className="lg:col-span-3 flex flex-col items-center gap-6 game-board-mat p-6 sm:p-8">
          <TradingDesk
            players={players}
            playerOfferCount={selectedCardIds.length}
            onTradeWithBot={tradeWithBot}
            canTrade={gameStatus.phase === 'trading'}
            fitSubRule={activeSubRule}
          />

          <div className="my-4">
            <PitBell
              onRing={() => ringPitBell()}
              canFit={canHumanFit}
              disabled={gameStatus.phase !== 'trading'}
            />
          </div>
        </div>

        {/* 우측 실시간 거래 호가 로그창 (닌텐도 뉴스 보드 스타일) */}
        <div className="lg:col-span-1 flex flex-col bg-white border-3 border-[#e5dfd5] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#f0ece1]">
            <span className="font-game text-base font-black text-[#111827] flex items-center gap-2">
              <Volume2 size={18} className="text-[#e60012]" />
              실시간 거래 시장 로그
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[400px] text-xs">
            {gameStatus.tradingLogs.length === 0 ? (
              <div className="text-center text-[#8a857b] font-game py-16 text-sm leading-relaxed">
                ‘게임 시작’ 버튼을 누르면 인공지능 수학자들과의 실시간 카드 호가 교환이 시작됩니다.
              </div>
            ) : (
              gameStatus.tradingLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border-2 leading-relaxed text-xs shadow-2xs font-semibold ${
                    log.type === 'fit'
                      ? 'bg-amber-100 text-amber-950 border-amber-300 font-game'
                      : log.type === 'alert'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : log.type === 'system'
                      ? 'bg-blue-50 text-blue-950 border-blue-200'
                      : 'bg-[#faf8f5] text-[#262626] border-[#e8e4db]'
                  }`}
                >
                  <span className="text-[10px] text-[#8a857b] font-mono block mb-0.5">
                    [{log.time}]
                  </span>
                  {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. 내 손패 오거나이저 */}
      {humanPlayer && (
        <HandOrganizer
          hand={humanPlayer.hand}
          selectedCardIds={selectedCardIds}
          onToggleSelect={toggleSelectCard}
          onClearSelection={clearSelection}
          onInspect={(card) => setInspectedCard(card)}
          canFit={canHumanFit}
          disabled={gameStatus.phase !== 'trading'}
        />
      )}

      {/* 카드 상세 인포 모달 */}
      <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />

      {/* 🤝 카드 교환 성사 시 수학적 학습 리포트 모달 (일시 정지 & 새 카드 탐구) */}
      <TradeInspectionModal
        report={tradeReport}
        onConfirm={closeTradeReport}
      />
    </div>
  );
};
