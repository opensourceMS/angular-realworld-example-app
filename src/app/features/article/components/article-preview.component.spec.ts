import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';
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
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: { get: vi.fn(), favorite: vi.fn(), unfavorite: vi.fn() } },
        { provide: UserService, useValue: { currentUser: of(null), isAuthenticated: of(false) } },
      ],
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

  it('should preserve preview metadata and issue no body fetch across input updates', () => {
    const articles = TestBed.inject(ArticlesService);
    const host = render(article());

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Test Article');
    expect(host.querySelector('.preview-link p')?.textContent?.trim()).toBe('A description');
    expect(host.querySelector('.author')?.textContent?.trim()).toBe('reader');
    expect(host.querySelector('.author')?.getAttribute('href')).toBe('/profile/reader');
    expect(host.querySelector('.date')?.textContent?.trim()).toBe('January 1, 2024');
    expect(host.querySelector('.article-meta img')?.getAttribute('src')).toBe('/assets/default-avatar.svg');
    expect(host.querySelector('.preview-link')?.getAttribute('href')).toContain('/article/test-article');
    expect(host.querySelector('app-favorite-button')).toBeTruthy();

    expect(host.querySelector('.reading-time')).toBeNull();
    expect(articles.get).not.toHaveBeenCalled();
    fixture.componentRef.setInput('articleInput', article('preview body'));
    fixture.detectChanges();
    expect(host.querySelector('.reading-time')?.textContent?.trim()).toBe('1 min read');
    fixture.detectChanges();
    expect(articles.get).not.toHaveBeenCalled();
    fixture.componentRef.setInput('articleInput', article());
    fixture.detectChanges();
    expect(host.querySelector('.reading-time')).toBeNull();
    expect(articles.get).not.toHaveBeenCalled();
  });
});
