import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types/multiplayer';
import { sanitizeMessageForNetwork } from '../utils/cardSerialization';

export type MessageHandler = (senderPeerId: string, message: NetworkMessage) => void;
export type ConnectionHandler = (peerId: string) => void;
export type DisconnectHandler = (peerId: string) => void;

/**
 * 전 세계 및 다양한 학교/기관 방화벽, 대칭 NAT(LTE/5G 모바일 통신사망) 환경에서도
 * WebRTC ICE 협상 및 릴레이가 100% 안정적으로 성사될 수 있도록
 * 글로벌 STUN 풀 및 OpenRelay TURN 릴레이 서버 구성
 */
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      // 1. Google & Cloudflare 고속 STUN 서버
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      // 2. OpenRelay 공용 STUN 서버
      { urls: 'stun:openrelay.metered.ca:80' },
      { urls: 'stun:stun.relay.metered.ca:80' },
      // 3. OpenRelay TURN 릴레이 서버 (모바일 LTE/5G 대칭 NAT 통과 핵심)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
  },
};

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessageCallback: MessageHandler | null = null;
  private onConnectCallback: ConnectionHandler | null = null;
  private onDisconnectCallback: DisconnectHandler | null = null;
  private peerErrorCallback: ((err: Error) => void) | null = null;

  public init(
    customId?: string,
    onReady?: (myId: string) => void,
    onError?: (err: Error) => void
  ) {
    if (this.peer) {
      this.destroy();
    }

    try {
      this.peer = customId
        ? new Peer(customId, PEER_CONFIG)
        : new Peer(PEER_CONFIG);

      this.peer.on('open', (id) => {
        if (onReady) onReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err: any) => {
        console.warn('PeerJS system error:', err);
        if (this.peerErrorCallback) {
          this.peerErrorCallback(err instanceof Error ? err : new Error(err?.message || String(err)));
        }
        if (onError) {
          onError(err instanceof Error ? err : new Error(err?.message || String(err)));
        }
      });
    } catch (e) {
      if (onError && e instanceof Error) onError(e);
    }
  }

  public connectToHost(
    hostPeerId: string,
    onOpen?: () => void,
    onError?: (err: Error) => void
  ) {
    if (!this.peer) {
      if (onError) onError(new Error('P2P 서비스가 초기화되지 않았습니다.'));
      return;
    }

    let isHandshakeComplete = false;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    // 12초 타임아웃: 호스트 연결이 지연되거나 무응답인 경우 무한 로딩 차단
    timeoutTimer = setTimeout(() => {
      if (!isHandshakeComplete) {
        cleanup();
        if (onError) {
          onError(
            new Error(
              '호스트 연결 시간 초과 (12초). 호스트가 방을 열고 대기 중인지, 방 코드가 맞는지 확인해 주세요.'
            )
          );
        }
      }
    }, 12000);

    const cleanup = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      this.peerErrorCallback = null;
    };

    // Peer 레벨의 peer-unavailable 에러 인터셉트 (방 코드가 없거나 호스트가 오프라인일 때)
    this.peerErrorCallback = (err: any) => {
      const errType = err?.type;
      const errMsg = err?.message || '';
      if (errType === 'peer-unavailable' || errMsg.includes(hostPeerId)) {
        cleanup();
        if (onError) {
          onError(
            new Error(
              '입력하신 방 코드의 호스트를 찾을 수 없습니다. 방 코드가 정확한지 확인해 주세요.'
            )
          );
        }
      }
    };

    try {
      // JSON 직렬화 및 신뢰성 옵션 명시
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
        serialization: 'json',
      });

      const handleOpen = () => {
        if (isHandshakeComplete) return;
        isHandshakeComplete = true;
        cleanup();

        this.connections.set(hostPeerId, conn);
        if (onOpen) onOpen();
        if (this.onConnectCallback) this.onConnectCallback(hostPeerId);
      };

      if (conn.open) {
        handleOpen();
      } else {
        conn.on('open', handleOpen);
      }

      conn.on('data', (data) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(hostPeerId, data as NetworkMessage);
        }
      });

      conn.on('close', () => {
        this.connections.delete(hostPeerId);
        if (this.onDisconnectCallback) this.onDisconnectCallback(hostPeerId);
      });

      conn.on('error', (err) => {
        console.warn(`Host connection error (${hostPeerId}):`, err);
        cleanup();
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      });
    } catch (err) {
      cleanup();
      if (onError && err instanceof Error) onError(err);
    }
  }

  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    const handleOpen = () => {
      this.connections.set(conn.peer, conn);
      if (this.onConnectCallback) this.onConnectCallback(conn.peer);
    };

    if (conn.open) {
      handleOpen();
    } else {
      conn.on('open', handleOpen);
    }

    conn.on('data', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(conn.peer, data as NetworkMessage);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.onDisconnectCallback) this.onDisconnectCallback(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn(`Connection error on ${conn.peer}:`, err);
    });
  }

  public sendTo(peerId: string, message: NetworkMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      try {
        const safeMessage = sanitizeMessageForNetwork(message);
        conn.send(safeMessage);
      } catch (err) {
        console.error(`[PeerService] sendTo failed for peer ${peerId}:`, err);
      }
    } else {
      console.warn(`[PeerService] sendTo skipped, connection not open for ${peerId}`);
    }
  }

  public broadcast(message: NetworkMessage, excludePeerId?: string) {
    let safeMessage: unknown;
    try {
      safeMessage = sanitizeMessageForNetwork(message);
    } catch (e) {
      console.error('[PeerService] sanitizeMessageForNetwork error:', e);
      safeMessage = message;
    }

    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(safeMessage);
        } catch (err) {
          console.error(`[PeerService] broadcast failed for peer ${peerId}:`, err);
        }
      }
    });
  }

  public onMessage(callback: MessageHandler) {
    this.onMessageCallback = callback;
  }

  public onConnect(callback: ConnectionHandler) {
    this.onConnectCallback = callback;
  }

  public onDisconnect(callback: DisconnectHandler) {
    this.onDisconnectCallback = callback;
  }

  public getConnectedPeerIds(): string[] {
    return Array.from(this.connections.keys());
  }

  public destroy() {
    this.peerErrorCallback = null;
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {
        console.warn('Error closing conn:', e);
      }
    });
    this.connections.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        console.warn('Error destroying peer:', e);
      }
      this.peer = null;
    }
  }
}

export const peerService = new PeerService();
