import { FunctionFamily } from '../types/math';

export type CurriculumPresetId =
  | 'high1_common'          // 고1 공통수학 (일차, 이차, 유리, 무리)
  | 'math1_transcendental'  // 고2 수학 I (지수, 로그, 삼각 + 이차)
  | 'math2_calculus'        // 고2 수학 II / 미적분 (다항함수 + 유리)
  | 'middle_advanced'       // 중학 심화 (일차, 이차)
  | 'all'                   // 전범위 종합 (8대 함수 전체)
  | 'custom';               // 선생님 직접 선택

export interface CurriculumPreset {
  id: CurriculumPresetId;
  name: string;
  subtitle: string;
  targetGrade: string;
  description: string;
  allowedFamilies: FunctionFamily[];
  badgeColor: string;
}

export const CURRICULUM_PRESETS: Record<CurriculumPresetId, CurriculumPreset> = {
  high1_common: {
    id: 'high1_common',
    name: '고1 공통수학 코스',
    subtitle: '일차 · 이차 · 유리 · 무리함수',
    targetGrade: '고등학교 1학년',
    description: '공통수학1과 공통수학2(수학 상/하)에서 다루는 다항함수 및 분수/무리식 기본 곡선 4종으로 구성됩니다.',
    allowedFamilies: ['linear', 'quadratic', 'rational', 'irrational'],
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  math1_transcendental: {
    id: 'math1_transcendental',
    name: '고2 수학 I (초월함수) 코스',
    subtitle: '지수 · 로그 · 삼각 · 이차함수',
    targetGrade: '고등학교 2학년',
    description: '수학 I의 핵심인 지수함수, 로그함수, 삼각함수의 주기성과 점근선을 집중 훈련합니다.',
    allowedFamilies: ['exponential', 'logarithmic', 'trigonometric', 'quadratic'],
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  math2_calculus: {
    id: 'math2_calculus',
    name: '고2/고3 수학 II (다항미적) 코스',
    subtitle: '일차 · 이차 · 삼차 · 유리함수',
    targetGrade: '고등학교 2~3학년',
    description: '수학 II 미적분의 주인공인 삼차함수의 극대/극소, 변곡점, 대칭성을 종합적으로 탐구합니다.',
    allowedFamilies: ['linear', 'quadratic', 'cubic', 'rational'],
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  middle_advanced: {
    id: 'middle_advanced',
    name: '중등 심화 연계 코스',
    subtitle: '일차 · 이차 · 유리(반비례) · 무리',
    targetGrade: '중2~중3 / 예비고1',
    description: '중등 직선/포물선과 반비례 쌍곡선을 바탕으로 고등 기초 함수로 넘어가는 입문 세트입니다.',
    allowedFamilies: ['linear', 'quadratic', 'rational', 'irrational'],
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  all: {
    id: 'all',
    name: '전범위 마스터 코스',
    subtitle: '8대 모든 함수 무작위 출제',
    targetGrade: '수능 / 고등 전과정',
    description: '일차, 이차, 삼차, 유리, 무리, 지수, 로그, 삼각함수 중 매 게임 4개 패밀리가 무작위 셔플됩니다.',
    allowedFamilies: [
      'linear',
      'quadratic',
      'cubic',
      'rational',
      'irrational',
      'exponential',
      'logarithmic',
      'trigonometric',
    ],
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  custom: {
    id: 'custom',
    name: '선생님 맞춤 설정',
    subtitle: '수업 진도에 맞춘 4개 이상 자유 선택',
    targetGrade: '교사 자유 지정',
    description: '이번 수업 진도나 학생 수준에 맞춰 원하는 함수 종류를 직접 체크하여 덱을 구성합니다.',
    allowedFamilies: ['linear', 'quadratic', 'rational', 'irrational'],
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
};
