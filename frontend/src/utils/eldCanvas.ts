import type { ELDLog } from '../types/trip';

const CANVAS_W = 960;
const CANVAS_H = 480;

const GRID_LEFT = 150;
const GRID_RIGHT = 870;
const GRID_TOP = 80;
const ROW_HEIGHT = 55;
const GRID_WIDTH = GRID_RIGHT - GRID_LEFT;
const HOUR_WIDTH = GRID_WIDTH / 24;
const GRID_BOTTOM = GRID_TOP + ROW_HEIGHT * 4;

const STATUS_ROWS: Record<string, number> = {
  off_duty: GRID_TOP + ROW_HEIGHT * 0.5,
  sleeper_berth: GRID_TOP + ROW_HEIGHT * 1.5,
  driving: GRID_TOP + ROW_HEIGHT * 2.5,
  on_duty_not_driving: GRID_TOP + ROW_HEIGHT * 3.5,
};

const STATUS_LABELS = ['Off Duty', 'Sleeper\nBerth', 'Driving', 'On Duty\n(Not Driving)'];

export function drawELDLog(ctx: CanvasRenderingContext2D, log: ELDLog) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawHeader(ctx, log);
  drawGrid(ctx);
  drawRowLabels(ctx);
  drawHourLabels(ctx);
  drawDutyStatusLine(ctx, log.segments);
  drawTotals(ctx, log.totals);
  drawRemarks(ctx, log.segments);
}

function drawHeader(ctx: CanvasRenderingContext2D, log: ELDLog) {
  // Top border
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, 0, CANVAS_W, 4);

  // Title block
  ctx.fillStyle = '#1e3a5f';
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('U.S. DEPARTMENT OF TRANSPORTATION', 12, 24);

  ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("DRIVER'S DAILY LOG", CANVAS_W / 2, 24);

  ctx.font = '10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('(ONE CALENDAR DAY — 24 HOURS)', CANVAS_W / 2, 40);

  // Date
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#1e3a5f';
  ctx.fillText(`DATE: ${formatDate(log.date)}`, 12, 58);

  // Total hours label
  ctx.textAlign = 'right';
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('TOTAL', CANVAS_W - 20, 60);
  ctx.fillText('HOURS', CANVAS_W - 20, 72);
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  // Row backgrounds - alternate
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(GRID_LEFT, GRID_TOP + i * ROW_HEIGHT, GRID_WIDTH, ROW_HEIGHT);
  }

  // Horizontal row dividers
  for (let i = 0; i <= 4; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT;
    ctx.strokeStyle = i === 0 || i === 4 ? '#334155' : '#cbd5e1';
    ctx.lineWidth = i === 0 || i === 4 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(GRID_LEFT, y);
    ctx.lineTo(GRID_RIGHT, y);
    ctx.stroke();
  }

  // Left and right borders
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(GRID_LEFT, GRID_TOP);
  ctx.lineTo(GRID_LEFT, GRID_BOTTOM);
  ctx.moveTo(GRID_RIGHT, GRID_TOP);
  ctx.lineTo(GRID_RIGHT, GRID_BOTTOM);
  ctx.stroke();

  // Vertical hour lines
  for (let h = 0; h <= 24; h++) {
    const x = GRID_LEFT + h * HOUR_WIDTH;
    const isMajor = h === 0 || h === 12 || h === 24;

    ctx.strokeStyle = isMajor ? '#64748b' : '#e2e8f0';
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(x, GRID_TOP);
    ctx.lineTo(x, GRID_BOTTOM);
    ctx.stroke();

    // 15-min ticks
    if (h < 24) {
      for (let q = 1; q <= 3; q++) {
        const qx = x + (q / 4) * HOUR_WIDTH;
        const tickLen = q === 2 ? 10 : 6;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let row = 0; row < 4; row++) {
          const rowTop = GRID_TOP + row * ROW_HEIGHT;
          ctx.beginPath();
          ctx.moveTo(qx, rowTop);
          ctx.lineTo(qx, rowTop + tickLen);
          ctx.moveTo(qx, rowTop + ROW_HEIGHT);
          ctx.lineTo(qx, rowTop + ROW_HEIGHT - tickLen);
          ctx.stroke();
        }
      }
    }
  }
}

function drawRowLabels(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'right';

  STATUS_LABELS.forEach((label, i) => {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2;
    const lines = label.split('\n');

    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#334155';

    if (lines.length === 1) {
      ctx.fillText(label, GRID_LEFT - 10, y + 4);
    } else {
      ctx.fillText(lines[0], GRID_LEFT - 10, y - 4);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(lines[1], GRID_LEFT - 10, y + 10);
    }
  });
}

