import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, PitGameStatus, PlayerCount, FitSubRule, TradePacing, TradeReport } from '../types/game';
import { FunctionCard, FunctionFamily } from '../types/math';
import { FUNCTION_CARDS, FAMILY_METAS } from '../data/functionCards';
import { soundEngine } from '../utils/audio';

const ALL_ROSTER_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: '나 (데카르트의 제자)',
    avatar: '📐',
    isHuman: true,
    hand: [],
    score: 0,
  },
  {
    id: 'bot_euler',
    name: '오일러 (L. Euler)',
    avatar: '🎩',
    isHuman: false,
    hand: [],
    score: 0,
  },
  {
    id: 'bot_gauss',
    name: '가우스 (C. Gauss)',
    avatar: '👑',
    isHuman: false,
    hand: [],
    score: 0,
  },
  {
    id: 'bot_leibniz',
    name: '라이프니츠 (G. Leibniz)',
    avatar: '📜',
    isHuman: false,
    hand: [],
    score: 0,
  },
];

// 인원수(N)에 따라 N개 함수 계열 추출하여 N x 9장 덱 구성
function createScaledPitDeck(
  playerCount: PlayerCount,
  allowedFamilies: FunctionFamily[]
): {
  deck: FunctionCard[];
  chosenFamilies: FunctionFamily[];
} {
  const defaultPool: FunctionFamily[] = ['linear', 'quadratic', 'rational', 'irrational'];
  const pool: FunctionFamily[] = allowedFamilies.length >= playerCount ? allowedFamilies : defaultPool;
  const shuffledFamilies: FunctionFamily[] = [...pool].sort(() => Math.random() - 0.5);
  const chosenFamilies: FunctionFamily[] = shuffledFamilies.slice(0, playerCount);

  const deck: FunctionCard[] = [];
  chosenFamilies.forEach((fam) => {
    const familyCards = FUNCTION_CARDS.filter((c) => c.family === fam);
    const selected = familyCards.slice(0, 9);
    deck.push(...selected);
  });

  // Fisher-Yates 셔플
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return { deck, chosenFamilies };
}

