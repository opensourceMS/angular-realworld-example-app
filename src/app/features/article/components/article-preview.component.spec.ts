import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Article } from '../models/article.model';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlePreviewComponent } from './article-preview.component';

describe('ArticlePreviewComponent', () => {
  let fixture: ComponentFixture<ArticlePreviewComponent>;
  const article = (body?: string): Article => ({
    slug: 'test-article',
    title: 'Test Article',
    description: 'A description',
    body,
    tagList: ['angular'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'reader', bio: '', image: '', following: false },
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ArticlePreviewComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ArticlePreviewComponent);
  });

  function render(value: Article): HTMLElement {
    fixture.componentRef.setInput('articleInput', value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should hide reading time on list articles with omitted body', () => {
    const host = render(article());
    expect(host.querySelector('.reading-time')).toBeNull();
  });

  it.each([
    ['', '1 min read'],
    [Array(201).fill('word').join(' '), '2 min read'],
  ])('should show reading time when a list article supplies a body', (body, expected) => {
    const host = render(article(body));
    expect(host.querySelector('.reading-time')?.textContent?.trim()).toBe(expected);
  });

  it('should preserve preview content, navigation, favorite projection, and avoid body-fetch calls', () => {
    const host = render(article('preview body'));

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Test Article');
    expect(host.querySelector('.preview-link p')?.textContent?.trim()).toBe('A description');
    expect(host.querySelector('.author')?.textContent?.trim()).toBe('reader');
    expect(host.querySelector('.preview-link')?.getAttribute('href')).toContain('/article/test-article');
    expect(host.querySelector('app-favorite-button')).toBeTruthy();
  });
});
