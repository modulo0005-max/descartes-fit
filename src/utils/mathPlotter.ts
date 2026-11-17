import { FunctionCard } from '../types/math';

export interface PlotOptions {
  width: number;
  height: number;
  rangeX?: [number, number];
  rangeY?: [number, number];
  lineColor?: string;
  lineWidth?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showLabels?: boolean;
  showPoints?: boolean;
  hoverPoint?: { x: number; y: number } | null;
  theme?: 'nintendo' | 'dark';
}

export function drawCartesianGraph(
  ctx: CanvasRenderingContext2D,
  card: FunctionCard,
  options: PlotOptions
) {
  const {
    width,
    height,
    rangeX = card.domain || [-6, 6],
    rangeY = [-6, 6],
    lineColor = '#e60012',
    lineWidth = 2.5,
    showGrid = true,
    showAxes = true,
    showLabels = true,
    showPoints = true,
    hoverPoint = null,
    theme = 'nintendo',
  } = options;

  ctx.clearRect(0, 0, width, height);

  const [minX, maxX] = rangeX;
  const [minY, maxY] = rangeY;

  // 좌표계 변환 함수 (수학적 x, y -> 캔버스 px)
  const toScreenX = (x: number) => ((x - minX) / (maxX - minX)) * width;
  const toScreenY = (y: number) => height - ((y - minY) / (maxY - minY)) * height;

  const isNintendo = theme === 'nintendo';
  const gridColor = isNintendo ? '#f0f0f0' : '#1e293b';
  const axisColor = isNintendo ? '#727272' : '#64748b';
  const labelColor = isNintendo ? '#727272' : '#94a3b8';

  // 1. 배경 채우기 (Nintendo: 순백색 #ffffff)
  if (isNintendo) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. 격자 (Grid) 그리기
  if (showGrid) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // 수직 격자선
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
      if (x === 0) continue;
      const sx = toScreenX(x);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    // 수평 격자선
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
      if (y === 0) continue;
      const sy = toScreenY(y);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
  }

  // 3. 좌표축 (X, Y Axes) 그리기
  if (showAxes) {
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const originX = toScreenX(0);
    const originY = toScreenY(0);

    // X축
    if (originY >= 0 && originY <= height) {
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
    }
    // Y축
    if (originX >= 0 && originX <= width) {
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
    }
    ctx.stroke();

    // 눈금 라벨
    if (showLabels) {
      ctx.fillStyle = labelColor;
      ctx.font = '10px Geologica, Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 2) {
        if (x === 0) continue;
        const sx = toScreenX(x);
        const sy = Math.min(Math.max(originY + 4, 12), height - 14);
        ctx.fillText(x.toString(), sx, sy);
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = Math.ceil(minY); y <= Math.floor(maxY); y += 2) {
        if (y === 0) continue;
        const sy = toScreenY(y);
        const sx = Math.min(Math.max(originX - 4, 16), width - 4);
        ctx.fillText(y.toString(), sx, sy);
      }
    }
  }

  // 4. 함수 곡선 그리기
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip(); // 캔버스 영역 밖 클리핑

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const stepPx = 1;
  let isDrawing = false;
  let prevScreenY: number | null = null;

  ctx.beginPath();
  for (let px = 0; px <= width; px += stepPx) {
    const mathX = minX + (px / width) * (maxX - minX);
    let mathY: number | null = null;

    try {
      mathY = card.evaluator(mathX);
    } catch {
      mathY = null;
    }

    if (mathY === null || isNaN(mathY) || !isFinite(mathY)) {
      isDrawing = false;
      prevScreenY = null;
      continue;
    }

    const sy = toScreenY(mathY);

    // 급격한 불연속점(점근선 등) 감지 (y 도약이 화면 높이의 80%를 넘을 때)
    if (prevScreenY !== null && Math.abs(sy - prevScreenY) > height * 0.8) {
      isDrawing = false;
    }

    if (!isDrawing) {
      ctx.moveTo(px, sy);
      isDrawing = true;
    } else {
      ctx.lineTo(px, sy);
    }

    prevScreenY = sy;
  }
  ctx.stroke();

  // 5. 주요 특징점(Points of Interest) 강조
  if (showPoints && card.pointsOfInterest) {
    for (const pt of card.pointsOfInterest) {
      if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);

        // 글로우 효과
        ctx.beginPath();
        ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = isNintendo ? '#e6001222' : lineColor + '44';
        ctx.fill();

        // 중심 점
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  // 6. 호버 크로스헤어
  if (hoverPoint) {
    const sx = toScreenX(hoverPoint.x);
    const sy = toScreenY(hoverPoint.y);

    ctx.strokeStyle = '#e60012';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 호버 점
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e60012';
    ctx.fill();
  }

  ctx.restore();
}
