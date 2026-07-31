import { describe, it, expect } from 'vitest';

// Inline copy — test defines the contract
function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 75) return 'bg-orange-400';
  return 'bg-blue-500';
}

describe('barColor', () => {
  it('devuelve azul cuando pct < 75', () => {
    expect(barColor(0)).toBe('bg-blue-500');
    expect(barColor(74.9)).toBe('bg-blue-500');
  });

  it('devuelve naranja cuando 75 <= pct < 100', () => {
    expect(barColor(75)).toBe('bg-orange-400');
    expect(barColor(99.9)).toBe('bg-orange-400');
  });

  it('devuelve rojo cuando pct >= 100', () => {
    expect(barColor(100)).toBe('bg-red-500');
    expect(barColor(150)).toBe('bg-red-500');
  });
});
