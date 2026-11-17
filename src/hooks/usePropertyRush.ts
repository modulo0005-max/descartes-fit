import { useState, useEffect, useCallback, useRef } from 'react';
import { RushMission } from '../types/game';
import { FunctionCard, FunctionFamily } from '../types/math';
import { RUSH_MISSIONS } from '../data/missions';
import { FUNCTION_CARDS } from '../data/functionCards';
import { soundEngine } from '../utils/audio';

export function usePropertyRush(allowedFamilies: FunctionFamily[] = ['linear', 'quadratic', 'rational', 'irrational']) {
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentMission, setCurrentMission] = useState<RushMission>(RUSH_MISSIONS[0]);
  const [options, setOptions] = useState<FunctionCard[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [roundHistory, setRoundHistory] = useState<
    { mission: RushMission; chosen: FunctionCard; isCorrect: boolean }[]
  >([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 현재 허용된 교육과정 카드 풀
  const filteredPool = FUNCTION_CARDS.filter((c) => allowedFamilies.includes(c.family));

  // 새 문제 생성 (허용된 카드 풀 기반)
  const generateNewQuestion = useCallback(() => {
    // 고1 설정 시 극값, 주기함수 미션 배제
    const isHigh1Only =
      !allowedFamilies.includes('cubic') &&
      !allowedFamilies.includes('trigonometric') &&
      !allowedFamilies.includes('exponential') &&
      !allowedFamilies.includes('logarithmic');

    // 풀 내에서 정답을 가진 미션들만 필터링
    const validMissions = RUSH_MISSIONS.filter((m) => {
      if (isHigh1Only && m.minGrade === 'high2') return false;
      return filteredPool.some((c) => c.properties.includes(m.property));
    });
    const missionPool = validMissions.length > 0 ? validMissions : RUSH_MISSIONS;
    const randomMission = missionPool[Math.floor(Math.random() * missionPool.length)];
    setCurrentMission(randomMission);

    // 해당 미션의 성질을 가진 허용 카드들
    const correctCandidates = filteredPool.filter((c) =>
      c.properties.includes(randomMission.property)
    );
    // 해당 미션의 성질을 갖지 않는 허용 카드들
    const wrongCandidates = filteredPool.filter(
      (c) => !c.properties.includes(randomMission.property)
    );

    const correctCard =
      correctCandidates.length > 0
        ? correctCandidates[Math.floor(Math.random() * correctCandidates.length)]
        : filteredPool[0];

    const shuffledWrong = [...wrongCandidates].sort(() => Math.random() - 0.5);
    const wrongCards = shuffledWrong.slice(0, 3);

    const fourOptions = [correctCard, ...wrongCards].sort(() => Math.random() - 0.5);
    setOptions(fourOptions);
    setFeedback(null);
  }, [filteredPool]);

  const startGame = useCallback(() => {
    setIsActive(true);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(45);
    setRoundHistory([]);
    generateNewQuestion();
    soundEngine.playBellRing();
  }, [generateNewQuestion]);

  const submitAnswer = useCallback(
    (card: FunctionCard) => {
      if (!isActive) return;

      const isCorrect = card.properties.includes(currentMission.property);

      setRoundHistory((prev) => [
        { mission: currentMission, chosen: card, isCorrect },
        ...prev,
      ]);

      if (isCorrect) {
        soundEngine.playCorrect();
        const comboBonus = combo * 20;
        const earned = 100 + comboBonus;
        setScore((prev) => prev + earned);
        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });
        setTimeLeft((t) => Math.min(t + 2, 60));
        setFeedback('correct');
      } else {
        soundEngine.playWrong();
        setCombo(0);
        setTimeLeft((t) => Math.max(t - 3, 0));
        setFeedback('wrong');
      }

      setTimeout(() => {
        generateNewQuestion();
      }, 350);
    },
    [isActive, currentMission, combo, generateNewQuestion]
  );

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsActive(false);
          soundEngine.playBellRing();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  return {
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
  };
}
