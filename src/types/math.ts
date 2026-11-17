// 수학 함수 계열 (Family)
export type FunctionFamily = 
  | 'linear'       // 일차함수 (중2 / 고1)
  | 'quadratic'    // 이차함수 (중3 / 고1 공통수학1)
  | 'cubic'        // 삼차함수 (고2 수학 II)
  | 'rational'     // 유리함수 (고1 공통수학2)
  | 'irrational'   // 무리함수 (고1 공통수학2)
  | 'exponential'  // 지수함수 (고2 수학 I)
  | 'logarithmic'  // 로그함수 (고2 수학 I)
  | 'trigonometric'; // 삼각함수 (고2 수학 I)

// 함수의 주요 수학적 성질 태그 (교육과정별 정밀 분리)
export type PropertyTag = 
  | 'origin_symmetry'     // 원점 대칭 (기함수) - 고1 공통
  | 'y_axis_symmetry'     // y축 대칭 (우함수) - 고1 공통
  | 'always_increasing'   // 증가함수 - 고1 공통
  | 'always_decreasing'   // 감소함수 - 고1 공통
  | 'has_max_or_min'      // 최댓값 또는 최솟값 보유 (이차함수 꼭짓점) - 고1 공통
  | 'has_asymptote'       // 점근선 보유 - 고1 유리함수
  | 'all_real_domain'     // 정의역: 모든 실수 - 고1 공통
  | 'limited_domain'      // 정의역 제한 (분모≠0, 루트 안≥0) - 고1 유리/무리
  | 'passes_origin'       // 원점 (0,0) 통과 - 고1 공통
  | 'has_extremum'        // 극값 보유 (미적분) - 고2 수학 II 이상
  | 'has_two_extrema'     // 극대·극소 모두 보유 - 고2 수학 II 이상
  | 'periodic';           // 주기함수 - 고2 수학 I 이상

export interface FunctionFamilyMeta {
  id: FunctionFamily;
  name: string;
  nameEn: string;
  generalForm: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  description: string;
  curriculum: string; // 교과과정 (중2, 고1, 수1, 수2 등)
  minGrade: 'middle' | 'high1' | 'high2'; // 최소 진도 학년
}

export interface FunctionCard {
  id: string;
  family: FunctionFamily;
  title: string;
  expression: string;
  evaluator: (x: number) => number | null;
  domain: [number, number];
  properties: PropertyTag[];
  features: {
    domainStr: string;     // 정의역
    rangeStr: string;      // 치역
    intercepts?: string;   // 절편 (x절편, y절편)
    asymptotes?: string;   // 점근선 (유리/지수/로그)
    symmetry?: string;     // 대칭성 (원점 대칭, y축 대칭 등)
    extrema?: string;      // 고1: 최댓값/최솟값, 고2/수2: 극값
  };
  pointsOfInterest?: { x: number; y: number; label: string }[];
}
