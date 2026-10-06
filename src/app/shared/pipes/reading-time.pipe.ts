import { Pipe, PipeTransform } from '@angular/core';

export function readingTime(body: string): number {
  const content = body
    .replace(/^\s*(```|~~~).*?\s*$/gm, ' ')
    .replace(/^\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})\s*$/gm, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^\s{0,3}(?:#{1,6}\s*|>\s*|[-+*]\s+|\d+\.\s+)/gm, ' ')
    .replace(/`+/g, '')
    .replace(/[*_~]/g, '');

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / 200));
}

@Pipe({ name: 'readingTime', standalone: true, pure: true })
export class ReadingTimePipe implements PipeTransform {
  transform(body: string): string {
    return `${readingTime(body)} min read`;
  }
}
