import { FunctionCard, FunctionFamily, PropertyTag } from './math';

export type GameMode = 'pit' | 'rush' | 'lab' | 'descartes_x' | 'descartes_y';
export type PlayerCount = 2 | 3 | 4;
export type FitSubRule = 'classic' | 'silent' | 'open_hand' | 'team_2v2';
export type TradePacing = 'learning' | 'normal' | 'speed';

export interface TradeReport {
  partnerName: string;
  partnerAvatar: string;
  givenCards: FunctionCard[];
  receivedCards: FunctionCard[];
  targetFamily?: FunctionFamily;
  dominantCount: number;
  comment: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHuman: boolean;
  hand: FunctionCard[];
  targetFamily?: FunctionFamily;
  score: number;
  currentTradeOffer?: {
    count: number;
    cardIds: string[];
    family: FunctionFamily;
    timestamp: number;
  };
}

export interface PitGameStatus {
  phase: 'idle' | 'trading' | 'round_over' | 'game_over';
  round: number;
  winner: Player | null;
  winReason?: string;
  tradingLogs: {
    id: string;
    text: string;
    type: 'trade' | 'alert' | 'fit' | 'system';
    time: string;
  }[];
}

export interface RushMission {
  id: string;
  property: PropertyTag;
  title: string;
  description: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  minGrade: 'high1' | 'high2';
}

export interface RushGameState {
  score: number;
  combo: number;
  maxCombo: number;
  timeLeft: number;
  currentMission: RushMission;
  options: FunctionCard[];
  isGameActive: boolean;
  history: {
    mission: string;
    card: FunctionCard;
    isCorrect: boolean;
  }[];
}
