import React, { useState } from 'react';
import { GameMode, PlayerCount, FitSubRule } from './types/game';
import { FunctionFamily } from './types/math';
import { Navbar } from './components/layout/Navbar';
import { PitGameBoard } from './components/pitMode/PitGameBoard';
import { DescartesXBoard } from './components/descartesX/DescartesXBoard';
import { DescartesYBoard } from './components/descartesY/DescartesYBoard';
import { PropertyRushBoard } from './components/rushMode/PropertyRushBoard';
import { FunctionDexLab } from './components/labMode/FunctionDexLab';
import { RuleGuideModal } from './components/layout/RuleGuideModal';
import { CurriculumModal } from './components/layout/CurriculumModal';
import { InteractiveTutorialModal } from './components/tutorial/InteractiveTutorialModal';
import { MultiplayerLobbyModal } from './components/multiplayer/MultiplayerLobbyModal';
import { CURRICULUM_PRESETS, CurriculumPresetId } from './data/curriculums';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>('pit');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(4);
  const [fitSubRule, setFitSubRule] = useState<FitSubRule>('classic');

  // 모달 상태
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);

  // 기본 교육과정: 고1 공통수학 (일차, 이차, 유리, 무리함수)
  const [activeCurriculum, setActiveCurriculum] = useState<CurriculumPresetId>('high1_common');
  const [customFamilies, setCustomFamilies] = useState<FunctionFamily[]>([
    'linear',
    'quadratic',
    'rational',
    'irrational',
  ]);

  const currentPreset = CURRICULUM_PRESETS[activeCurriculum];
  const activeAllowedFamilies =
    activeCurriculum === 'custom' ? customFamilies : currentPreset.allowedFamilies;

  const handleToggleCustomFamily = (family: FunctionFamily) => {
    setCustomFamilies((prev) => {
      if (prev.includes(family)) {
        if (prev.length <= 4) return prev; // 최소 4개 유지
        return prev.filter((f) => f !== family);
      } else {
        return [...prev, family];
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#262626] flex flex-col font-sans selection:bg-[#e60012] selection:text-white">
      {/* 1. 글로벌 네비게이션 헤더 */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        activeCurriculum={activeCurriculum}
        onOpenCurriculumModal={() => setIsCurriculumModalOpen(true)}
      />

      {/* 2. 메인 게임 뷰 (모드에 따라 분기 렌더링) */}
      <main className="flex-1 pb-16">
        {/* 모드 1: 데카르트 핏 (메인 실시간 교환) */}
        {currentMode === 'pit' && (
          <PitGameBoard
            allowedFamilies={activeAllowedFamilies}
            curriculumName={currentPreset.name}
            onOpenCurriculumModal={() => setIsCurriculumModalOpen(true)}
            playerCount={playerCount}
            onChangePlayerCount={(count) => setPlayerCount(count)}
            fitSubRule={fitSubRule}
            onChangeSubRule={(rule) => setFitSubRule(rule)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          />
        )}

        {/* 모드 2: 데카르트 X (공통 성질 털기) */}
        {currentMode === 'descartes_x' && (
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
            <DescartesXBoard allowedFamilies={activeAllowedFamilies} />
          </div>
        )}

        {/* 모드 3: 데카르트 Y (좌표 함숫값 배틀) */}
        {currentMode === 'descartes_y' && (
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
            <DescartesYBoard allowedFamilies={activeAllowedFamilies} />
          </div>
        )}

        {/* 모드 4: 스피드 매칭 퀴즈 */}
        {currentMode === 'rush' && (
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
            <PropertyRushBoard allowedFamilies={activeAllowedFamilies} />
          </div>
        )}

        {/* 모드 5: 함수 도감 랩 */}
        {currentMode === 'lab' && (
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
            <FunctionDexLab />
          </div>
        )}
      </main>

      {/* 3. 푸터 */}
      <footer className="w-full py-6 px-4 border-t border-[#dadada] bg-white text-center text-xs text-[#727272]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono">
            &ldquo;Cogito, ergo sum (나는 생각한다, 고로 나는 존재한다)&rdquo; — René Descartes
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#484848]">
            <span>현재 설정: <strong className="text-[#e60012]">{currentPreset.name} ({currentPreset.targetGrade})</strong></span>
            <span>•</span>
            <span>2022 개정 고1 공통수학 최적화</span>
            <span>•</span>
            <span>Cartesian Function Engine</span>
          </div>
        </div>
      </footer>

      {/* 4. 모달 모음 */}
      {/* 공식 게임 설명서 모달 */}
      <RuleGuideModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* 대화형 튜토리얼 모달 */}
      <InteractiveTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartRealGame={() => {
          setIsTutorialOpen(false);
          setCurrentMode('pit');
        }}
      />

      {/* 교실 P2P 멀티플레이어 QR 로비 모달 */}
      <MultiplayerLobbyModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
      />

      {/* 교육과정 설정 모달 */}
      <CurriculumModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        activePreset={activeCurriculum}
        onSelectPreset={(pid) => setActiveCurriculum(pid)}
        customFamilies={customFamilies}
        onToggleCustomFamily={handleToggleCustomFamily}
      />
    </div>
  );
};

export default App;
