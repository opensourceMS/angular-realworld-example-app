import { describe, expect, it } from 'vitest';
import { readingTime, ReadingTimePipe } from './reading-time.pipe';

const words = (count: number) => Array(count).fill('word').join(' ');
const ticks = String.fromCharCode(96);
const codeFence = [ticks.repeat(3), 'alpha beta', ticks.repeat(3)].join('\n');
const syntaxOnly = [ticks.repeat(3), ticks.repeat(3), '![](https://example.test)', '<p></p>', '---'].join('\n');

describe('readingTime', () => {
  it.each([
    [200, 1],
    [201, 2],
    [400, 2],
    [401, 3],
    [10000, 50],
  ])('should calculate %i words as %i minutes', (count, minutes) => {
    expect(readingTime(words(count))).toBe(minutes);
  });

  it.each(['', '   ', '\t\n ', 'hello', 'a short sentence'])('should return at least one minute for %j', body => {
    expect(readingTime(body)).toBe(1);
  });

  it('should count words regardless of whitespace separators', () => {
    expect(readingTime(words(199) + '\tword\n')).toBe(1);
    expect(readingTime(words(200) + '   word')).toBe(2);
  });

  it.each([
    ['fenced code', words(198) + '\n' + codeFence, 1],
    ['inline code', words(198) + ' ' + ticks + 'alpha beta' + ticks, 1],
    [
      'link and empty-alt image',
      words(198) + ' [alpha beta](https://example.test/a/b) ![](https://example.test/image.png)',
      1,
    ],
    ['heading', words(198) + '\n## alpha beta', 1],
    ['emphasis', words(198) + ' **alpha** _beta_', 1],
    ['blockquote', words(198) + '\n> alpha beta', 1],
    ['list markers', words(195) + '\n- alpha\n* beta\n+ gamma\n1. delta\n2. epsilon', 1],
    ['HTML tags', words(198) + '\n<p>alpha beta</p>', 1],
    ['horizontal rule', words(200) + '\n---', 1],
  ])('should exclude %s syntax while retaining content at rounding boundaries', (_label, body, expected) => {
    expect(readingTime(body as string)).toBe(expected);
    expect(readingTime((body as string) + '\nextra')).toBe(2);
  });

  it('should count code content and preserve link text', () => {
    const input = codeFence + ' ' + ticks + 'gamma delta' + ticks + ' [epsilon zeta](https://example.test)';
    expect(readingTime(input)).toBe(1);
  });

  it('should return the minimum for syntax-only Markdown', () => {
    expect(readingTime(syntaxOnly)).toBe(1);
  });

  it('should remain deterministic across repeated interleaved inputs', () => {
    const input = words(201);
    expect(readingTime(input)).toBe(2);
    expect(readingTime('single')).toBe(1);
    expect(readingTime(input)).toBe(2);
    expect(input).toBe(words(201));
  });
});

describe('ReadingTimePipe', () => {
  const pipe = new ReadingTimePipe();

  it.each([
    ['', '1 min read'],
    ['word', '1 min read'],
    [words(201), '2 min read'],
    [words(401), '3 min read'],
    [words(10000), '50 min read'],
    ['   ', '1 min read'],
  ])('should format a body as %s', (body, label) => {
    expect(pipe.transform(body)).toBe(label);
  });
});

describe('readingTime performance', () => {
  it('should measure 100 warmed 10,000-word calculations below five milliseconds each', () => {
    const body = words(10000);
    expect(readingTime(body)).toBe(50);
    for (let warmup = 0; warmup < 10; warmup++) readingTime(body);

    const durations: number[] = [];
    for (let sample = 0; sample < 100; sample++) {
      const start = performance.now();
      expect(readingTime(body)).toBe(50);
      durations.push(performance.now() - start);
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const maximum = sorted[sorted.length - 1];
    console.info(
      `readingTime 10k-word timing: runtime=${process.version}; platform=${process.platform}/${process.arch}; samples=${durations.length}; median=${median.toFixed(4)}ms; max=${maximum.toFixed(4)}ms; samplesMs=${durations.map(value => value.toFixed(4)).join(',')}`,
    );
    expect(maximum).toBeLessThan(5);
  });
});
