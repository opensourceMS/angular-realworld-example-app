import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { Article } from '../models/article.model';
import { ArticleMetaComponent } from './article-meta.component';

@Component({
  standalone: true,
  imports: [ArticleMetaComponent],
  template: `
    <app-article-meta [article]="article">
      <button class="projected-action">Action</button>
    </app-article-meta>
  `,
})
class ArticleMetaHostComponent {
  @Input() article!: Article;
}

describe('ArticleMetaComponent', () => {
  let fixture: ComponentFixture<ArticleMetaHostComponent>;
  const article = (body?: string): Article => ({
    slug: 'test-article',
    title: 'Test article',
    description: 'Description',
    body,
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'reader', bio: '', image: '', following: false },
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ArticleMetaHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ArticleMetaHostComponent);
  });

  function setArticle(value: Article): HTMLElement {
    fixture.componentRef.setInput('article', value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it.each([undefined, null])('should hide reading time when body is absent', absentBody => {
    const host = setArticle({ ...article(), body: absentBody as undefined });
    expect(host.querySelector('.reading-time')).toBeNull();
  });

  it.each([
    ['', '1 min read'],
    ['   ', '1 min read'],
    ['short body', '1 min read'],
    [Array(401).fill('word').join(' '), '3 min read'],
  ])('should display reading time for a present body', (body, expected) => {
    const host = setArticle(article(body));
    expect(host.querySelectorAll('.reading-time')).toHaveLength(1);
    expect(host.querySelector('.reading-time')?.textContent?.trim()).toBe(expected);
  });

  it('should keep reading time beside the date and preserve author and projected actions', () => {
    const host = setArticle(article('body'));
    const date = host.querySelector('.date');
    const readingTime = host.querySelector('.reading-time');

    expect(readingTime?.parentElement?.classList.contains('info')).toBe(true);
    expect(readingTime?.previousElementSibling).toBe(date);
    expect(host.querySelector('.author')?.textContent?.trim()).toBe('reader');
    expect(host.querySelector('.projected-action')?.textContent?.trim()).toBe('Action');
  });

  it('should update reading time when OnPush input changes', () => {
    const host = setArticle(article(''));
    expect(host.querySelector('.reading-time')?.textContent?.trim()).toBe('1 min read');

    fixture.componentRef.setInput('article', article(Array(201).fill('word').join(' ')));
    fixture.detectChanges();
    expect(host.querySelector('.reading-time')?.textContent?.trim()).toBe('2 min read');

    fixture.componentRef.setInput('article', article());
    fixture.detectChanges();
    expect(host.querySelector('.reading-time')).toBeNull();
  });
});
