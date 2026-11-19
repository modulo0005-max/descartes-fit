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
    status: 'idle',
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
      const name = customName || roomStateRef.current.myName;

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
        (err) => {
          console.error('Peer init error:', err);
          if (err.message.includes('taken') || err.message.includes('unavailable-id')) {
            // 방 코드가 겹친 경우 1회 자동 재시도
            setErrorMessage('기존 룸 코드가 점유되어 있어 새 코드로 재시도합니다...');
            setTimeout(() => createRoom(customName), 1000);
          } else {
            setErrorMessage(`방 생성 실패: ${err.message}`);
            setRoomState((prev) => ({ ...prev, status: 'idle' }));
          }
        }
      );
    },
    [addLog]
  );

  // [방 입장 - 참가자]
  const joinRoom = useCallback(
    (codeToJoin: string, customName?: string) => {
      const trimmedCode = codeToJoin.trim().toUpperCase();
      if (!trimmedCode) return;

      const hostPeerId = `descartes-${trimmedCode.toLowerCase()}`;
      const name = customName || roomStateRef.current.myName;

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
                avatar: roomStateRef.current.myAvatar,
              });
              setRoomState((prev) => ({ ...prev, status: 'lobby' }));
              addLog(`방 [${trimmedCode}] 호스트에 연결되었습니다.`, 'system');
            },
            (err) => {
              setErrorMessage(`호스트 연결 실패 (방 코드를 확인하세요): ${err.message}`);
              setRoomState((prev) => ({ ...prev, status: 'idle' }));
            }
          );
        },
        (err) => {
          setErrorMessage(`P2P 네트워크 초기화 실패: ${err.message}`);
          setRoomState((prev) => ({ ...prev, status: 'idle' }));
        }
      );
    },
    [addLog]
  );

  // [호스트 전용: 게임 시작 및 셔플 분배]
  const startMultiplayerGame = useCallback(() => {
    const current = roomStateRef.current;
    if (current.role !== 'host') return;

    // 4개 패밀리 무작위 선정
    const allFamilies: FunctionFamily[] = [
      'linear',
      'quadratic',
      'rational',
      'irrational',
      'cubic',
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
    hostPendingTradeOffers.current.clear();

    const updatedPlayers = current.players.map((p, idx) => {
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

    const hostHand = hostPlayerHands.current.get(current.myPeerId) || [];

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
  }, [addLog]);

  // [카드 선택 토글]
  const toggleSelectCard = useCallback(
    (card: FunctionCard) => {
      setSelectedCardIds((prev) => {
        if (prev.includes(card.id)) {
          return prev.filter((id) => id !== card.id);
        }
        if (prev.length >= 3) return prev;

        // 동일 계열 검증 (피트 룰: 한 번에 내놓는 카드는 같은 계열이어야 함)
        if (prev.length > 0) {
          const first = roomStateRef.current.myHand.find((c) => c.id === prev[0]);
          if (first && first.family !== card.family) {
            return [card.id];
          }
        }
        soundEngine.playCardFlip();
        return [...prev, card.id];
      });
    },
    []
  );

  // [호가 제시 ("N장 교환!")]
  const broadcastOffer = useCallback(
    (count: number) => {
      const current = roomStateRef.current;
      const selected = selectedCardIdsRef.current;

      if (selected.length !== count) {
        return;
      }

      if (current.role === 'host') {
        // 호스트 오퍼 저장
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
        // 클라이언트는 호스트에게 오퍼 등록 요청
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

  // [호가 취소]
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

  // [호스트 내부 공통 교환 실행 헬퍼]
  const executeHostTrade = useCallback(
    (peerA: string, peerB: string, count: number) => {
      const current = roomStateRef.current;
      const handA = hostPlayerHands.current.get(peerA);
      const handB = hostPlayerHands.current.get(peerB);
      const offerA = hostPendingTradeOffers.current.get(peerA);
      const offerB = hostPendingTradeOffers.current.get(peerB);

      if (!handA || !handB || !offerA || !offerB) {
        console.warn('Trade execution failed: missing hand or offer', { peerA, peerB, offerA, offerB });
        return;
      }

      if (offerA.count !== count || offerB.count !== count) {
        console.warn('Trade count mismatch', offerA.count, offerB.count, count);
        return;
      }

      const cardsA = handA.filter((c) => offerA.cardIds.includes(c.id));
      const cardsB = handB.filter((c) => offerB.cardIds.includes(c.id));

      if (cardsA.length !== count || cardsB.length !== count) {
        console.warn('Offered card items length mismatch');
        return;
      }

      // 맞교환 적용
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

      // 플레이어 목록에서 오퍼 제거
      const updatedPlayers = current.players.map((p) =>
        p.peerId === peerA || p.peerId === peerB
          ? { ...p, currentOfferCount: undefined }
          : p
      );

      // A가 호스트인 경우
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

      // B가 호스트인 경우
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

      // 전체 참여자에게 로비 갱신 및 로그 전파
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

  // [상대방과의 교환 요청]
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
        // 호스트에게 교환 중개 요청 전송
        peerService.broadcast({
          type: 'REQUEST_TRADE',
          requesterPeerId: current.myPeerId,
          targetPeerId,
          count: selected.length,
          cardIds: selected,
        });
      } else {
        // 호스트 자신이 직접 교환 대상자인 경우
        hostPendingTradeOffers.current.set(current.myPeerId, {
          count: selected.length,
          cardIds: selected,
        });
        executeHostTrade(current.myPeerId, targetPeerId, selected.length);
      }
    },
    [addLog, executeHostTrade]
  );

  // [황금 종 치기 ("데카르트 핏!")]
  const ringMultiplayerBell = useCallback(() => {
    const current = roomStateRef.current;
    const hand = current.myHand;

    // 9장이 전부 같은 계열인지 검사
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
          // 호스트만 수신: 새 참가자 추가
          if (current.role !== 'host') return;
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

            // 참가자에게 접속 확인 메시지 전송
            peerService.sendTo(senderPeerId, {
              type: 'JOIN_ACK',
              roomId: prev.roomId,
              players: updatedPlayers,
              hostName: prev.myName,
            });

            // 전체 참가자에게 로비 업데이트 브로드캐스트
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

        case 'JOIN_ACK': {
          // 클라이언트 수신: 접속 성공 확인
          setRoomState((prev) => ({
            ...prev,
            roomId: message.roomId,
            players: message.players,
            status: 'lobby',
          }));
          addLog(`방 [${message.roomId}] 대기실에 입장했습니다.`, 'system');
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
          // 호스트 수신: 클라이언트의 오퍼 등록
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
          // 호스트 수신: 클라이언트의 오퍼 취소
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
          // 호스트 수신: 클라이언트의 교환 요청 중개
          if (current.role === 'host') {
            // 요청자 오퍼 등록
            hostPendingTradeOffers.current.set(message.requesterPeerId, {
              count: message.count,
              cardIds: message.cardIds,
            });
            // 즉시 맞교환 실행
            executeHostTrade(message.requesterPeerId, message.targetPeerId, message.count);
          }
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

    return () => {
      // 정리
    };
  }, [addLog, executeHostTrade]);

  return {
    roomState,
    selectedCardIds,
    errorMessage,
    createRoom,
    joinRoom,
    startMultiplayerGame,
    toggleSelectCard,
    broadcastOffer,
    cancelOffer,
    acceptTradeFromPeer,
    ringMultiplayerBell,
    setMyName: (name: string) => setRoomState((prev) => ({ ...prev, myName: name })),
    leaveRoom: () => {
      peerService.destroy();
      setRoomState((prev) => ({ ...prev, status: 'idle', roomId: '', players: [], myHand: [] }));
      setSelectedCardIds([]);
    },
  };
}
