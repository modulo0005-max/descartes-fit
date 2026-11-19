import { FunctionCard, FunctionFamily } from './math';

export type PeerRole = 'host' | 'client';
export type MultiplayerGameType = 'pit' | 'descartes_x' | 'descartes_y';

export interface RemotePlayer {
  peerId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  cardCount: number;
  currentOfferCount?: number; // 피트 모드: 현재 내놓은 교환 장수 (1~3장)
  targetFamily?: FunctionFamily;
}

export interface BattleCondition {
  title: string;
  xValue: number;
  desc: string;
}

export type NetworkMessage =
  | { type: 'JOIN'; name: string; avatar: string }
  | { type: 'JOIN_ACK'; roomId: string; players: RemotePlayer[]; hostName: string }
  | { type: 'LOBBY_UPDATE'; players: RemotePlayer[]; hostName: string }
  | {
      type: 'GAME_STARTED';
      gameType: MultiplayerGameType;
      yourHand: FunctionCard[];
      activeFamilies: FunctionFamily[];
      topCard?: FunctionCard;
      currentTurnPeerId?: string;
      deckCount?: number;
      conditionIndex?: number;
    }
  // [피트 모드 메시지]
  | { type: 'OFFER_TRADE'; count: number; offerId: string; cardIds: string[] }
  | { type: 'CANCEL_OFFER'; peerId: string }
  | { type: 'REQUEST_TRADE'; requesterPeerId: string; targetPeerId: string; count: number; cardIds: string[] }
  | { type: 'TRADE_SUCCESS'; newHand: FunctionCard[]; partnerName: string; count: number }
  | { type: 'BELL_RING'; winnerName: string; winnerFamily?: FunctionFamily; success: boolean }
  // [데카르트 X 모드 메시지]
  | { type: 'PLAY_CARD_X'; peerId: string; card: FunctionCard }
  | { type: 'DRAW_CARD_X'; peerId: string }
  | { type: 'DRAW_ACK_X'; drawnCard: FunctionCard }
  | {
      type: 'SYNC_STATE_X';
      topCard: FunctionCard;
      currentTurnPeerId: string;
      deckCount: number;
      playerCardCounts: { peerId: string; count: number }[];
      logText: string;
    }
  | { type: 'GAME_OVER_X'; winnerPeerId: string; winnerName: string }
  // [데카르트 Y 모드 메시지]
  | { type: 'SUBMIT_CARD_Y'; peerId: string; card: FunctionCard }
  | {
      type: 'ROUND_RESULT_Y';
      round: number;
      conditionIndex: number;
      submissions: {
        peerId: string;
        name: string;
        avatar: string;
        card: FunctionCard;
        value: number | null;
      }[];
      winnerPeerId: string | 'tie';
      scores: Record<string, number>;
    }
  | { type: 'NEXT_ROUND_Y'; round: number; conditionIndex: number }
  | { type: 'GAME_OVER_Y'; winnerName: string; finalScores: Record<string, number> }
  // [공통 시스템 메시지]
  | { type: 'LOG_MESSAGE'; text: string; logType?: 'trade' | 'alert' | 'fit' | 'system' };

export interface MultiplayerRoomState {
  roomId: string;
  role: PeerRole;
  status: 'idle' | 'connecting' | 'lobby' | 'playing' | 'game_over';
  gameType: MultiplayerGameType;
  players: RemotePlayer[];
  myPeerId: string;
  myName: string;
  myAvatar: string;
  myHand: FunctionCard[];
  activeFamilies: FunctionFamily[];
  winner: string | null;
  logs: { id: string; text: string; time: string; type: string }[];
  // 데카르트 X 상태
  xState?: {
    topCard: FunctionCard | null;
    currentTurnPeerId: string;
    deckCount: number;
    playerCardCounts: { peerId: string; count: number }[];
  };
  // 데카르트 Y 상태
  yState?: {
    round: number;
    conditionIndex: number;
    hasSubmitted: boolean;
    submittedCard: FunctionCard | null;
    roundResult?: {
      round: number;
      conditionIndex: number;
      submissions: {
        peerId: string;
        name: string;
        avatar: string;
        card: FunctionCard;
        value: number | null;
      }[];
      winnerPeerId: string | 'tie';
    } | null;
    scores: Record<string, number>;
  };
}
