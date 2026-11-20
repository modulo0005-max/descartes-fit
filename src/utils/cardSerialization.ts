import { FunctionCard } from '../types/math';
import { FUNCTION_CARDS } from '../data/functionCards';

/**
 * WebRTC DataChannel은 함수(Function)를 직렬화(Structured Clone)할 수 없으므로,
 * 네트워크 전송 전 evaluator 함수를 제거하거나 순수 직렬화 가능한 형태로 변환합니다.
 */
export function sanitizeCardForNetwork(card: FunctionCard): Omit<FunctionCard, 'evaluator'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { evaluator, ...safeCard } = card;
  return safeCard;
}

export function sanitizeCardsForNetwork(cards: FunctionCard[]): Omit<FunctionCard, 'evaluator'>[] {
  return cards.map(sanitizeCardForNetwork);
}

/**
 * 수신된 직렬화 카드(또는 ID)를 FUNCTION_CARDS 사전에서 찾아
 * 실제 실행 가능한 evaluator 함수를 포함한 온전한 FunctionCard로 복원(Hydrate)합니다.
 */
export function hydrateCard(cardOrId: { id?: string } | string | null | undefined): FunctionCard {
  if (!cardOrId) {
    return FUNCTION_CARDS[0];
  }
  const id = typeof cardOrId === 'string' ? cardOrId : cardOrId.id;
  const found = FUNCTION_CARDS.find((c) => c.id === id);
  if (found) return found;

  // 비상용 폴백 카드
  return {
    id: id || 'fallback_lin',
    family: 'linear',
    title: '함수 카드',
    expression: 'f(x) = x',
    evaluator: (x: number) => x,
    domain: [-6, 6],
    properties: ['all_real_domain', 'passes_origin'],
    features: { domainStr: '모든 실수 ℝ', rangeStr: '모든 실수 ℝ', intercepts: '원점 (0,0)', symmetry: '원점 대칭' },
    pointsOfInterest: [{ x: 0, y: 0, label: '(0,0)' }],
  };
}

export function hydrateCards(cardsOrIds: ({ id?: string } | string)[] | undefined): FunctionCard[] {
  if (!Array.isArray(cardsOrIds)) return [];
  return cardsOrIds.map(hydrateCard);
}

/**
 * 네트워크 메시지 내부의 모든 객체를 재귀적으로 순회하여
 * evaluator 함수 프로퍼티를 완전히 배제하여 WebRTC DataCloneError를 100% 방지합니다.
 */
export function sanitizeMessageForNetwork<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'function') return undefined as unknown as T;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMessageForNetwork) as unknown as T;
  }
  if (typeof obj === 'object') {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      if (key === 'evaluator') {
        // 함수 제거!
        continue;
      }
      copy[key] = sanitizeMessageForNetwork((obj as Record<string, unknown>)[key]);
    }
    return copy as T;
  }
  return obj;
}
