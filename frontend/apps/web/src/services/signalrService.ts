import * as signalR from '@microsoft/signalr';
import { HUB_URL } from './api';

export interface SignalRPlayerSlot {
  nguoiChoiId: number;
  tenHienThi: string;
  mauSac: string;
  thuatToan: string;
  isReady: boolean;
  isHost: boolean;
  connectionId?: string;
  thoiGianMs?: number | null;
  soBuocDi?: number | null;
  hasFinished: boolean;
}

export interface SignalRRoom {
  maPhong: string;
  kichThuocMeCung: number;
  viTriDich: string;
  soLuongNguoiChoiMax: number;
  trangThai: string;
  seedMeCung: number;
  nguoiChois: SignalRPlayerSlot[];
}

export interface MatchStartEvent {
  countdown: number;
  seed: number;
  size: number;
  goal: string;
  players: SignalRPlayerSlot[];
}

export interface PlayerProgressEvent {
  nguoiChoiId: number;
  x: number;
  y: number;
  heading: number;
  steps: number;
  reachedGoal: boolean;
}

export interface PlayerFinishEvent {
  nguoiChoiId: number;
  rank: number;
  thoiGianMs: number;
  soBuocDi: number;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  public async connect(): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        return this.connection;
      }
    }

    this.isConnecting = true;
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .build();

      await this.connection.start();
      console.log('[SignalR] Connected successfully to arena hub');
      return this.connection;
    } finally {
      this.isConnecting = false;
    }
  }

  public async joinRoom(maPhong: string, nguoiChoiId: number, tenHienThi: string, mauSac: string, thuatToan: string) {
    const conn = await this.connect();
    await conn.invoke('JoinRoom', maPhong, nguoiChoiId, tenHienThi, mauSac, thuatToan);
  }

  public async leaveRoom(maPhong: string) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveRoom', maPhong);
    }
  }

  public async setReady(maPhong: string, nguoiChoiId: number, isReady: boolean, thuatToan?: string) {
    const conn = await this.connect();
    await conn.invoke('SetReady', maPhong, nguoiChoiId, isReady, thuatToan || null);
  }

  public async startMatch(maPhong: string) {
    const conn = await this.connect();
    await conn.invoke('StartMatch', maPhong);
  }

  public async sendProgress(maPhong: string, nguoiChoiId: number, x: number, y: number, heading: number, steps: number, reachedGoal: boolean) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SendProgress', maPhong, nguoiChoiId, x, y, heading, steps, reachedGoal);
    }
  }

  public async submitFinish(maPhong: string, nguoiChoiId: number, thuatToan: string, thoiGianMs: number, soBuocDi: number) {
    const conn = await this.connect();
    await conn.invoke('SubmitFinish', maPhong, nguoiChoiId, thuatToan, thoiGianMs, soBuocDi);
  }

  public onRoomUpdated(callback: (room: SignalRRoom) => void) {
    this.connection?.on('RoomUpdated', callback);
  }

  public onMatchStarting(callback: (event: MatchStartEvent) => void) {
    this.connection?.on('MatchStarting', callback);
  }

  public onPlayerProgressUpdated(callback: (progress: PlayerProgressEvent) => void) {
    this.connection?.on('PlayerProgressUpdated', callback);
  }

  public onPlayerFinished(callback: (finish: PlayerFinishEvent) => void) {
    this.connection?.on('PlayerFinished', callback);
  }

  public onMatchEnded(callback: (results: SignalRPlayerSlot[]) => void) {
    this.connection?.on('MatchEnded', callback);
  }

  public removeAllListeners() {
    this.connection?.off('RoomUpdated');
    this.connection?.off('MatchStarting');
    this.connection?.off('PlayerProgressUpdated');
    this.connection?.off('PlayerFinished');
    this.connection?.off('MatchEnded');
  }
}

export const signalRService = new SignalRService();
