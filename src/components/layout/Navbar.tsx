import React, { useState } from 'react';
import { GameMode } from '../../types/game';
import { soundEngine } from '../../utils/audio';
import { CURRICULUM_PRESETS, CurriculumPresetId } from '../../data/curriculums';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Bell,
  Zap,
  Compass,
  GraduationCap,
  Sparkles,
  QrCode,
  Layers,
  Swords,
} from 'lucide-react';

interface NavbarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
  onOpenTutorial: () => void;
  onOpenMultiplayer: () => void;
  activeCurriculum: CurriculumPresetId;
  onOpenCurriculumModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  onOpenRules,
  onOpenTutorial,
  onOpenMultiplayer,
  activeCurriculum,
  onOpenCurriculumModal,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const currentPreset = CURRICULUM_PRESETS[activeCurriculum];

  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundEngine.setMuted(nextState);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#dadada] px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* 1. 브랜드 로고 영역 (닌텐도 레드 스퀘어) */}
        <div
          onClick={() => onSelectMode('pit')}
          className="flex items-center gap-3 select-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#e60012] flex items-center justify-center text-white font-game font-black text-xl shadow-md border-b-3 border-[#99000c]">
            f(x)
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-game text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
                데카르트핏
              </span>
              <span className="font-game text-[11px] font-black px-2 py-0.5 rounded-full bg-red-100 text-[#e60012] border border-red-300">
                FIT
              </span>
            </div>
            <div className="text-[10px] text-[#727272] font-bold tracking-wider">
              고교 수학 함수 보드게임
            </div>
          </div>
        </div>

        {/* 2. 중앙 5개 게임 모드 탭 (닌텐도 스위치 조이콘 스타일) */}
        <nav className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#f5f2eb] border border-[#e0dad0]">
          {/* 모드 1: 데카르트 핏 */}
          <button
            type="button"
            onClick={() => onSelectMode('pit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-game text-sm transition ${
              currentMode === 'pit'
                ? 'bg-[#e60012] text-white shadow-sm border-b-2 border-[#99000c]'
                : 'text-[#484848] hover:text-[#111827] hover:bg-white'
            }`}
          >
            <Bell size={15} />
            <span>데카르트 핏</span>
          </button>

          {/* 모드 2: 데카르트 X (성질 털기) */}
          <button
            type="button"
            onClick={() => onSelectMode('descartes_x')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-game text-sm transition ${
              currentMode === 'descartes_x'
                ? 'bg-[#e60012] text-white shadow-sm border-b-2 border-[#99000c]'
                : 'text-[#484848] hover:text-[#111827] hover:bg-white'
            }`}
            title="바닥 카드와 공통 성질을 맞춰 손패를 먼저 털어내는 우노 스타일 게임"
          >
            <Layers size={15} />
            <span>데카르트 X</span>
          </button>

          {/* 모드 3: 데카르트 Y (좌표 배틀) */}
          <button
            type="button"
            onClick={() => onSelectMode('descartes_y')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-game text-sm transition ${
              currentMode === 'descartes_y'
                ? 'bg-[#e60012] text-white shadow-sm border-b-2 border-[#99000c]'
                : 'text-[#484848] hover:text-[#111827] hover:bg-white'
            }`}
            title="x=1, x=2, y절편 등 지정 좌표의 함숫값 크기를 겨루는 탑트럼프 배틀"
          >
            <Swords size={15} />
            <span>데카르트 Y</span>
          </button>

          {/* 모드 4: 스피드 매칭 */}
          <button
            type="button"
            onClick={() => onSelectMode('rush')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-game text-sm transition ${
              currentMode === 'rush'
                ? 'bg-[#e60012] text-white shadow-sm border-b-2 border-[#99000c]'
                : 'text-[#484848] hover:text-[#111827] hover:bg-white'
            }`}
          >
            <Zap size={15} />
            <span>스피드 매칭</span>
          </button>

          {/* 모드 5: 함수 도감 랩 */}
          <button
            type="button"
            onClick={() => onSelectMode('lab')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-game text-sm transition ${
              currentMode === 'lab'
                ? 'bg-[#e60012] text-white shadow-sm border-b-2 border-[#99000c]'
                : 'text-[#484848] hover:text-[#111827] hover:bg-white'
            }`}
          >
            <Compass size={15} />
            <span>함수 도감 랩</span>
          </button>
        </nav>

        {/* 3. 우측 컨트롤 (튜토리얼, QR 멀티, 교육과정, 사운드, 규칙) */}
        <div className="flex items-center gap-2">
          {/* 대화형 튜토리얼 버튼 */}
          <button
            type="button"
            onClick={onOpenTutorial}
            className="nintendo-utility-pill flex items-center gap-1.5 text-xs font-game"
            title="5단계 인터랙티브 튜토리얼 열기"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="hidden sm:inline">튜토리얼</span>
          </button>

          {/* QR 멀티플레이어 버튼 */}
          <button
            type="button"
            onClick={onOpenMultiplayer}
            className="nintendo-utility-pill flex items-center gap-1.5 text-xs font-game"
            title="스마트폰/태블릿 교실 멀티플레이어 로비"
          >
            <QrCode size={14} className="text-blue-600" />
            <span className="hidden sm:inline">QR 멀티</span>
          </button>

          {/* 교육과정 선택 프리셋 버튼 */}
          <button
            type="button"
            onClick={onOpenCurriculumModal}
            className={`nintendo-utility-pill flex items-center gap-1.5 text-xs font-game ${currentPreset.badgeColor}`}
            title="교육과정 함수 세팅 변경"
          >
            <GraduationCap size={15} />
            <span>{currentPreset.name.split(' ')[0]}</span>
          </button>

          {/* 사운드 토글 */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="효과음 음소거 토글"
            className="p-2 rounded-xl border border-[#dadada] bg-white text-[#484848] hover:text-[#111827] shadow-2xs hover:border-[#ac000d] transition"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* 게임 규칙 버튼 */}
          <button
            type="button"
            onClick={onOpenRules}
            className="nintendo-utility-pill flex items-center gap-1 text-xs font-game"
          >
            <HelpCircle size={15} className="text-[#e60012]" />
            <span className="hidden sm:inline">규칙서</span>
          </button>
        </div>
      </div>
    </header>
  );
};
