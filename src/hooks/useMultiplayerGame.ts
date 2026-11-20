import { useState, useEffect, useCallback, useRef } from 'react';
import { peerService } from '../services/peerService';
import {
  MultiplayerRoomState,
  MultiplayerGameType,
  RemotePlayer,
  NetworkMessage,
} from '../types/multiplayer';
import { FunctionCard, FunctionFamily } from '../types/math';
import { FUNCTION_CARDS } from '../data/functionCards';
import { soundEngine } from '../utils/audio';
import { hydrateCard, hydrateCards } from '../utils/cardSerialization';

const PEER_ROOM_PREFIX = 'descartes-fit-';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const AVATARS = ['🎓', '📐', '🚀', '⭐', '🦁', '🦊', '🦉', '🐱'];

export const BATTLE_CONDITIONS = [
  {
    title: 'x = 1 대입 함숫값 f(1) 배틀!',
    xValue: 1,
    desc: '각 카드의 x에 1을 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
    evaluatorFn: (c: FunctionCard) => {
      try {
        return c.evaluator(1);
      } catch {
        return null;
      }
    },
  },
  {
    title: 'x = 2 대입 함숫값 f(2) 배틀!',
    xValue: 2,
    desc: '각 카드의 x에 2를 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
    evaluatorFn: (c: FunctionCard) => {
      try {
        return c.evaluator(2);
      } catch {
        return null;
      }
    },
  },
  {
    title: 'y절편 f(0) 크기 배틀!',
    xValue: 0,
    desc: 'y축과 만나는 교점의 y좌표(y절편)가 더 큰 쪽이 승리합니다.',
    evaluatorFn: (c: FunctionCard) => {
      try {
        return c.evaluator(0);
      } catch {
        return null;
      }
    },
  },
  {
    title: 'x = -1 대입 함숫값 f(-1) 배틀!',
    xValue: -1,
    desc: '각 카드의 x에 -1을 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
    evaluatorFn: (c: FunctionCard) => {
      try {
        return c.evaluator(-1);
      } catch {
        return null;
      }
    },
  },
  {
    title: 'x = 3 대입 함숫값 f(3) 배틀!',
    xValue: 3,
    desc: '각 카드의 x에 3을 대입했을 때 함숫값이 더 큰 쪽이 승리합니다.',
    evaluatorFn: (c: FunctionCard) => {
      try {
        return c.evaluator(3);
      } catch {
        return null;
      }
    },
  },
];

