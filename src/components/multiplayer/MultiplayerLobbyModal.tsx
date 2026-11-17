import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
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
} from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    startMultiplayerGame,
  } = useMultiplayerGame();

  const [activeTab, setActiveTab] = useState<'host' | 'client'>('host');
  const [inputRoomId, setInputRoomId] = useState('');
  const [inputName, setInputName] = useState(roomState.myName);
  const [copied, setCopied] = useState(false);

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
  const joinUrl = typeof window !== 'undefined'
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
                <h3 className="text-xl font-black text-[#111827] mb-2">
                  새로운 교실 대전 방을 생성하시겠습니까?
                </h3>
                <p className="text-sm text-[#727272] max-w-md mx-auto mb-6">
                  호스트 방을 열면 교실 전자칠판에 <strong>대형 QR 코드</strong>와 <strong>4자리 룸코드</strong>가 표시되어, 학생들이 스마트폰 카메라로 즉시 스캔하여 참여할 수 있습니다.
                </p>

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
                    className="nintendo-btn-primary px-6 py-2.5 text-base font-bold shadow-md"
                  >
                    🚀 호스트 룸 생성하기
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
                      스마트폰 카메라로 위 QR 코드를 스캔하세요!
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
                        <Wifi size={14} /> P2P 연결 활성
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
                              <div className="text-[10px] text-[#727272]">
                                {p.isReady ? '준비 완료' : '대기 중'}
                              </div>
                            </div>
                          </div>

                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#dadada]">
                    <button
                      type="button"
                      onClick={() => {
                        startMultiplayerGame();
                        onClose();
                      }}
                      className="nintendo-btn-primary w-full py-3 text-base font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>게임 시작 (모든 학생에게 9장 배분)</span>
                    </button>
                    <div className="text-[11px] text-[#727272] text-center mt-2">
                      * 2명 이상 참여 시 정규 교환 게임이 진행됩니다.
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
            <div className="text-center mb-4">
              <Smartphone className="w-12 h-12 mx-auto text-[#e60012] mb-2" />
              <h3 className="text-lg font-black text-[#111827]">선생님의 교실 방 참가하기</h3>
              <p className="text-xs text-[#727272] mt-1">
                칠판에 뜬 4자리 룸코드를 입력하고 접속하세요.
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
                  placeholder="예: DESK"
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
                disabled={!inputRoomId.trim()}
                className="nintendo-btn-primary w-full py-3 text-base font-black flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <span>접속하기 ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* 하단 기술 안내 푸터 */}
        <div className="p-3.5 rounded-xl bg-[#f8f8f8] border border-[#dadada] text-xs text-[#727272] flex items-start gap-2.5">
          <HelpCircle size={16} className="text-[#e60012] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>WebRTC P2P 무설치 통신 기술:</strong> 외부 상용 서버 없이 브라우저 간에 직접 암호화된 고속 데이터 채널을 연결합니다. 학교 와이파이 망 내에서도 지연 없이 실시간 카드 교환을 즐길 수 있습니다.
          </div>
        </div>
      </div>
    </Modal>
  );
};
