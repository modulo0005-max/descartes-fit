import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* 닌텐도 스타일 부드러운 웜 딤 블러 백드롭 */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* 닌텐도 디자인 시스템 화이트 모달 컨테이너 (고대비, 볼드 코너 24px) */}
      <div
        className={`relative w-full ${maxWidthClass} bg-white border-2 border-[#e5e7eb] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]`}
      >
        {/* 모달 헤더 (퓨어 화이트 & 닌텐도 레드 로고 배지) */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#f0f0f0] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e60012] text-white font-black text-sm flex items-center justify-center shadow-xs">
              f(x)
            </div>
            <h2 className="text-xl font-black text-[#111827] tracking-tight">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f8f8f8] hover:bg-red-50 text-[#727272] hover:text-[#e60012] border border-[#dadada] hover:border-red-200 flex items-center justify-center transition active:scale-95"
            aria-label="닫기"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* 모달 본문 영역 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