export function usePitGame(
  allowedFamilies: FunctionFamily[] = ['linear', 'quadratic', 'rational', 'irrational'],
  playerCount: PlayerCount = 4,
  fitSubRule: FitSubRule = 'classic'
) {
  const initialPlayers = ALL_ROSTER_PLAYERS.slice(0, playerCount);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameStatus, setGameStatus] = useState<PitGameStatus>({
    phase: 'idle',
    round: 1,
    winner: null,
    tradingLogs: [],
  });
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [activeFamilies, setActiveFamilies] = useState<FunctionFamily[]>([]);

  // 교육용 속도 조절 (기본: 수학 학습 모드 - 여유 있는 타이머 + 획득 카드 탐구 리포트)
  const [tradePacing, setTradePacing] = useState<TradePacing>('learning');
  const [tradeReport, setTradeReport] = useState<TradeReport | null>(null);
  const isReportOpenRef = useRef<boolean>(false);
  isReportOpenRef.current = !!tradeReport;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 인원수가 변경되면 플레이어 배열 갱신
  useEffect(() => {
    setPlayers(ALL_ROSTER_PLAYERS.slice(0, playerCount));
    setSelectedCardIds([]);
    setGameStatus((prev) => ({ ...prev, phase: 'idle', winner: null }));
  }, [playerCount]);

  const addLog = useCallback(
    (text: string, type: 'trade' | 'alert' | 'fit' | 'system' = 'trade') => {
      const now = new Date();
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
      setGameStatus((prev) => ({
        ...prev,
        tradingLogs: [
          { id: Math.random().toString(), text, type, time: timeStr },
          ...prev.tradingLogs.slice(0, 30),
        ],
      }));
    },
    []
  );

  const checkPlayerWin = useCallback((hand: FunctionCard[]): boolean => {
    if (hand.length !== 9) return false;
    const firstFamily = hand[0].family;
    return hand.every((c) => c.family === firstFamily);
  }, []);

  // 새 라운드 시작
  const startNewRound = useCallback(() => {
    const { deck, chosenFamilies } = createScaledPitDeck(playerCount, allowedFamilies);
    setActiveFamilies(chosenFamilies);

    soundEngine.playCardFlip();

    setPlayers(
      ALL_ROSTER_PLAYERS.slice(0, playerCount).map((player, idx) => {
        const hand = deck.slice(idx * 9, (idx + 1) * 9);
        const famCount = hand.reduce<Record<string, number>>((acc, card) => {
          acc[card.family] = (acc[card.family] || 0) + 1;
          return acc;
        }, {});
        const bestFam = Object.entries(famCount).sort(
          (a, b) => b[1] - a[1]
        )[0][0] as FunctionFamily;

        return {
          ...player,
          hand,
          targetFamily: bestFam,
          currentTradeOffer: undefined,
        };
      })
    );

    setSelectedCardIds([]);
    setGameStatus((prev) => ({
      ...prev,
      phase: 'trading',
      winner: null,
      winReason: undefined,
    }));

    const ruleName =
      fitSubRule === 'silent'
        ? '무언(손가락) 핏'
        : fitSubRule === 'open_hand'
        ? '오픈 핸드(멘토링)'
        : fitSubRule === 'team_2v2'
        ? '2:2 듀오 팀전'
        : '정통 핏';

    addLog(`새 라운드 시작 (${playerCount}인 모드, ${ruleName}, 총 ${playerCount * 9}장 분배)!`, 'system');
  }, [playerCount, allowedFamilies, fitSubRule, addLog]);

  const toggleSelectCard = useCallback(
    (card: FunctionCard) => {
      if (gameStatus.phase !== 'trading') return;

      setSelectedCardIds((prev) => {
        if (prev.includes(card.id)) {
          return prev.filter((id) => id !== card.id);
        }

        if (prev.length >= 3) return prev;

        const humanPlayer = players.find((p) => p.isHuman);
        if (humanPlayer && prev.length > 0) {
          const firstSelectedCard = humanPlayer.hand.find((c) => c.id === prev[0]);
          if (firstSelectedCard && firstSelectedCard.family !== card.family) {
            return [card.id];
          }
        }

        soundEngine.playCardFlip();
        return [...prev, card.id];
      });
    },
    [gameStatus.phase, players]
  );

  const clearSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

  const tradeWithBot = useCallback(
    (botId: string) => {
      if (gameStatus.phase !== 'trading') return;

      const human = players.find((p) => p.isHuman);
      const bot = players.find((p) => p.id === botId);

      if (!human || !bot || !bot.currentTradeOffer) return;

      const tradeCount = bot.currentTradeOffer.count;
      if (selectedCardIds.length !== tradeCount) return;

      const humanOfferedCards = human.hand.filter((c) => selectedCardIds.includes(c.id));
      const humanFamilies = new Set(humanOfferedCards.map((c) => c.family));
      if (humanFamilies.size > 1) {
        addLog('교환 실패: 서로 다른 계열의 카드는 섞어 교환할 수 없습니다!', 'alert');
        return;
      }

      const botOfferedCardIds = bot.currentTradeOffer.cardIds;
      const botOfferedCards = bot.hand.filter((c) => botOfferedCardIds.includes(c.id));

      const newHumanHand = [
        ...human.hand.filter((c) => !selectedCardIds.includes(c.id)),
        ...botOfferedCards,
      ];
      const newBotHand = [
        ...bot.hand.filter((c) => !botOfferedCardIds.includes(c.id)),
        ...humanOfferedCards,
      ];

      soundEngine.playTradeSuccess();
      addLog(`🤝 나와 ${bot.name}님이 ${tradeCount}장을 맞교환했습니다!`, 'trade');

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.isHuman) return { ...p, hand: newHumanHand };
          if (p.id === botId) return { ...p, hand: newBotHand, currentTradeOffer: undefined };
          return p;
        })
      );

      setSelectedCardIds([]);

      // 수학적 학습용 교환 리포트 생성 (학생이 새로 영입한 카드의 식/그래프/성질을 탐구할 수 있도록 팝업)
      const newHandCounts = newHumanHand.reduce<Record<string, number>>((acc, c) => {
        acc[c.family] = (acc[c.family] || 0) + 1;
        return acc;
      }, {});
      const [, domCount] = Object.entries(newHandCounts).sort(
        (a, b) => b[1] - a[1]
      )[0] as [FunctionFamily, number];

      const acquiredTarget = botOfferedCards.filter((c) => c.family === human.targetFamily);
      let coachComment = '';

      if (acquiredTarget.length > 0) {
        coachComment = `훌륭한 전략입니다! ${bot.name}님에게서 목표하던 [${FAMILY_METAS[human.targetFamily!].name}] 카드 ${acquiredTarget.length}장을 획득하여 완성에 한 걸음 더 다가섰습니다. 현재 주력 함수가 ${domCount}/9장 모였습니다.`;
      } else {
        const receivedFamNames = Array.from(new Set(botOfferedCards.map((c) => FAMILY_METAS[c.family].name))).join(', ');
        coachComment = `${bot.name}님과 카드를 맞교환했습니다. 새로 손패에 들어온 [${receivedFamNames}]의 수식, 꼭짓점, 점근선 및 그래프 형태를 꼼꼼히 확인하고 다음 교환 계획을 세워보세요!`;
      }

      setTradeReport({
        partnerName: bot.name,
        partnerAvatar: bot.avatar,
        givenCards: humanOfferedCards,
        receivedCards: botOfferedCards,
        targetFamily: human.targetFamily,
        dominantCount: domCount,
        comment: coachComment,
      });
    },
    [gameStatus.phase, players, selectedCardIds, addLog]
  );

  const ringPitBell = useCallback(
    (callerPlayerId?: string) => {
      const caller = callerPlayerId
        ? players.find((p) => p.id === callerPlayerId)
        : players.find((p) => p.isHuman);

      if (!caller || gameStatus.phase !== 'trading') return;

      const isWin = checkPlayerWin(caller.hand);

      if (isWin) {
        const winFamily = caller.hand[0].family;
        soundEngine.playBellRing();
        soundEngine.playCorrect();

        addLog(`🎉 [FIT!!] ${caller.name}님이 ${winFamily} 9장을 완성하여 데카르트 핏을 외쳤습니다!`, 'fit');

        setPlayers((prev) =>
          prev.map((p) => (p.id === caller.id ? { ...p, score: p.score + 1 } : p))
        );

        setGameStatus((prev) => ({
          ...prev,
          phase: 'round_over',
          winner: caller,
          winReason: `${caller.name}님이 한 종류의 함수 9장을 모두 모았습니다!`,
        }));
      } else {
        soundEngine.playWrong();
        addLog(`⚠️ [오선언] ${caller.name}님의 손패가 아직 완성되지 않았습니다!`, 'alert');
      }
    },
    [players, gameStatus.phase, checkPlayerWin, addLog]
  );

  // AI 의사결정 루프 (학습 모드: 6초 여유 주기, 표준: 3.8초, 스피드: 2.2초)
  useEffect(() => {
    if (gameStatus.phase !== 'trading') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs =
      tradePacing === 'learning' ? 6000 : tradePacing === 'normal' ? 3800 : 2200;

    timerRef.current = setInterval(() => {
      // 수학적 확인 창이 열려있는 동안은 AI들의 거래 타이머를 멈춤 (Freeze for Student Learning)
      if (isReportOpenRef.current) return;

      setPlayers((currentPlayers) => {
        let updated = [...currentPlayers];

        for (const bot of updated.filter((p) => !p.isHuman)) {
          if (checkPlayerWin(bot.hand)) {
            ringPitBell(bot.id);
            return updated;
          }
        }

        updated = updated.map((player) => {
          if (player.isHuman) return player;

          if (player.currentTradeOffer && Math.random() < 0.3) {
            return player;
          }

          const nonTargetCards = player.hand.filter((c) => c.family !== player.targetFamily);
          if (nonTargetCards.length === 0) {
            return { ...player, currentTradeOffer: undefined };
          }

          const byFamily: Record<FunctionFamily, FunctionCard[]> = {} as any;
          nonTargetCards.forEach((c) => {
            if (!byFamily[c.family]) byFamily[c.family] = [];
            byFamily[c.family].push(c);
          });

          const families = Object.keys(byFamily) as FunctionFamily[];
          if (families.length === 0) return player;

          const chosenFam = families[Math.floor(Math.random() * families.length)];
          const cardsOfFam = byFamily[chosenFam];
          const count = Math.min(cardsOfFam.length, Math.floor(Math.random() * 3) + 1);
          const offeredCards = cardsOfFam.slice(0, count);

          return {
            ...player,
            currentTradeOffer: {
              count,
              cardIds: offeredCards.map((c) => c.id),
              family: chosenFam,
              timestamp: Date.now(),
            },
          };
        });

        // 3인 이상일 때 AI-AI 교환 처리
        const botsWithOffers = updated.filter(
          (p) => !p.isHuman && p.currentTradeOffer
        );

        for (let i = 0; i < botsWithOffers.length; i++) {
          for (let j = i + 1; j < botsWithOffers.length; j++) {
            const b1 = botsWithOffers[i];
            const b2 = botsWithOffers[j];

            if (
              b1.currentTradeOffer &&
              b2.currentTradeOffer &&
              b1.currentTradeOffer.count === b2.currentTradeOffer.count &&
              b1.currentTradeOffer.family !== b2.currentTradeOffer.family
            ) {
              if (Math.random() < 0.45) {
                const count = b1.currentTradeOffer.count;
                const b1Cards = b1.hand.filter((c) =>
                  b1.currentTradeOffer!.cardIds.includes(c.id)
                );
                const b2Cards = b2.hand.filter((c) =>
                  b2.currentTradeOffer!.cardIds.includes(c.id)
                );

                const newB1Hand = [
                  ...b1.hand.filter((c) => !b1.currentTradeOffer!.cardIds.includes(c.id)),
                  ...b2Cards,
                ];
                const newB2Hand = [
                  ...b2.hand.filter((c) => !b2.currentTradeOffer!.cardIds.includes(c.id)),
                  ...b1Cards,
                ];

                addLog(`🔄 [AI 교환] ${b1.name}님과 ${b2.name}님이 ${count}장을 교환했습니다!`);

                updated = updated.map((p) => {
                  if (p.id === b1.id) {
                    return { ...p, hand: newB1Hand, currentTradeOffer: undefined };
                  }
                  if (p.id === b2.id) {
                    return { ...p, hand: newB2Hand, currentTradeOffer: undefined };
                  }
                  return p;
                });
                break;
              }
            }
          }
        }

        return updated;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus.phase, tradePacing, checkPlayerWin, ringPitBell, addLog]);

  const closeTradeReport = useCallback(() => {
    setTradeReport(null);
  }, []);

  const humanPlayer = players.find((p) => p.isHuman);
  const canHumanFit = humanPlayer ? checkPlayerWin(humanPlayer.hand) : false;

  return {
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
    addLog,
    tradePacing,
    setTradePacing,
    tradeReport,
    closeTradeReport,
  };
}
