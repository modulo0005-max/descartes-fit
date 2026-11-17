import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types/multiplayer';

export type MessageHandler = (senderPeerId: string, message: NetworkMessage) => void;
export type ConnectionHandler = (peerId: string) => void;
export type DisconnectHandler = (peerId: string) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessageCallback: MessageHandler | null = null;
  private onConnectCallback: ConnectionHandler | null = null;
  private onDisconnectCallback: DisconnectHandler | null = null;

  public init(
    customId?: string,
    onReady?: (myId: string) => void,
    onError?: (err: Error) => void
  ) {
    if (this.peer) {
      this.destroy();
    }

    try {
      this.peer = customId ? new Peer(customId) : new Peer();

      this.peer.on('open', (id) => {
        if (onReady) onReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        if (onError) onError(err);
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
    if (!this.peer) return;

    const conn = this.peer.connect(hostPeerId, { reliable: true });

    conn.on('open', () => {
      this.connections.set(hostPeerId, conn);
      if (onOpen) onOpen();
      if (this.onConnectCallback) this.onConnectCallback(hostPeerId);
    });

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
      if (onError) onError(err);
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.onConnectCallback) this.onConnectCallback(conn.peer);
    });

    conn.on('data', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(conn.peer, data as NetworkMessage);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.onDisconnectCallback) this.onDisconnectCallback(conn.peer);
    });
  }

  public sendTo(peerId: string, message: NetworkMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
    }
  }

  public broadcast(message: NetworkMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(message);
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
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerService = new PeerService();
