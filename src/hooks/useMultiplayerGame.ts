import { useState, useEffect, useCallback, useRef } from 'react';
import { peerService } from '../services/peerService';
import {
  MultiplayerRoomState,
  RemotePlayer,
  NetworkMessage,
} from '../types/multiplayer';
import { FunctionCard, FunctionFamily } from '../types/math';
import { FUNCTION_CARDS } from '../data/functionCards';
import { soundEngine } from '../utils/audio';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const AVATARS = ['🎓', '📐', '🚀', '⭐', '🦁', '🦊', '🦉', '🐱'];

export function useMultiplayerGame() {
  const [roomState, setRoomState] = useState<MultiplayerRoomState>({
    roomId: '',
    role: 'client',
    status: 'connecting',
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

  // 호스트 전용: 모든 플레이어의 비밀 손패를 관리하여 공정한 트레이딩 중개 (Host-Authoritative)
  const hostPlayerHands = useRef<Map<string, FunctionCard[]>>(new Map());
  const hostPendingTradeOffers = useRef<
    Map<string, { count: number; cardIds: string[] }>
  >(new Map());

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

  // [방 생성 - 호스트]
  const createRoom = useCallback(
    (customName?: string) => {
      const code = generateRoomCode();
      const hostPeerId = `descartes-${code.toLowerCase()}`;
      const name = customName || roomState.myName;

      setErrorMessage(null);
      setRoomState((prev) => ({
        ...prev,
        roomId: code,
        role: 'host',
        status: 'connecting',
        myName: name,
      }));

      peerService.init(
        hostPeerId,
        (assignedId) => {
          const hostPlayer: RemotePlayer = {
            peerId: assignedId,
            name,
            avatar: roomState.myAvatar,
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
        (err) => {
          setErrorMessage(`방 생성 실패 (이미 존재하는 코드이거나 네트워크 오류): ${err.message}`);
          setRoomState((prev) => ({ ...prev, status: 'connecting' }));
        }
      );
    },
    [roomState.myName, roomState.myAvatar, addLog]
  );

  // [방 입장 - 참가자]
  const joinRoom = useCallback(
    (codeToJoin: string, customName?: string) => {
      const trimmedCode = codeToJoin.trim().toUpperCase();
      if (!trimmedCode) return;

      const hostPeerId = `descartes-${trimmedCode.toLowerCase()}`;
      const name = customName || roomState.myName;

      setErrorMessage(null);
      setRoomState((prev) => ({
        ...prev,
        roomId: trimmedCode,
        role: 'client',
        status: 'connecting',
        myName: name,
      }));

      peerService.init(
        undefined, // 임의 Peer ID
        (myId) => {
          setRoomState((prev) => ({ ...prev, myPeerId: myId }));

          peerService.connectToHost(
            hostPeerId,
            () => {
              // 연결 성공 시 호스트에게 내 정보 전송
              peerService.sendTo(hostPeerId, {
                type: 'JOIN',
                name,
                avatar: roomState.myAvatar,
              });
              setRoomState((prev) => ({ ...prev, status: 'lobby' }));
              addLog(`방 [${trimmedCode}]에 접속했습니다.`, 'system');
            },
            (err) => {
              setErrorMessage(`호스트 연결 실패 (방 코드를 확인하세요): ${err.message}`);
              setRoomState((prev) => ({ ...prev, status: 'connecting' }));
            }
          );
        },
        (err) => {
          setErrorMessage(`P2P 네트워크 초기화 실패: ${err.message}`);
        }
      );
    },
    [roomState.myName, roomState.myAvatar, addLog]
  );

  // [호스트 전용: 게임 시작 및 셔플 분배]
  const startMultiplayerGame = useCallback(() => {
    if (roomState.role !== 'host') return;

    // 4개 패밀리 무작위 선정
    const allFamilies: FunctionFamily[] = [
      'linear',
      'quadratic',
      'cubic',
      'rational',
      'irrational',
      'exponential',
      'logarithmic',
      'trigonometric',
    ];
    const chosenFamilies = [...allFamilies].sort(() => Math.random() - 0.5).slice(0, 4);

    const deck: FunctionCard[] = [];
    chosenFamilies.forEach((fam) => {
      deck.push(...FUNCTION_CARDS.filter((c) => c.family === fam).slice(0, 9));
    });

    // 셔플
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // 각 플레이어별 9장씩 분배 및 저장
    hostPlayerHands.current.clear();
    const updatedPlayers = roomState.players.map((p, idx) => {
      const playerHand = deck.slice(idx * 9, (idx + 1) * 9);
      hostPlayerHands.current.set(p.peerId, playerHand);

      // 클라이언트에게 해당 플레이어의 손패 전송
      if (!p.isHost) {
        peerService.sendTo(p.peerId, {
          type: 'GAME_STARTED',
          yourHand: playerHand,
          activeFamilies: chosenFamilies,
        });
      }
      return { ...p, cardCount: 9, currentOfferCount: undefined };
    });

    const hostHand = hostPlayerHands.current.get(roomState.myPeerId) || [];

    setRoomState((prev) => ({
      ...prev,
      status: 'playing',
      players: updatedPlayers,
      myHand: hostHand,
      activeFamilies: chosenFamilies,
      winner: null,
    }));

    soundEngine.playCardFlip();
    addLog('게임이 시작되었습니다! 카드를 9장씩 나누어 가졌습니다.', 'system');
  }, [roomState.role, roomState.players, roomState.myPeerId, addLog]);

  // [카드 선택 토글]
  const toggleSelectCard = useCallback(
    (card: FunctionCard) => {
      setSelectedCardIds((prev) => {
        if (prev.includes(card.id)) {
          return prev.filter((id) => id !== card.id);
        }
        if (prev.length >= 3) return prev;

        // 동일 계열 검증
        if (prev.length > 0) {
          const first = roomState.myHand.find((c) => c.id === prev[0]);
          if (first && first.family !== card.family) {
            return [card.id];
          }
        }
        soundEngine.playCardFlip();
        return [...prev, card.id];
      });
    },
    [roomState.myHand]
  );

  // [호가 제시 ("N장 교환!")]
  const broadcastOffer = useCallback(
    (count: number) => {
      if (roomState.role === 'host') {
        // 호스트 자체 오퍼 갱신
        hostPendingTradeOffers.current.set(roomState.myPeerId, {
          count,
          cardIds: selectedCardIds,
        });
        const updated = roomState.players.map((p) =>
          p.peerId === roomState.myPeerId ? { ...p, currentOfferCount: count } : p
        );
        setRoomState((prev) => ({ ...prev, players: updated }));
        peerService.broadcast({
          type: 'LOBBY_UPDATE',
          players: updated,
          hostName: roomState.myName,
        });
      } else {
        peerService.broadcast({
          type: 'OFFER_TRADE',
          count,
          offerId: roomState.myPeerId,
        });
      }
      soundEngine.playTradeCall();
      addLog(`📣 내가 "${count}장 교환!"을 외쳤습니다.`, 'trade');
    },
    [
      roomState.role,
      roomState.myPeerId,
      roomState.players,
      roomState.myName,
      selectedCardIds,
      addLog,
    ]
  );

  // [상대방과의 교환 요청]
  const acceptTradeFromPeer = useCallback(
    (targetPeerId: string) => {
      const offeredCards = roomState.myHand.filter((c) =>
        selectedCardIds.includes(c.id)
      );
      if (offeredCards.length === 0) return;

      if (roomState.role === 'client') {
        // 호스트에게 교환 중개 요청 전송
        peerService.broadcast({
          type: 'REQUEST_TRADE',
          targetPeerId,
          count: offeredCards.length,
          cards: offeredCards,
        });
      } else {
        // 호스트가 직접 교환 실행
        const myCards = offeredCards;
        const targetHand = hostPlayerHands.current.get(targetPeerId) || [];
        const targetOffer = hostPendingTradeOffers.current.get(targetPeerId);

        if (!targetOffer || targetOffer.count !== myCards.length) return;

        const targetCards = targetHand.filter((c) =>
          targetOffer.cardIds.includes(c.id)
        );

        // 맞교환 적용
        const newHostHand = [
          ...roomState.myHand.filter((c) => !selectedCardIds.includes(c.id)),
          ...targetCards,
        ];
        const newTargetHand = [
          ...targetHand.filter((c) => !targetOffer.cardIds.includes(c.id)),
          ...myCards,
        ];

        hostPlayerHands.current.set(roomState.myPeerId, newHostHand);
        hostPlayerHands.current.set(targetPeerId, newTargetHand);
        hostPendingTradeOffers.current.delete(targetPeerId);
        hostPendingTradeOffers.current.delete(roomState.myPeerId);

        setRoomState((prev) => ({
          ...prev,
          myHand: newHostHand,
          players: prev.players.map((p) => ({
            ...p,
            currentOfferCount: undefined,
          })),
        }));

        // 상대방에게 새 손패 전송
        peerService.sendTo(targetPeerId, {
          type: 'TRADE_SUCCESS',
          newHand: newTargetHand,
          partnerName: roomState.myName,
          count: myCards.length,
        });

        soundEngine.playTradeSuccess();
        addLog(`🤝 나와 상대방 간의 ${myCards.length}장 맞교환이 체결되었습니다!`, 'trade');
        setSelectedCardIds([]);
      }
    },
    [roomState, selectedCardIds, addLog]
  );

  // [황금 종 치기 ("데카르트 핏!")]
  const ringMultiplayerBell = useCallback(() => {
    // 9장이 전부 같은 계열인지 검사
    const hand = roomState.myHand;
    const isWin =
      hand.length === 9 && hand.every((c) => c.family === hand[0].family);

    if (isWin) {
      soundEngine.playBellRing();
      soundEngine.playCorrect();

      const winMessage: NetworkMessage = {
        type: 'BELL_RING',
        winnerName: roomState.myName,
        winnerFamily: hand[0].family,
        success: true,
      };

      if (roomState.role === 'host') {
        peerService.broadcast(winMessage);
      } else {
        peerService.broadcast(winMessage);
      }

      setRoomState((prev) => ({
        ...prev,
        status: 'game_over',
        winner: roomState.myName,
      }));
      addLog(`🎉 [FIT!!] 내가 9장을 완성하여 데카르트 핏을 외쳤습니다!`, 'fit');
    } else {
      soundEngine.playWrong();
      addLog(`⚠️ 아직 9장 세트가 완성되지 않았습니다!`, 'alert');
    }
  }, [roomState.myHand, roomState.myName, roomState.role, addLog]);

  // [P2P 메시지 수신 라우터]
  useEffect(() => {
    peerService.onMessage((senderPeerId, message) => {
      switch (message.type) {
        case 'JOIN': {
          // 호스트만 수신: 새 참가자 추가
          if (roomState.role !== 'host') return;
          setRoomState((prev) => {
            const exists = prev.players.some((p) => p.peerId === senderPeerId);
            if (exists) return prev;
            if (prev.players.length >= 4) return prev; // 최대 4인

            const newPlayer: RemotePlayer = {
              peerId: senderPeerId,
              name: message.name,
              avatar: message.avatar,
              isHost: false,
              isReady: true,
              cardCount: 0,
            };

            const updatedPlayers = [...prev.players, newPlayer];
            // 새 목록을 모든 참가자에게 브로드캐스트
            peerService.broadcast({
              type: 'LOBBY_UPDATE',
              players: updatedPlayers,
              hostName: prev.myName,
            });

            return { ...prev, players: updatedPlayers };
          });
          addLog(`[입장] ${message.name}님이 방에 들어왔습니다!`, 'system');
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
          setRoomState((prev) => ({
            ...prev,
            status: 'playing',
            myHand: message.yourHand,
            activeFamilies: message.activeFamilies,
            winner: null,
          }));
          soundEngine.playCardFlip();
          addLog('게임이 시작되었습니다! 카드를 9장씩 나누어 받았습니다.', 'system');
          break;
        }

        case 'OFFER_TRADE': {
          setRoomState((prev) => ({
            ...prev,
            players: prev.players.map((p) =>
              p.peerId === senderPeerId
                ? { ...p, currentOfferCount: message.count }
                : p
            ),
          }));
          soundEngine.playTradeCall();
          break;
        }

        case 'TRADE_SUCCESS': {
          setRoomState((prev) => ({
            ...prev,
            myHand: message.newHand,
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
      }
    });

    peerService.onDisconnect((disconnectedPeerId) => {
      setRoomState((prev) => {
        const remaining = prev.players.filter((p) => p.peerId !== disconnectedPeerId);
        if (prev.role === 'host') {
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

    return () => {
      // 정리
    };
  }, [roomState.role, addLog]);

  return {
    roomState,
    selectedCardIds,
    errorMessage,
    createRoom,
    joinRoom,
    startMultiplayerGame,
    toggleSelectCard,
    broadcastOffer,
    acceptTradeFromPeer,
    ringMultiplayerBell,
    setMyName: (name: string) => setRoomState((prev) => ({ ...prev, myName: name })),
    leaveRoom: () => {
      peerService.destroy();
      setRoomState((prev) => ({ ...prev, status: 'connecting', roomId: '', players: [] }));
    },
  };
}
