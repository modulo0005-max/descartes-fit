export type TutorialStep = 
  | 'welcome'           // 1. 환영 및 게임 목표 소개
  | 'target_select'     // 2. 손패 관찰 및 목표 함수 결정
  | 'homo_rule'         // 3. 교환의 황금 철칙 (동종 카드 1~3장 선택 체험)
  | 'trade_execute'     // 4. 실시간 호가 및 1:1 맞교환 체험
  | 'fit_declare'       // 5. 9장 세트 완성 및 황금 벨 타격 (FIT!!)
  | 'complete';         // 6. 튜토리얼 완주 수료증

export interface TutorialState {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  highlightTarget: string; // 강조할 UI 영역 ('hand' | 'bot_euler' | 'bell' | 'none')
  message: string;
  subMessage: string;
}
