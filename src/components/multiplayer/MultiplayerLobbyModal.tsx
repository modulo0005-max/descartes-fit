import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import { FunctionFamily } from '../../types/math';
import { MultiplayerGameType } from '../../types/multiplayer';
import {
  Users,
  QrCode,
  Copy,
  Check,
  Play,
  Wifi,
  Smartphone,
  School,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  multiplayer: ReturnType<typeof useMultiplayerGame>;
  initialRoomCode?: string;
  initialTab?: 'host' | 'client';
  allowedFamilies?: FunctionFamily[];
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  multiplayer,
  initialRoomCode = '',
  initialTab = 'host',
  allowedFamilies,
}) => {
  const {
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    startMultiplayerGame,
    leaveRoom,
  } = multiplayer;

  const [activeTab, setActiveTab] = useState<'host' | 'client'>(initialTab);
  const [selectedGameType, setSelectedGameType] = useState<MultiplayerGameType>('pit');
  const [inputRoomId, setInputRoomId] = useState(initialRoomCode);
  const [inputName, setInputName] = useState(roomState.myName);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setInputRoomId(initialRoomCode);
      setActiveTab('client');
    }
  }, [initialRoomCode]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 호스트 방 생성 핸들러
  const handleHostCreate = () => {
    createRoom(inputName);
  };

  // 클라이언트 참여 핸들러
  const handleClientJoin = () => {
    if (!inputRoomId.trim()) return;
    joinRoom(inputRoomId.trim().toUpperCase(), inputName);
  };

  // 방 코드 클립보드 복사
  const handleCopyCode = () => {
    if (!roomState.roomId) return;
    navigator.clipboard.writeText(roomState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 모바일 접속 URL 생성
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomState.roomId}`
      : `https://descartes-fit.web.app/?room=${roomState.roomId}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📡 교실 실시간 P2P 멀티플레이어 로비"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-[#484848] select-none">
        {/* 상단 탭 전환: 교실 호스트 vs 학생 모바일 참여 */}
        <div className="flex rounded-xl bg-[#f8f8f8] p-1.5 border border-[#dadada]">
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-2.5 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'host'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <School size={18} />
            <span>교실 스마트보드 호스트 (방 만들기)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-2.5 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'client'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'text-[#484848] hover:bg-white'
            }`}
          >
            <Smartphone size={18} />
            <span>학생 스마트폰/태블릿 참여 (방 들어가기)</span>
          </button>
        </div>

        {/* 1. 호스트 뷰 (교실 전자칠판 / 교사용 화면) */}
        {activeTab === 'host' && (
          <div className="space-y-6">
            {!roomState.roomId ? (
              <div className="text-center py-8 bg-[#fdfdfd] border-2 border-dashed border-[#dadada] rounded-2xl p-6">
                <QrCode className="w-16 h-16 mx-auto text-[#e60012] mb-3 animate-pulse" />
                <h3 className="text-xl font-black text-[#111827] mb-2 font-game">
                  새로운 교실 대전 방을 생성하시겠습니까?
                </h3>
                <p className="text-sm text-[#727272] max-w-md mx-auto mb-6">
                  호스트 방을 열면 교실 전자칠판에 <strong>대형 QR 코드</strong>와 <strong>4자리 룸코드</strong>가 표시되어, 학생들이 스마트폰 카메라로 즉시 스캔하여 참여할 수 있습니다.
                </p>

                {errorMessage && (
                  <div className="mb-4 max-w-md mx-auto p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 justify-center">
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="선생님 닉네임"
                    className="px-4 py-2 rounded-xl border border-[#dadada] text-sm font-bold w-48 text-center"
                  />
                  <button
                    type="button"
                    onClick={handleHostCreate}
                    disabled={roomState.status === 'connecting'}
                    className="btn-nintendo-red px-6 py-2.5 text-base font-game font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {roomState.status === 'connecting' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <span>🚀 호스트 룸 생성하기</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#fdfdfd] border border-[#dadada] rounded-2xl p-6 shadow-sm">
                {/* 좌측: 대형 QR 코드 및 방 번호 */}
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-[#dadada] rounded-xl shadow-xs">
                  <div className="p-3 bg-white rounded-xl shadow-inner border border-[#e5e7eb] mb-3">
                    <QRCodeSVG
                      value={joinUrl}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="text-center w-full">
                    <div className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-1">
                      교실 접속 룸 코드 (4자리)
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-3xl font-black text-[#e60012] tracking-widest bg-red-50 px-4 py-1 rounded-lg border border-red-200">
                        {roomState.roomId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-2 rounded-lg border border-[#dadada] hover:bg-slate-50 text-[#484848]"
                        title="룸 코드 복사"
                      >
                        {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <div className="text-[11px] text-[#727272] mt-2">
                      스마트폰 카메라로 위 QR 코드를 스캔하면 자동 접속됩니다!
                    </div>
                  </div>
                </div>

                {/* 우측: 접속한 플레이어 목록 & 게임 시작 버튼 */}
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#dadada]">
                      <span className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                        <Users size={16} className="text-[#e60012]" />
                        대기실 참여 인원 ({roomState.players.length}명)
                      </span>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <Wifi size={14} /> P2P 활성
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {roomState.players.map((p) => (
                        <div
                          key={p.peerId}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-[#dadada] bg-white shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{p.avatar}</span>
                            <div>
                              <div className="font-bold text-sm text-[#111827]">
                                {p.name}
                                {p.isHost && (
                                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-[#e60012]">
                                    방장(교사)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-semibold">
                                {p.isReady ? '준비 완료' : '대기 중'}
                              </div>
                            </div>
                          </div>

                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#dadada] space-y-3">
                    {/* 게임 모드 선택 3종 */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-[#484848] flex items-center justify-between">
                        <span>플레이할 교실 게임 모드:</span>
                        <span className="text-[11px] font-normal text-[#888]">
                          {selectedGameType === 'pit'
                            ? '9장 세트 실시간 맞교환'
                            : selectedGameType === 'descartes_x'
                            ? '공통 성질 털기 원카드'
                            : '5라운드 함숫값 배틀'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGameType('pit')}
                          className={`py-2 px-1 rounded-xl text-xs font-game font-black flex flex-col items-center justify-center gap-0.5 border-2 transition ${
                            selectedGameType === 'pit'
                              ? 'bg-red-50 border-[#e60012] text-[#e60012] shadow-xs'
                              : 'bg-white border-[#dadada] text-[#727272] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">🔔</span>
                          <span>데카르트 핏</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedGameType('descartes_x')}
                          className={`py-2 px-1 rounded-xl text-xs font-game font-black flex flex-col items-center justify-center gap-0.5 border-2 transition ${
                            selectedGameType === 'descartes_x'
                              ? 'bg-red-50 border-[#e60012] text-[#e60012] shadow-xs'
                              : 'bg-white border-[#dadada] text-[#727272] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">🃏</span>
                          <span>데카르트 X</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedGameType('descartes_y')}
                          className={`py-2 px-1 rounded-xl text-xs font-game font-black flex flex-col items-center justify-center gap-0.5 border-2 transition ${
                            selectedGameType === 'descartes_y'
                              ? 'bg-red-50 border-[#e60012] text-[#e60012] shadow-xs'
                              : 'bg-white border-[#dadada] text-[#727272] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">⚔️</span>
                          <span>데카르트 Y</span>
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const playerCount = roomState.players.length;
                      const canStart = playerCount >= 2;
                      const gameName =
                        selectedGameType === 'pit'
                          ? '데카르트 핏'
                          : selectedGameType === 'descartes_x'
                          ? '데카르트 X'
                          : '데카르트 Y';

                      const buttonLabel =
                        playerCount < 2
                          ? '대기 중 (학생 접속 대기... 최소 2인 필요)'
                          : `🚀 [${gameName}] ${playerCount}인 대전 시작하기!`;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            startMultiplayerGame(selectedGameType, allowedFamilies);
                            onClose();
                          }}
                          disabled={!canStart}
                          className="btn-nintendo-red w-full py-3 text-base font-game font-black flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Play size={18} fill="currentColor" />
                          <span>{buttonLabel}</span>
                        </button>
                      );
                    })()}
                    <div className="flex items-center justify-between text-[11px] text-[#727272] px-1">
                      <span>* 2인, 3인, 4인 모두 지원되며 선택한 게임 보드가 전체 학생에게 동기화됩니다.</span>
                      <button
                        type="button"
                        onClick={leaveRoom}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        방 폭파 / 닫기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. 클라이언트 뷰 (학생 참여 화면) */}
        {activeTab === 'client' && (
          <div className="max-w-md mx-auto p-6 bg-[#fdfdfd] border border-[#dadada] rounded-2xl shadow-sm space-y-4">
            {roomState.status === 'lobby' ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-game font-black text-[#111827]">
                    [{roomState.roomId}] 방 접속 완료!
                  </h3>
                  <p className="text-xs text-[#727272] mt-1">
                    선생님이 게임을 시작할 때까지 잠시 대기해 주세요.<br />
                    시작 시 자동으로 9장의 카드를 배분받고 대전 화면으로 이동합니다!
                  </p>
                </div>

                {/* 현재 참여 학생 목록 */}
                <div className="bg-white rounded-2xl border border-[#dadada] p-3 text-left">
                  <div className="text-xs font-bold text-[#888] mb-2 flex items-center justify-between">
                    <span>함께 입장한 플레이어</span>
                    <span className="text-[#e60012]">{roomState.players.length}명</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {roomState.players.map((p) => (
                      <div
                        key={p.peerId}
                        className="flex items-center justify-between text-xs font-bold p-2 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <span>{p.avatar}</span>
                          <span>{p.name} {p.isHost && '(선생님)'}</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          접속 중
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={leaveRoom}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    대기실 나가기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto text-[#e60012] mb-2" />
                  <h3 className="text-lg font-black text-[#111827] font-game">
                    선생님의 교실 방 참가하기
                  </h3>
                  <p className="text-xs text-[#727272] mt-1">
                    전자칠판에 뜬 4자리 룸코드를 입력하고 접속하세요.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#484848] mb-1">
                      내 닉네임
                    </label>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="예: 1반 김수학"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#dadada] text-sm font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#484848] mb-1">
                      룸 코드 (4자리 영문/숫자)
                    </label>
                    <input
                      type="text"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="예: ABCD"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#dadada] text-lg font-black font-mono text-center uppercase tracking-widest bg-white"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertCircle size={15} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleClientJoin}
                    disabled={!inputRoomId.trim() || roomState.status === 'connecting'}
                    className="btn-nintendo-red w-full py-3 text-base font-game font-black flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {roomState.status === 'connecting' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>호스트 연결 중...</span>
                      </>
                    ) : (
                      <span>접속하기 ➔</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 하단 기술 안내 푸터 */}
        <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada] text-xs text-[#727272] flex items-start gap-2.5">
          <HelpCircle size={16} className="text-[#e60012] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>WebRTC P2P 무설치 통신 기술:</strong> 별도의 외부 유료 서버 가입 없이 브라우저 간에 암호화된 고속 데이터 채널을 직접 연결합니다. 학교 와이파이 망 내에서도 지연 없이 실시간 카드 교환을 즐길 수 있습니다.
          </div>
        </div>
      </div>
    </Modal>
  );
};