export function useMultiplayerGame() {
  const [roomState, setRoomState] = useState<MultiplayerRoomState>({
    roomId: '',
    role: 'client',
    status: 'idle',
    gameType: 'pit',
    players: [],
    myPeerId: '',
    myName: `학생${Math.floor(Math.random() * 90 + 10)}`,
    myAvatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    myHand: [],
    activeFamilies: [],
    winner: null,
    logs: [],
  });

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 최신 state를 ref로 보관하여 이벤트 리스너 클로저 내에서 최신 값 참조
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;

  const selectedCardIdsRef = useRef(selectedCardIds);
  selectedCardIdsRef.current = selectedCardIds;

  // 호스트 전용: 모든 플레이어의 실제 손패 보관 (Host-Authoritative 보안 및 공정 거래)
  const hostPlayerHands = useRef<Map<string, FunctionCard[]>>(new Map());
  const hostPendingTradeOffers = useRef<
    Map<string, { count: number; cardIds: string[] }>
  >(new Map());

  // 호스트 전용: 데카르트 X 상태
  const hostDeckX = useRef<FunctionCard[]>([]);
  const hostTopCardX = useRef<FunctionCard | null>(null);
  const hostTurnPeerIdX = useRef<string>('');

  // 호스트 전용: 데카르트 Y 상태
  const hostSubmissionsY = useRef<Map<string, FunctionCard>>(new Map());
  const hostScoresY = useRef<Record<string, number>>({});
  const hostRoundY = useRef<number>(1);
  const hostConditionIndexY = useRef<number>(0);

  const addLog = useCallback(
    (text: string, type: 'trade' | 'alert' | 'fit' | 'system' = 'trade') => {
      const now = new Date();
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
      setRoomState((prev) => ({
        ...prev,
        logs: [
          { id: Math.random().toString(), text, time: timeStr, type },
          ...prev.logs.slice(0, 30),
        ],
      }));
    },
    []
  );

  // 핸드셰이크 재시도 및 타임아웃 타이머
  const handshakeRetryTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const handshakeTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHandshakeTimers = useCallback(() => {
    if (handshakeRetryTimer.current) {
      clearInterval(handshakeRetryTimer.current);
      handshakeRetryTimer.current = null;
    }
    if (handshakeTimeoutTimer.current) {
      clearTimeout(handshakeTimeoutTimer.current);
      handshakeTimeoutTimer.current = null;
    }
  }, []);

  // [방 생성 - 호스트]
  const createRoom = useCallback(
    (customName?: string) => {
      clearHandshakeTimers();
      const code = generateRoomCode();
      const hostPeerId = `${PEER_ROOM_PREFIX}${code.toLowerCase()}`;
      const name = customName || roomStateRef.current.myName;

      setErrorMessage(null);
      setRoomState((prev) => ({
        ...prev,
        roomId: code,
        role: 'host',
        status: 'connecting',
        myName: name,
        players: [],
      }));

      peerService.init(
        hostPeerId,
        (assignedId) => {
          const hostPlayer: RemotePlayer = {
            peerId: assignedId,
            name,
            avatar: roomStateRef.current.myAvatar,
            isHost: true,
            isReady: true,
            cardCount: 0,
          };

          setRoomState((prev) => ({
            ...prev,
            status: 'lobby',
            myPeerId: assignedId,
            players: [hostPlayer],
          }));

          addLog(`방이 생성되었습니다! [방 코드: ${code}]`, 'system');
        },
        (err: any) => {
          console.error('Peer init error:', err);
          const errType = err?.type;
          const errMsg = err?.message || '';
          if (
            errType === 'unavailable-id' ||
            errMsg.includes('taken') ||
            errMsg.includes('unavailable-id')
          ) {
            setErrorMessage('기존 룸 코드가 점유되어 있어 새 코드로 재시도합니다...');
            peerService.destroy();
            setTimeout(() => createRoom(customName), 500);
          } else {
            setErrorMessage(`방 생성 실패: ${errMsg || '네트워크 오류가 발생했습니다.'}`);
            setRoomState((prev) => ({ ...prev, status: 'idle' }));
          }
        }
      );
    },
    [addLog, clearHandshakeTimers]
  );

  // [방 입장 - 참가자]
  const joinRoom = useCallback(
    (codeToJoin: string, customName?: string) => {
      clearHandshakeTimers();

      const trimmedCode = codeToJoin.trim().toUpperCase();
      if (!trimmedCode) return;

      const hostPeerId = `${PEER_ROOM_PREFIX}${trimmedCode.toLowerCase()}`;
      const name = customName || roomStateRef.current.myName;

      setErrorMessage(null);
      setRoomState((prev) => ({
        ...prev,
        roomId: trimmedCode,
        role: 'client',
        status: 'connecting',
        myName: name,
        players: [],
      }));

      peerService.init(
        undefined, // 임의 Peer ID
        (myId) => {
          setRoomState((prev) => ({ ...prev, myPeerId: myId }));

          peerService.connectToHost(
            hostPeerId,
            () => {
              const joinPayload: NetworkMessage = {
                type: 'JOIN',
                name,
                avatar: roomStateRef.current.myAvatar,
              };

              // 1차 즉시 전송
              peerService.sendTo(hostPeerId, joinPayload);

              // 800ms 주기로 JOIN_ACK 수신 전까지 최대 6회 재전송 (WebRTC 첫 패킷 드롭 방지)
              let retries = 0;
              handshakeRetryTimer.current = setInterval(() => {
                retries++;
                if (retries >= 6) {
                  clearHandshakeTimers();
                  return;
                }
                peerService.sendTo(hostPeerId, joinPayload);
              }, 800);

              // 8초 타임아웃
              handshakeTimeoutTimer.current = setTimeout(() => {
                clearHandshakeTimers();
                const current = roomStateRef.current;
                if (current.status !== 'lobby' && current.status !== 'playing') {
                  setErrorMessage('호스트로부터 응답이 없습니다. 방 코드가 정확한지 확인해 주세요.');
                  setRoomState((prev) => ({ ...prev, status: 'idle' }));
                  peerService.destroy();
                }
              }, 8000);
            },
            (err) => {
              clearHandshakeTimers();
              setErrorMessage(`호스트 연결 실패: ${err.message}`);
              setRoomState((prev) => ({ ...prev, status: 'idle' }));
            }
          );
        },
        (err) => {
          clearHandshakeTimers();
          setErrorMessage(`P2P 네트워크 초기화 실패: ${err.message}`);
          setRoomState((prev) => ({ ...prev, status: 'idle' }));
        }
      );
    },
    [clearHandshakeTimers]
  );

  // [호스트 전용: 3대 모드 (핏 / X / Y) 게임 시작 및 셔플 분배]
  const startMultiplayerGame = useCallback(
    (
      gameType: MultiplayerGameType = 'pit',
      allowedFamilies?: FunctionFamily[]
    ) => {
      try {
        const current = roomStateRef.current;
        const isHost =
          current.role === 'host' ||
          current.players.some((p) => p.peerId === current.myPeerId && p.isHost) ||
          roomState.role === 'host';

        if (!isHost) {
          console.warn('[startMultiplayerGame] Not host, aborting start');
          return;
        }

        const playerCount = current.players.length;
        if (playerCount < 2) {
          setErrorMessage('최소 2명 이상의 플레이어가 대기실에 접속해야 게임을 시작할 수 있습니다.');
          return;
        }

      const basePool: FunctionFamily[] =
        allowedFamilies && allowedFamilies.length >= 2
          ? allowedFamilies
          : [
              'linear',
              'quadratic',
              'rational',
              'irrational',
              'cubic',
              'exponential',
              'logarithmic',
              'trigonometric',
            ];

      hostPlayerHands.current.clear();
      hostPendingTradeOffers.current.clear();

      // ==============================================================
      // 1. 데카르트 핏 모드 (실시간 교환 / 세트 컬렉션)
      // ==============================================================
      if (gameType === 'pit') {
        const neededFamilyCount = Math.min(playerCount, 4);
        const chosenFamilies = [...basePool]
          .sort(() => Math.random() - 0.5)
          .slice(0, neededFamilyCount);

        const deck: FunctionCard[] = [];
        chosenFamilies.forEach((fam) => {
          deck.push(...FUNCTION_CARDS.filter((c) => c.family === fam).slice(0, 9));
        });

        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const updatedPlayers = current.players.map((p, idx) => {
          const playerHand = deck.slice(idx * 9, (idx + 1) * 9);
          hostPlayerHands.current.set(p.peerId, playerHand);

          if (!p.isHost) {
            peerService.sendTo(p.peerId, {
              type: 'GAME_STARTED',
              gameType: 'pit',
              yourHand: playerHand,
              activeFamilies: chosenFamilies,
            });
          }
          return { ...p, cardCount: 9, currentOfferCount: undefined };
        });

        const hostHand = hostPlayerHands.current.get(current.myPeerId) || [];

        setRoomState((prev) => ({
          ...prev,
          status: 'playing',
          gameType: 'pit',
          players: updatedPlayers,
          myHand: hostHand,
          activeFamilies: chosenFamilies,
          winner: null,
        }));

        soundEngine.playCardFlip();
        const modeLabel =
          playerCount === 2
            ? '2인 듀얼 (총 18장 / 2개 함수)'
            : playerCount === 3
            ? '3인 삼파전 (총 27장 / 3개 함수)'
            : '4인 표준 대전 (총 36장 / 4개 함수)';
        addLog(`🎮 [데카르트 핏] ${modeLabel} 게임이 시작되었습니다! 카드를 9장씩 나누어 가졌습니다.`, 'system');
      }

      // ==============================================================
      // 2. 데카르트 X 모드 (성질 털기 배틀 / 원카드·우노 스타일)
      // ==============================================================
      else if (gameType === 'descartes_x') {
        const pool = FUNCTION_CARDS.filter((c) => basePool.includes(c.family));
        const deck = [...pool].sort(() => Math.random() - 0.5);

        // 각 플레이어에게 5장씩 배분
        current.players.forEach((p, idx) => {
          const hand = deck.slice(idx * 5, (idx + 1) * 5);
          hostPlayerHands.current.set(p.peerId, hand);
        });

        const topCard = deck[playerCount * 5];
        const remainingDeck = deck.slice(playerCount * 5 + 1);

        hostTopCardX.current = topCard;
        hostDeckX.current = remainingDeck;
        hostTurnPeerIdX.current = current.myPeerId; // 호스트 먼저 시작

        const playerCardCounts = current.players.map((p) => ({
          peerId: p.peerId,
          count: 5,
        }));

        const updatedPlayers = current.players.map((p) => ({
          ...p,
          cardCount: 5,
        }));

        current.players.forEach((p) => {
          if (!p.isHost) {
            peerService.sendTo(p.peerId, {
              type: 'GAME_STARTED',
              gameType: 'descartes_x',
              yourHand: hostPlayerHands.current.get(p.peerId) || [],
              activeFamilies: basePool,
              topCard,
              currentTurnPeerId: hostTurnPeerIdX.current,
              deckCount: remainingDeck.length,
            });
          }
        });

        const hostHand = hostPlayerHands.current.get(current.myPeerId) || [];

        setRoomState((prev) => ({
          ...prev,
          status: 'playing',
          gameType: 'descartes_x',
          players: updatedPlayers,
          myHand: hostHand,
          activeFamilies: basePool,
          winner: null,
          xState: {
            topCard,
            currentTurnPeerId: hostTurnPeerIdX.current,
            deckCount: remainingDeck.length,
            playerCardCounts,
          },
        }));

        soundEngine.playCardFlip();
        addLog(`🃏 [데카르트 X] 성질 털기 배틀이 시작되었습니다! 카드를 5장씩 받았습니다.`, 'system');
      }

      // ==============================================================
      // 3. 데카르트 Y 모드 (좌표 함숫값 대결 / 탑트럼프 스타일)
      // ==============================================================
      else if (gameType === 'descartes_y') {
        const pool = FUNCTION_CARDS.filter((c) => basePool.includes(c.family));
        const deck = [...pool].sort(() => Math.random() - 0.5);

        // 각 플레이어에게 5장씩 배분
        current.players.forEach((p, idx) => {
          const hand = deck.slice(idx * 5, (idx + 1) * 5);
          hostPlayerHands.current.set(p.peerId, hand);
        });

        const initialScores: Record<string, number> = {};
        current.players.forEach((p) => {
          initialScores[p.peerId] = 0;
        });

        hostScoresY.current = initialScores;
        hostRoundY.current = 1;
        hostConditionIndexY.current = Math.floor(Math.random() * BATTLE_CONDITIONS.length);
        hostSubmissionsY.current.clear();

        const updatedPlayers = current.players.map((p) => ({
          ...p,
          cardCount: 5,
        }));

        current.players.forEach((p) => {
          if (!p.isHost) {
            peerService.sendTo(p.peerId, {
              type: 'GAME_STARTED',
              gameType: 'descartes_y',
              yourHand: hostPlayerHands.current.get(p.peerId) || [],
              activeFamilies: basePool,
              conditionIndex: hostConditionIndexY.current,
            });
          }
        });

        const hostHand = hostPlayerHands.current.get(current.myPeerId) || [];

        setRoomState((prev) => ({
          ...prev,
          status: 'playing',
          gameType: 'descartes_y',
          players: updatedPlayers,
          myHand: hostHand,
          activeFamilies: basePool,
          winner: null,
          yState: {
            round: 1,
            conditionIndex: hostConditionIndexY.current,
            hasSubmitted: false,
            submittedCard: null,
            roundResult: null,
            scores: initialScores,
          },
        }));

        soundEngine.playCardFlip();
        addLog(`⚔️ [데카르트 Y] 좌표 함숫값 배틀이 시작되었습니다! 각자 카드를 5장씩 받았습니다.`, 'system');
      }
    } catch (err) {
      console.error('[startMultiplayerGame] Exception occurred:', err);
      setErrorMessage(`게임 시작 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  [addLog, roomState.role]
);

  // [데카르트 X 액션: 카드 내기]
  const playCardX = useCallback(
    (card: FunctionCard) => {
      const current = roomStateRef.current;
      if (current.gameType !== 'descartes_x' || !current.xState) return;
      if (current.xState.currentTurnPeerId !== current.myPeerId) {
        addLog('⚠️ 아직 내 차례가 아닙니다!', 'alert');
        return;
      }

      const topCard = current.xState.topCard;
      if (!topCard) return;

      // 공통 성질 검사 (계열이 같거나, 성질 태그가 최소 1개 이상 겹치는지)
      const hasCommon =
        card.family === topCard.family ||
        card.properties.some((p) => topCard.properties.includes(p));

      if (!hasCommon) {
        soundEngine.playWrong();
        addLog('❌ 바닥 카드와 공통 성질(또는 같은 계열)이 없습니다!', 'alert');
        return;
      }

      if (current.role === 'client') {
        // 호스트에게 카드 내기 요청 전송
        peerService.broadcast({
          type: 'PLAY_CARD_X',
          peerId: current.myPeerId,
          card,
        });
        // 내 손패 즉시 선반영
        setRoomState((prev) => ({
          ...prev,
          myHand: prev.myHand.filter((c) => c.id !== card.id),
        }));
      } else {
        // 호스트 자신이 직접 카드 내기
        executePlayCardX(current.myPeerId, card);
      }
    },
    [addLog]
  );

  // [데카르트 X 액션: 1장 드로우 & 턴 넘김]
  const drawCardX = useCallback(() => {
    const current = roomStateRef.current;
    if (current.gameType !== 'descartes_x' || !current.xState) return;
    if (current.xState.currentTurnPeerId !== current.myPeerId) {
      addLog('⚠️ 아직 내 차례가 아닙니다!', 'alert');
      return;
    }

    if (current.role === 'client') {
      peerService.broadcast({
        type: 'DRAW_CARD_X',
        peerId: current.myPeerId,
      });
    } else {
      executeDrawCardX(current.myPeerId);
    }
  }, [addLog]);

  // [호스트 내부: X 카드 내기 실행 및 다음 턴 전파]
  const executePlayCardX = (peerId: string, card: FunctionCard) => {
    const current = roomStateRef.current;
    const hand = hostPlayerHands.current.get(peerId) || [];
    const newHand = hand.filter((c) => c.id !== card.id);
    hostPlayerHands.current.set(peerId, newHand);

    hostTopCardX.current = card;
    const playerObj = current.players.find((p) => p.peerId === peerId);
    const pName = playerObj?.name || '플레이어';

    soundEngine.playTradeSuccess();

    // 승리 조건 검사: 손패 0장
    if (newHand.length === 0) {
      soundEngine.playCorrect();
      peerService.broadcast({
        type: 'GAME_OVER_X',
        winnerPeerId: peerId,
        winnerName: pName,
      });
      setRoomState((prev) => ({
        ...prev,
        status: 'game_over',
        winner: pName,
      }));
      addLog(`🎉 [VICTORY] ${pName} 님이 손패를 모두 털어내어 승리했습니다!`, 'fit');
      return;
    }

    // 다음 턴 플레이어 계산
    const playerIdx = current.players.findIndex((p) => p.peerId === peerId);
    const nextIdx = (playerIdx + 1) % current.players.length;
    const nextTurnPeerId = current.players[nextIdx].peerId;
    hostTurnPeerIdX.current = nextTurnPeerId;

    const playerCardCounts = current.players.map((p) => ({
      peerId: p.peerId,
      count: hostPlayerHands.current.get(p.peerId)?.length || 0,
    }));

    const logText = `🃏 [${pName}] 님이 [${card.expression}] 카드를 냈습니다! 다음 차례로 넘어갑니다.`;

    peerService.broadcast({
      type: 'SYNC_STATE_X',
      topCard: card,
      currentTurnPeerId: nextTurnPeerId,
      deckCount: hostDeckX.current.length,
      playerCardCounts,
      logText,
    });

    if (peerId === current.myPeerId) {
      setRoomState((prev) => ({
        ...prev,
        myHand: newHand,
        xState: {
          topCard: card,
          currentTurnPeerId: nextTurnPeerId,
          deckCount: hostDeckX.current.length,
          playerCardCounts,
        },
      }));
    } else {
      setRoomState((prev) => ({
        ...prev,
        xState: {
          topCard: card,
          currentTurnPeerId: nextTurnPeerId,
          deckCount: hostDeckX.current.length,
          playerCardCounts,
        },
      }));
    }
    addLog(logText, 'trade');
  };

  // [호스트 내부: X 드로우 실행]
  const executeDrawCardX = (peerId: string) => {
    const current = roomStateRef.current;
    if (hostDeckX.current.length === 0) {
      addLog('덱이 모두 소진되었습니다. 다음 차례로 넘깁니다.', 'alert');
    } else {
      const drawn = hostDeckX.current[0];
      hostDeckX.current = hostDeckX.current.slice(1);
      const hand = hostPlayerHands.current.get(peerId) || [];
      const newHand = [...hand, drawn];
      hostPlayerHands.current.set(peerId, newHand);

      if (peerId === current.myPeerId) {
        setRoomState((prev) => ({ ...prev, myHand: newHand }));
      } else {
        peerService.sendTo(peerId, {
          type: 'DRAW_ACK_X',
          drawnCard: drawn,
        });
      }
    }

    const playerIdx = current.players.findIndex((p) => p.peerId === peerId);
    const nextIdx = (playerIdx + 1) % current.players.length;
    const nextTurnPeerId = current.players[nextIdx].peerId;
    hostTurnPeerIdX.current = nextTurnPeerId;

    const playerObj = current.players.find((p) => p.peerId === peerId);
    const pName = playerObj?.name || '플레이어';

    const playerCardCounts = current.players.map((p) => ({
      peerId: p.peerId,
      count: hostPlayerHands.current.get(p.peerId)?.length || 0,
    }));

    const logText = `📥 [${pName}] 님이 덱에서 1장을 뽑고 차례를 넘겼습니다.`;

    if (hostTopCardX.current) {
      peerService.broadcast({
        type: 'SYNC_STATE_X',
        topCard: hostTopCardX.current,
        currentTurnPeerId: nextTurnPeerId,
        deckCount: hostDeckX.current.length,
        playerCardCounts,
        logText,
      });

      setRoomState((prev) => ({
        ...prev,
        xState: {
          topCard: hostTopCardX.current,
          currentTurnPeerId: nextTurnPeerId,
          deckCount: hostDeckX.current.length,
          playerCardCounts,
        },
      }));
    }
    addLog(logText, 'system');
  };

  // [데카르트 Y 액션: 라운드 출전 카드 제출]
  const submitCardY = useCallback(
    (card: FunctionCard) => {
      const current = roomStateRef.current;
      if (current.gameType !== 'descartes_y' || !current.yState) return;
      if (current.yState.hasSubmitted) return;

      // 손패에서 카드 제거
      const nextHand = current.myHand.filter((c) => c.id !== card.id);
      setRoomState((prev) => ({
        ...prev,
        myHand: nextHand,
        yState: prev.yState
          ? { ...prev.yState, hasSubmitted: true, submittedCard: card }
          : undefined,
      }));

      soundEngine.playCardFlip();
      addLog(`🎯 [${card.expression}] 카드를 출전시켰습니다. 상대방 제출 대기 중...`, 'system');

      if (current.role === 'client') {
        peerService.broadcast({
          type: 'SUBMIT_CARD_Y',
          peerId: current.myPeerId,
          card,
        });
      } else {
        hostSubmissionsY.current.set(current.myPeerId, card);
        checkAllSubmissionsY();
      }
    },
    [addLog]
  );

  // [호스트 내부: Y 전원 제출 확인 및 라운드 결과 산정]
  const checkAllSubmissionsY = () => {
    const current = roomStateRef.current;
    if (hostSubmissionsY.current.size < current.players.length) {
      return; // 아직 모든 플레이어가 제출하지 않음
    }

    const condition = BATTLE_CONDITIONS[hostConditionIndexY.current];
    const submissions: {
      peerId: string;
      name: string;
      avatar: string;
      card: FunctionCard;
      value: number | null;
    }[] = [];

    current.players.forEach((p) => {
      const card = hostSubmissionsY.current.get(p.peerId);
      if (card) {
        const val = condition.evaluatorFn(card);
        submissions.push({
          peerId: p.peerId,
          name: p.name,
          avatar: p.avatar,
          card,
          value: val,
        });
      }
    });

    // 최고 함숫값 판정
    let highestVal = -Infinity;
    let roundWinnerPeerId: string | 'tie' = 'tie';

    submissions.forEach((s) => {
      if (s.value !== null && s.value > highestVal) {
        highestVal = s.value;
        roundWinnerPeerId = s.peerId;
      }
    });

    // 점수 업데이트
    const updatedScores = { ...hostScoresY.current };
    if (roundWinnerPeerId !== 'tie') {
      updatedScores[roundWinnerPeerId] = (updatedScores[roundWinnerPeerId] || 0) + 1;
      hostScoresY.current = updatedScores;
    }

    const winnerObj = current.players.find((p) => p.peerId === roundWinnerPeerId);
    const winnerName = winnerObj ? winnerObj.name : '무승부';

    const resultPayload = {
      round: hostRoundY.current,
      conditionIndex: hostConditionIndexY.current,
      submissions,
      winnerPeerId: roundWinnerPeerId,
    };

    peerService.broadcast({
      type: 'ROUND_RESULT_Y',
      round: hostRoundY.current,
      conditionIndex: hostConditionIndexY.current,
      submissions,
      winnerPeerId: roundWinnerPeerId,
      scores: updatedScores,
    });

    setRoomState((prev) => ({
      ...prev,
      yState: prev.yState
        ? {
            ...prev.yState,
            roundResult: resultPayload,
            scores: updatedScores,
          }
        : undefined,
    }));

    soundEngine.playTradeSuccess();
    addLog(`🏆 라운드 ${hostRoundY.current} 승자: [${winnerName}] (값: ${highestVal})`, 'fit');

    // 4초 후 다음 라운드 또는 최종 결과 발표
    setTimeout(() => {
      if (hostRoundY.current >= 5) {
        // 게임 오버: 최고 득점자 선언
        let topScore = -1;
        let finalWinnerName = '무승부';
        Object.entries(updatedScores).forEach(([pId, score]) => {
          if (score > topScore) {
            topScore = score;
            const p = current.players.find((pl) => pl.peerId === pId);
            finalWinnerName = p ? p.name : '플레이어';
          }
        });

        peerService.broadcast({
          type: 'GAME_OVER_Y',
          winnerName: finalWinnerName,
          finalScores: updatedScores,
        });

        soundEngine.playCorrect();
        setRoomState((prev) => ({
          ...prev,
          status: 'game_over',
          winner: finalWinnerName,
        }));
        addLog(`🎉 [최종 우승] 5라운드 승부 끝에 [${finalWinnerName}] 님이 승리했습니다!`, 'fit');
      } else {
        // 다음 라운드
        hostRoundY.current += 1;
        hostConditionIndexY.current = Math.floor(Math.random() * BATTLE_CONDITIONS.length);
        hostSubmissionsY.current.clear();

        peerService.broadcast({
          type: 'NEXT_ROUND_Y',
          round: hostRoundY.current,
          conditionIndex: hostConditionIndexY.current,
        });

        setRoomState((prev) => ({
          ...prev,
          yState: prev.yState
            ? {
                ...prev.yState,
                round: hostRoundY.current,
                conditionIndex: hostConditionIndexY.current,
                hasSubmitted: false,
                submittedCard: null,
                roundResult: null,
              }
            : undefined,
        }));
      }
    }, 4500);
  };

  // [피트 전용: 카드 선택 토글]
  const toggleSelectCard = useCallback((card: FunctionCard) => {
    setSelectedCardIds((prev) => {
      if (prev.includes(card.id)) {
        return prev.filter((id) => id !== card.id);
      }
      if (prev.length >= 3) return prev;

      if (prev.length > 0) {
        const first = roomStateRef.current.myHand.find((c) => c.id === prev[0]);
        if (first && first.family !== card.family) {
          return [card.id];
        }
      }
      soundEngine.playCardFlip();
      return [...prev, card.id];
    });
  }, []);

  // [피트 전용: 호가 제시]
  const broadcastOffer = useCallback(
    (count: number) => {
      const current = roomStateRef.current;
      const selected = selectedCardIdsRef.current;
      if (selected.length !== count) return;

      if (current.role === 'host') {
        hostPendingTradeOffers.current.set(current.myPeerId, {
          count,
          cardIds: selected,
        });
        const updated = current.players.map((p) =>
          p.peerId === current.myPeerId ? { ...p, currentOfferCount: count } : p
        );
        setRoomState((prev) => ({ ...prev, players: updated }));
        peerService.broadcast({
          type: 'LOBBY_UPDATE',
          players: updated,
          hostName: current.myName,
        });
      } else {
        peerService.broadcast({
          type: 'OFFER_TRADE',
          count,
          offerId: current.myPeerId,
          cardIds: selected,
        });
      }
      soundEngine.playTradeCall();
      addLog(`📣 내가 "${count}장 교환!"을 외쳤습니다.`, 'trade');
    },
    [addLog]
  );

  // [피트 전용: 호가 취소]
  const cancelOffer = useCallback(() => {
    const current = roomStateRef.current;
    if (current.role === 'host') {
      hostPendingTradeOffers.current.delete(current.myPeerId);
      const updated = current.players.map((p) =>
        p.peerId === current.myPeerId ? { ...p, currentOfferCount: undefined } : p
      );
      setRoomState((prev) => ({ ...prev, players: updated }));
      peerService.broadcast({
        type: 'LOBBY_UPDATE',
        players: updated,
        hostName: current.myName,
      });
    } else {
      peerService.broadcast({
        type: 'CANCEL_OFFER',
        peerId: current.myPeerId,
      });
    }
    setSelectedCardIds([]);
    addLog(`교환 외치기를 취소했습니다.`, 'system');
  }, [addLog]);

  // [피트 전용: 호스트 내부 공통 교환 실행 헬퍼]
  const executeHostTrade = useCallback(
    (peerA: string, peerB: string, count: number) => {
      const current = roomStateRef.current;
      const handA = hostPlayerHands.current.get(peerA);
      const handB = hostPlayerHands.current.get(peerB);
      const offerA = hostPendingTradeOffers.current.get(peerA);
      const offerB = hostPendingTradeOffers.current.get(peerB);

      if (!handA || !handB || !offerA || !offerB) return;
      if (offerA.count !== count || offerB.count !== count) return;

      const cardsA = handA.filter((c) => offerA.cardIds.includes(c.id));
      const cardsB = handB.filter((c) => offerB.cardIds.includes(c.id));

      const newHandA = [...handA.filter((c) => !offerA.cardIds.includes(c.id)), ...cardsB];
      const newHandB = [...handB.filter((c) => !offerB.cardIds.includes(c.id)), ...cardsA];

      hostPlayerHands.current.set(peerA, newHandA);
      hostPlayerHands.current.set(peerB, newHandB);
      hostPendingTradeOffers.current.delete(peerA);
      hostPendingTradeOffers.current.delete(peerB);

      const playerAObj = current.players.find((p) => p.peerId === peerA);
      const playerBObj = current.players.find((p) => p.peerId === peerB);
      const nameA = playerAObj?.name || '플레이어A';
      const nameB = playerBObj?.name || '플레이어B';

      const updatedPlayers = current.players.map((p) =>
        p.peerId === peerA || p.peerId === peerB
          ? { ...p, currentOfferCount: undefined }
          : p
      );

      if (peerA === current.myPeerId) {
        setRoomState((prev) => ({
          ...prev,
          myHand: newHandA,
          players: updatedPlayers,
        }));
        setSelectedCardIds([]);
        soundEngine.playTradeSuccess();
      } else {
        peerService.sendTo(peerA, {
          type: 'TRADE_SUCCESS',
          newHand: newHandA,
          partnerName: nameB,
          count,
        });
      }

      if (peerB === current.myPeerId) {
        setRoomState((prev) => ({
          ...prev,
          myHand: newHandB,
          players: updatedPlayers,
        }));
        setSelectedCardIds([]);
        soundEngine.playTradeSuccess();
      } else {
        peerService.sendTo(peerB, {
          type: 'TRADE_SUCCESS',
          newHand: newHandB,
          partnerName: nameA,
          count,
        });
      }

      peerService.broadcast({
        type: 'LOBBY_UPDATE',
        players: updatedPlayers,
        hostName: current.myName,
      });

      const logText = `🤝 [${nameA}] 님과 [${nameB}] 님의 ${count}장 맞교환이 체결되었습니다!`;
      peerService.broadcast({
        type: 'LOG_MESSAGE',
        text: logText,
        logType: 'trade',
      });
      addLog(logText, 'trade');
    },
    [addLog]
  );

  // [피트 전용: 상대방과의 교환 요청]
  const acceptTradeFromPeer = useCallback(
    (targetPeerId: string) => {
      const current = roomStateRef.current;
      const selected = selectedCardIdsRef.current;
      const targetPlayer = current.players.find((p) => p.peerId === targetPeerId);

      if (!targetPlayer || !targetPlayer.currentOfferCount) return;
      if (selected.length !== targetPlayer.currentOfferCount) {
        addLog(`⚠️ 상대방이 제시한 ${targetPlayer.currentOfferCount}장과 일치하게 카드를 선택해야 합니다.`, 'alert');
        return;
      }

      if (current.role === 'client') {
        peerService.broadcast({
          type: 'REQUEST_TRADE',
          requesterPeerId: current.myPeerId,
          targetPeerId,
          count: selected.length,
          cardIds: selected,
        });
      } else {
        hostPendingTradeOffers.current.set(current.myPeerId, {
          count: selected.length,
          cardIds: selected,
        });
        executeHostTrade(current.myPeerId, targetPeerId, selected.length);
      }
    },
    [addLog, executeHostTrade]
  );

  // [피트 전용: 황금 종 치기 ("데카르트 핏!")]
  const ringMultiplayerBell = useCallback(() => {
    const current = roomStateRef.current;
    const hand = current.myHand;

    const isWin =
      hand.length === 9 && hand.every((c) => c.family === hand[0].family);

    if (isWin) {
      soundEngine.playBellRing();
      soundEngine.playCorrect();

      const winMessage: NetworkMessage = {
        type: 'BELL_RING',
        winnerName: current.myName,
        winnerFamily: hand[0].family,
        success: true,
      };

      peerService.broadcast(winMessage);

      setRoomState((prev) => ({
        ...prev,
        status: 'game_over',
        winner: current.myName,
      }));
      addLog(`🎉 [FIT!!] 내가 9장을 완성하여 데카르트 핏을 외쳤습니다!`, 'fit');
    } else {
      soundEngine.playWrong();
      addLog(`⚠️ 아직 9장 세트가 완성되지 않았습니다! (현재 다른 계열이 섞여 있습니다)`, 'alert');
    }
  }, [addLog]);

  // [P2P 메시지 수신 라우터]
  useEffect(() => {
    peerService.onMessage((senderPeerId, message) => {
      const current = roomStateRef.current;

      switch (message.type) {
        case 'JOIN': {
          const isHost =
            current.role === 'host' ||
            current.players.some((p) => p.peerId === current.myPeerId && p.isHost) ||
            roomState.role === 'host';

          if (!isHost) return;

          setRoomState((prev) => {
            const existingIdx = prev.players.findIndex((p) => p.peerId === senderPeerId);
            let updatedPlayers: RemotePlayer[];

            if (existingIdx >= 0) {
              // 이미 등록된 플레이어(재시도 패킷)인 경우 최신 정보 반영
              updatedPlayers = [...prev.players];
              updatedPlayers[existingIdx] = {
                ...updatedPlayers[existingIdx],
                name: message.name,
                avatar: message.avatar,
              };
            } else {
              if (prev.players.length >= 4) return prev;
              const newPlayer: RemotePlayer = {
                peerId: senderPeerId,
                name: message.name,
                avatar: message.avatar,
                isHost: false,
                isReady: true,
                cardCount: 0,
              };
              updatedPlayers = [...prev.players, newPlayer];
              addLog(`[입장] ${message.name}님이 방에 들어왔습니다!`, 'system');
            }

            // JOIN_ACK는 매 재시도마다 즉시 회신하여 게스트의 대기실 진입을 100% 보장
            peerService.sendTo(senderPeerId, {
              type: 'JOIN_ACK',
              roomId: prev.roomId,
              players: updatedPlayers,
              hostName: prev.myName,
            });

            peerService.broadcast({
              type: 'LOBBY_UPDATE',
              players: updatedPlayers,
              hostName: prev.myName,
            });

            return { ...prev, players: updatedPlayers };
          });
          break;
        }

        case 'JOIN_ACK': {
          clearHandshakeTimers();
          setRoomState((prev) => ({
            ...prev,
            roomId: message.roomId,
            players: message.players,
            status: 'lobby',
          }));
          soundEngine.playCardFlip();
          addLog(`선생님(${message.hostName})의 교실 방에 성공적으로 참여했습니다!`, 'system');
          break;
        }

        case 'LOBBY_UPDATE': {
          setRoomState((prev) => ({
            ...prev,
            players: message.players,
          }));
          break;
        }

        case 'GAME_STARTED': {
          const hydratedHand = hydrateCards(message.yourHand);
          const hydratedTopCard = message.topCard ? hydrateCard(message.topCard) : undefined;
          setRoomState((prev) => ({
            ...prev,
            status: 'playing',
            gameType: message.gameType,
            myHand: hydratedHand,
            activeFamilies: message.activeFamilies,
            winner: null,
            xState:
              message.gameType === 'descartes_x' && hydratedTopCard
                ? {
                    topCard: hydratedTopCard,
                    currentTurnPeerId: message.currentTurnPeerId || '',
                    deckCount: message.deckCount || 0,
                    playerCardCounts: prev.players.map((p) => ({ peerId: p.peerId, count: 5 })),
                  }
                : undefined,
            yState:
              message.gameType === 'descartes_y' && typeof message.conditionIndex === 'number'
                ? {
                    round: 1,
                    conditionIndex: message.conditionIndex,
                    hasSubmitted: false,
                    submittedCard: null,
                    roundResult: null,
                    scores: {},
                  }
                : undefined,
          }));
          soundEngine.playCardFlip();
          break;
        }

        // --- 피트 모드 ---
        case 'OFFER_TRADE': {
          if (current.role === 'host') {
            hostPendingTradeOffers.current.set(message.offerId, {
              count: message.count,
              cardIds: message.cardIds,
            });
            const updated = current.players.map((p) =>
              p.peerId === message.offerId ? { ...p, currentOfferCount: message.count } : p
            );
            setRoomState((prev) => ({ ...prev, players: updated }));
            peerService.broadcast({
              type: 'LOBBY_UPDATE',
              players: updated,
              hostName: current.myName,
            });
            const p = current.players.find((pl) => pl.peerId === message.offerId);
            const pName = p?.name || '학생';
            const logTxt = `📣 ${pName} 님이 "${message.count}장 교환!"을 외쳤습니다.`;
            peerService.broadcast({ type: 'LOG_MESSAGE', text: logTxt, logType: 'trade' });
            addLog(logTxt, 'trade');
          }
          soundEngine.playTradeCall();
          break;
        }

        case 'CANCEL_OFFER': {
          if (current.role === 'host') {
            hostPendingTradeOffers.current.delete(message.peerId);
            const updated = current.players.map((p) =>
              p.peerId === message.peerId ? { ...p, currentOfferCount: undefined } : p
            );
            setRoomState((prev) => ({ ...prev, players: updated }));
            peerService.broadcast({
              type: 'LOBBY_UPDATE',
              players: updated,
              hostName: current.myName,
            });
          }
          break;
        }

        case 'REQUEST_TRADE': {
          if (current.role === 'host') {
            hostPendingTradeOffers.current.set(message.requesterPeerId, {
              count: message.count,
              cardIds: message.cardIds,
            });
            executeHostTrade(message.requesterPeerId, message.targetPeerId, message.count);
          }
          break;
        }

        case 'TRADE_SUCCESS': {
          setRoomState((prev) => ({
            ...prev,
            myHand: hydrateCards(message.newHand),
            players: prev.players.map((p) => ({ ...p, currentOfferCount: undefined })),
          }));
          setSelectedCardIds([]);
          soundEngine.playTradeSuccess();
          addLog(`🤝 [교환 성사] ${message.partnerName}님과 ${message.count}장을 교환했습니다!`, 'trade');
          break;
        }

        case 'BELL_RING': {
          soundEngine.playBellRing();
          if (message.success) {
            soundEngine.playCorrect();
            setRoomState((prev) => ({
              ...prev,
              status: 'game_over',
              winner: message.winnerName,
            }));
            addLog(`🔔 [FIT!!] ${message.winnerName}님이 9장을 모아 승리했습니다!`, 'fit');
          }
          break;
        }

        // --- 데카르트 X 모드 ---
        case 'PLAY_CARD_X': {
          if (current.role === 'host') {
            executePlayCardX(message.peerId, hydrateCard(message.card));
          }
          break;
        }

        case 'DRAW_CARD_X': {
          if (current.role === 'host') {
            executeDrawCardX(message.peerId);
          }
          break;
        }

        case 'DRAW_ACK_X': {
          setRoomState((prev) => ({
            ...prev,
            myHand: [...prev.myHand, hydrateCard(message.drawnCard)],
          }));
          soundEngine.playCardFlip();
          break;
        }

        case 'SYNC_STATE_X': {
          setRoomState((prev) => ({
            ...prev,
            xState: {
              topCard: hydrateCard(message.topCard),
              currentTurnPeerId: message.currentTurnPeerId,
              deckCount: message.deckCount,
              playerCardCounts: message.playerCardCounts,
            },
          }));
          soundEngine.playCardFlip();
          addLog(message.logText, 'trade');
          break;
        }

        case 'GAME_OVER_X': {
          soundEngine.playCorrect();
          setRoomState((prev) => ({
            ...prev,
            status: 'game_over',
            winner: message.winnerName,
          }));
          addLog(`🎉 [데카르트 X] ${message.winnerName} 님이 손패를 모두 털어내어 승리했습니다!`, 'fit');
          break;
        }

        // --- 데카르트 Y 모드 ---
        case 'SUBMIT_CARD_Y': {
          if (current.role === 'host') {
            hostSubmissionsY.current.set(message.peerId, hydrateCard(message.card));
            checkAllSubmissionsY();
          }
          break;
        }

        case 'ROUND_RESULT_Y': {
          setRoomState((prev) => ({
            ...prev,
            yState: prev.yState
              ? {
                  ...prev.yState,
                  roundResult: {
                    round: message.round,
                    conditionIndex: message.conditionIndex,
                    submissions: message.submissions.map((s) => ({
                      ...s,
                      card: hydrateCard(s.card),
                    })),
                    winnerPeerId: message.winnerPeerId,
                  },
                  scores: message.scores,
                }
              : undefined,
          }));
          soundEngine.playTradeSuccess();
          break;
        }

        case 'NEXT_ROUND_Y': {
          setRoomState((prev) => ({
            ...prev,
            yState: prev.yState
              ? {
                  ...prev.yState,
                  round: message.round,
                  conditionIndex: message.conditionIndex,
                  hasSubmitted: false,
                  submittedCard: null,
                  roundResult: null,
                }
              : undefined,
          }));
          soundEngine.playCardFlip();
          break;
        }

        case 'GAME_OVER_Y': {
          soundEngine.playCorrect();
          setRoomState((prev) => ({
            ...prev,
            status: 'game_over',
            winner: message.winnerName,
            yState: prev.yState
              ? {
                  ...prev.yState,
                  scores: message.finalScores,
                }
              : undefined,
          }));
          addLog(`🎉 [데카르트 Y] 최종 우승: [${message.winnerName}] 님!`, 'fit');
          break;
        }

        case 'LOG_MESSAGE': {
          addLog(message.text, message.logType || 'trade');
          break;
        }
      }
    });

    peerService.onDisconnect((disconnectedPeerId) => {
      const current = roomStateRef.current;
      setRoomState((prev) => {
        const remaining = prev.players.filter((p) => p.peerId !== disconnectedPeerId);
        if (current.role === 'host') {
          peerService.broadcast({
            type: 'LOBBY_UPDATE',
            players: remaining,
            hostName: prev.myName,
          });
        }
        return { ...prev, players: remaining };
      });
      addLog(`한 플레이어의 연결이 끊어졌습니다.`, 'alert');
    });

    return () => {};
  }, [addLog, executeHostTrade]);

  return {
    roomState,
    selectedCardIds,
    errorMessage,
    createRoom,
    joinRoom,
    startMultiplayerGame,
    // 피트 모드
    toggleSelectCard,
    broadcastOffer,
    cancelOffer,
    acceptTradeFromPeer,
    ringMultiplayerBell,
    // 데카르트 X 모드
    playCardX,
    drawCardX,
    // 데카르트 Y 모드
    submitCardY,
    setMyName: (name: string) => setRoomState((prev) => ({ ...prev, myName: name })),
    leaveRoom: () => {
      clearHandshakeTimers();
      peerService.destroy();
      setRoomState((prev) => ({
        ...prev,
        status: 'idle',
        roomId: '',
        players: [],
        myHand: [],
        xState: undefined,
        yState: undefined,
      }));
      setSelectedCardIds([]);
    },
  };
}
