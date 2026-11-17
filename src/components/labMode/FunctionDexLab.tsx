import React, { useState, useMemo } from 'react';
import { FunctionFamily, PropertyTag, FunctionCard } from '../../types/math';
import { FUNCTION_CARDS, FAMILY_METAS, PROPERTY_LABELS } from '../../data/functionCards';
import { Card } from '../common/Card';
import { CardDetailModal } from '../common/CardDetailModal';
import { CartesianCanvas } from '../common/CartesianCanvas';
import { Search, Filter, Compass, Sliders, BookOpen } from 'lucide-react';

export const FunctionDexLab: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<FunctionFamily | 'all'>('all');
  const [selectedProperty, setSelectedProperty] = useState<PropertyTag | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLabCard, setActiveLabCard] = useState<FunctionCard>(FUNCTION_CARDS[0]);
  const [inspectedCard, setInspectedCard] = useState<FunctionCard | null>(null);

  // 실험실 줌 배율 범위 [-range, range]
  const [zoomRange, setZoomRange] = useState<number>(6);

  // 필터링된 카드 목록
  const filteredCards = useMemo(() => {
    return FUNCTION_CARDS.filter((card) => {
      if (selectedFamily !== 'all' && card.family !== selectedFamily) return false;
      if (selectedProperty !== 'all' && !card.properties.includes(selectedProperty)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(query);
        const matchExpr = card.expression.toLowerCase().includes(query);
        const matchFamily = FAMILY_METAS[card.family].name.toLowerCase().includes(query);
        if (!matchTitle && !matchExpr && !matchFamily) return false;
      }
      return true;
    });
  }, [selectedFamily, selectedProperty, searchQuery]);

  const activeFamilyMeta = FAMILY_METAS[activeLabCard.family];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 select-none">
      {/* 1. 인터랙티브 대형 직교좌표계 실험실 (Nintendo White Lab) */}
      <div className="p-6 rounded-3xl bg-white border border-[#dadada] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[#dadada]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-[#e60012] border border-red-200 flex items-center justify-center shrink-0">
              <Compass size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111827] flex items-center gap-2">
                데카르트 좌표평면 함수 시각화 랩
              </h2>
              <p className="text-xs text-[#727272]">
                선택한 함수의 그래프를 줌/패닝하며 실수 좌표 $(x, f(x))$와 수학적 성질을 정밀 탐구합니다.
              </p>
            </div>
          </div>

          {/* 줌 배율 슬라이더 */}
          <div className="flex items-center gap-3 bg-[#f8f8f8] px-3.5 py-2 rounded-xl border border-[#dadada]">
            <Sliders size={14} className="text-[#484848]" />
            <span className="text-xs font-bold text-[#484848]">좌표 범위 (±{zoomRange}):</span>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={zoomRange}
              onChange={(e) => setZoomRange(Number(e.target.value))}
              className="w-24 accent-[#e60012] cursor-pointer"
            />
          </div>
        </div>

        {/* 랩 메인 컨텐츠: 좌측 대형 인터랙티브 캔버스, 우측 분석 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-[560px] mb-2 px-1">
              <span className="text-lg font-mono font-black text-[#111827]">
                {activeLabCard.expression}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${activeFamilyMeta.badgeBg}`}>
                {activeFamilyMeta.name} ({activeLabCard.title})
              </span>
            </div>

            <div className="p-2 bg-[#fafafa] rounded-2xl border-2 border-[#e5e7eb] shadow-sm">
              <CartesianCanvas
                card={activeLabCard}
                width={540}
                height={300}
                interactive={true}
                showPoints={true}
                rangeX={[-zoomRange, zoomRange]}
                rangeY={[-zoomRange, zoomRange]}
                className="w-full max-w-[540px]"
              />
            </div>
            <span className="text-xs font-semibold text-[#727272] mt-2">
              💡 캔버스 위에서 마우스를 움직여 좌표값과 교점을 확인하세요.
            </span>
          </div>

          {/* 우측 수학적 특징 리포트 */}
          <div className="lg:col-span-1 space-y-3">
            <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
              <span className="text-xs text-[#727272] font-bold block mb-1">
                교과과정 및 기본형
              </span>
              <div className="text-sm font-black text-[#111827]">
                {activeFamilyMeta.curriculum}
              </div>
              <div className="text-xs font-mono font-bold text-[#e60012] mt-0.5">
                {activeFamilyMeta.generalForm}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#dadada] space-y-1.5 text-xs">
              <div>
                <span className="text-[#727272] font-semibold">정의역:</span>{' '}
                <span className="text-[#111827] font-mono font-bold">
                  {activeLabCard.features.domainStr}
                </span>
              </div>
              <div>
                <span className="text-[#727272] font-semibold">치역:</span>{' '}
                <span className="text-[#111827] font-mono font-bold">
                  {activeLabCard.features.rangeStr}
                </span>
              </div>
              <div>
                <span className="text-[#727272] font-semibold">절편:</span>{' '}
                <span className="text-[#111827]">
                  {activeLabCard.features.intercepts || '특이 절편 없음'}
                </span>
              </div>
              {activeLabCard.features.asymptotes && (
                <div>
                  <span className="text-[#727272] font-semibold">점근선:</span>{' '}
                  <span className="text-emerald-700 font-mono font-bold">
                    {activeLabCard.features.asymptotes}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#dadada]">
              <span className="text-xs text-[#727272] font-bold block mb-2">
                보유 성질 태그
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeLabCard.properties.map((prop) => (
                  <span
                    key={prop}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-white text-[#484848] border border-[#dadada] font-bold shadow-2xs"
                  >
                    {PROPERTY_LABELS[prop]?.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 함수 도감 (Card Dex) 검색 및 필터 바 */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-[#dadada] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#e60012]" />
            <h3 className="font-black text-[#111827] text-base">
              데카르트핏 전체 함수 카드 도감 ({filteredCards.length} / {FUNCTION_CARDS.length}장)
            </h3>
          </div>

          {/* 검색 입력창 */}
          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727272]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="수식, 이름 검색 (예: 2x, 포물선, 유리)"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#f8f8f8] border border-[#dadada] text-xs text-[#111827] placeholder-[#727272] font-bold focus:outline-none focus:border-[#e60012] focus:bg-white transition"
            />
          </div>
        </div>

        {/* 계열 필터 탭 */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFamily('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFamily === 'all'
                ? 'bg-[#e60012] text-white shadow-sm'
                : 'bg-[#f8f8f8] text-[#484848] hover:bg-white border border-[#dadada]'
            }`}
          >
            전체 함수
          </button>
          {(Object.keys(FAMILY_METAS) as FunctionFamily[]).map((fam) => {
            const meta = FAMILY_METAS[fam];
            const isSelected = selectedFamily === fam;
            return (
              <button
                key={fam}
                type="button"
                onClick={() => setSelectedFamily(fam)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isSelected
                    ? 'bg-[#e60012] text-white border-[#e60012] shadow-sm'
                    : 'bg-white text-[#484848] border-[#dadada] hover:border-[#ac000d]'
                }`}
              >
                {meta.name}
              </button>
            );
          })}
        </div>

        {/* 수학 성질 필터 탭 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#f0f0f0]">
          <span className="text-xs text-[#727272] font-bold flex items-center gap-1 mr-1">
            <Filter size={12} /> 성질 필터:
          </span>
          <button
            type="button"
            onClick={() => setSelectedProperty('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              selectedProperty === 'all'
                ? 'bg-[#484848] text-white shadow-xs'
                : 'bg-[#f8f8f8] text-[#727272] hover:bg-white border border-[#dadada]'
            }`}
          >
            전체 성질
          </button>
          {(Object.keys(PROPERTY_LABELS) as PropertyTag[]).map((prop) => {
            const isSelected = selectedProperty === prop;
            return (
              <button
                key={prop}
                type="button"
                onClick={() => setSelectedProperty(prop)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  isSelected
                    ? 'bg-red-100 text-[#e60012] border-red-300 shadow-xs'
                    : 'bg-white text-[#727272] border-[#dadada] hover:text-[#111827]'
                }`}
              >
                {PROPERTY_LABELS[prop].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCards.map((card) => {
          const isActive = activeLabCard.id === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setActiveLabCard(card)}
              className={`cursor-pointer transition-all duration-150 ${
                isActive ? 'ring-3 ring-[#e60012] rounded-xl shadow-md transform -translate-y-1' : ''
              }`}
            >
              <Card
                card={card}
                size="sm"
                selectable={false}
                onInspect={(c) => setInspectedCard(c)}
                showProperties={true}
              />
            </div>
          );
        })}
      </div>

      {/* 카드 상세 모달 */}
      <CardDetailModal card={inspectedCard} onClose={() => setInspectedCard(null)} />
    </div>
  );
};