function drawHourLabels(ctx: CanvasRenderingContext2D) {
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';

  for (let h = 0; h <= 24; h++) {
    const x = GRID_LEFT + h * HOUR_WIDTH;
    let label: string;

    if (h === 0 || h === 24) label = 'Mid-\nnight';
    else if (h === 12) label = 'Noon';
    else if (h < 12) label = String(h);
    else label = String(h - 12 || 12);

    ctx.fillStyle = (h === 0 || h === 12 || h === 24) ? '#1e3a5f' : '#64748b';

    if (label.includes('\n')) {
      const parts = label.split('\n');
      ctx.font = '8px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(parts[0], x, GRID_TOP - 14);
      ctx.fillText(parts[1], x, GRID_TOP - 5);
      ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
    } else {
      ctx.fillText(label, x, GRID_TOP - 8);
    }
  }
}

function drawDutyStatusLine(ctx: CanvasRenderingContext2D, segments: ELDLog['segments']) {
  if (segments.length === 0) return;

  // Draw filled areas first (light shading for driving)
  for (const seg of segments) {
    if (seg.status === 'driving') {
      const rowTop = GRID_TOP + 2 * ROW_HEIGHT;
      const startX = GRID_LEFT + (seg.start / 24) * GRID_WIDTH;
      const endX = GRID_LEFT + (seg.end / 24) * GRID_WIDTH;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(startX, rowTop, endX - startX, ROW_HEIGHT);
    }
    if (seg.status === 'sleeper_berth') {
      const rowTop = GRID_TOP + 1 * ROW_HEIGHT;
      const startX = GRID_LEFT + (seg.start / 24) * GRID_WIDTH;
      const endX = GRID_LEFT + (seg.end / 24) * GRID_WIDTH;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
      ctx.fillRect(startX, rowTop, endX - startX, ROW_HEIGHT);
    }
  }

  // Draw the duty status line
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  let started = false;
  for (const seg of segments) {
    const rowY = STATUS_ROWS[seg.status];
    if (!rowY) continue;

    const startX = GRID_LEFT + (seg.start / 24) * GRID_WIDTH;
    const endX = GRID_LEFT + (seg.end / 24) * GRID_WIDTH;

    if (!started) {
      ctx.moveTo(startX, rowY);
      started = true;
    } else {
      ctx.lineTo(startX, rowY);
    }
    ctx.lineTo(endX, rowY);
  }
  ctx.stroke();

  // Draw dots at status change points
  ctx.fillStyle = '#1e40af';
  let prevEnd = -1;
  for (const seg of segments) {
    const rowY = STATUS_ROWS[seg.status];
    if (!rowY) continue;
    const startX = GRID_LEFT + (seg.start / 24) * GRID_WIDTH;
    if (prevEnd >= 0 && Math.abs(startX - prevEnd) < 1) {
      ctx.beginPath();
      ctx.arc(startX, rowY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    prevEnd = GRID_LEFT + (seg.end / 24) * GRID_WIDTH;
  }
}

function drawTotals(ctx: CanvasRenderingContext2D, totals: ELDLog['totals']) {
  const values = [totals.off_duty, totals.sleeper_berth, totals.driving, totals.on_duty_not_driving];
  const totalX = GRID_RIGHT + 45;

  // Totals column background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(GRID_RIGHT + 5, GRID_TOP, 80, ROW_HEIGHT * 4);

  // Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(GRID_RIGHT + 5, GRID_TOP, 80, ROW_HEIGHT * 4);

  // Dividers
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(GRID_RIGHT + 5, y);
    ctx.lineTo(GRID_RIGHT + 85, y);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  values.forEach((val, i) => {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 5;
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(val.toFixed(2), totalX, y);
  });

  // Grand total
  const total = values.reduce((a, b) => a + b, 0);
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(GRID_RIGHT + 5, GRID_BOTTOM + 5, 80, 25);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Total: ${total.toFixed(1)}`, totalX, GRID_BOTTOM + 22);
}

function drawRemarks(ctx: CanvasRenderingContext2D, segments: ELDLog['segments']) {
  const remarksY = GRID_BOTTOM + 45;

  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, remarksY - 8, CANVAS_W, 2);

  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e3a5f';
  ctx.fillText('REMARKS', 12, remarksY + 8);

  ctx.font = '10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#475569';

  const remarks = segments
    .filter(s => s.remark && s.remark !== 'Driving' && s.remark !== '')
    .map(s => {
      const timeHr = Math.floor(s.start);
      const timeMin = Math.round((s.start - timeHr) * 60);
      const ampm = timeHr >= 12 ? 'PM' : 'AM';
      const hr12 = timeHr === 0 ? 12 : timeHr > 12 ? timeHr - 12 : timeHr;
      return `${hr12}:${timeMin.toString().padStart(2, '0')} ${ampm} — ${s.remark}`;
    });

  // Split into two columns
  const col1 = remarks.slice(0, 4);
  const col2 = remarks.slice(4, 8);

  col1.forEach((r, i) => {
    ctx.fillText(`• ${r}`, 12, remarksY + 26 + i * 15);
  });
  col2.forEach((r, i) => {
    ctx.fillText(`• ${r}`, CANVAS_W / 2, remarksY + 26 + i * 15);
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export { CANVAS_W, CANVAS_H };
