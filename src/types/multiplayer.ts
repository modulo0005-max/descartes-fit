import { FunctionCard, FunctionFamily } from './math';

export type PeerRole = 'host' | 'client';

export interface RemotePlayer {
  peerId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  cardCount: number;
  currentOfferCount?: number; // 현재 내놓은 교환 장수 (1~3장)
  targetFamily?: FunctionFamily;
}

export type NetworkMessage =
  | { type: 'JOIN'; name: string; avatar: string }
  | { type: 'LOBBY_UPDATE'; players: RemotePlayer[]; hostName: string }
  | { type: 'GAME_STARTED'; yourHand: FunctionCard[]; activeFamilies: FunctionFamily[] }
  | { type: 'OFFER_TRADE'; count: number; offerId: string }
  | { type: 'CANCEL_OFFER' }
  | { type: 'REQUEST_TRADE'; targetPeerId: string; count: number; cards: FunctionCard[] }
  | { type: 'TRADE_SUCCESS'; newHand: FunctionCard[]; partnerName: string; count: number }
  | { type: 'BELL_RING'; winnerName: string; winnerFamily: FunctionFamily; success: boolean }
  | { type: 'LOG_MESSAGE'; text: string; logType?: 'trade' | 'alert' | 'fit' | 'system' };

export interface MultiplayerRoomState {
  roomId: string;
  role: PeerRole;
  status: 'connecting' | 'lobby' | 'playing' | 'game_over';
  players: RemotePlayer[];
  myPeerId: string;
  myName: string;
  myAvatar: string;
  myHand: FunctionCard[];
  activeFamilies: FunctionFamily[];
  winner: string | null;
  logs: { id: string; text: string; time: string; type: string }[];
}
