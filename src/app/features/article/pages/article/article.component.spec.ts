import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import ArticleComponent from './article.component';

describe('ArticleComponent', () => {
  const article = (body?: string): Article => ({
    slug: 'test-article',
    title: 'Test Article',
    description: 'A description',
    body,
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'reader', bio: '', image: '', following: false },
  });

  async function render(value: Article): Promise<HTMLElement> {
    TestBed.resetTestingModule();
    const articles = { get: vi.fn(() => of(value)) };
    const comments = { getAll: vi.fn(() => of([])) };
    await TestBed.configureTestingModule({
      imports: [ArticleComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { slug: 'test-article' } } } },
        { provide: ArticlesService, useValue: articles },
        { provide: CommentsService, useValue: comments },
        { provide: UserService, useValue: { currentUser: of(null), isAuthenticated: of(false) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ArticleComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(articles.get).toHaveBeenCalledTimes(1);
    expect(comments.getAll).toHaveBeenCalledTimes(1);
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should show the same reading time in both page meta blocks', async () => {
    const host = await render(article(Array(401).fill('word').join(' ')));
    const banner = host.querySelectorAll('.banner app-article-meta .reading-time');
    const actions = host.querySelectorAll('.article-actions app-article-meta .reading-time');

    expect(banner).toHaveLength(1);
    expect(actions).toHaveLength(1);
    expect(banner[0].textContent?.trim()).toBe('3 min read');
    expect(actions[0].textContent?.trim()).toBe('3 min read');
    expect(banner[0].previousElementSibling?.classList.contains('date')).toBe(true);
    expect(actions[0].previousElementSibling?.classList.contains('date')).toBe(true);
    expect(host.querySelector('.article-content')).toBeTruthy();
  });

  it('should show one minute for an empty body in both meta blocks', async () => {
    const host = await render(article(''));
    expect(host.querySelectorAll('.reading-time')).toHaveLength(2);
    expect(Array.from(host.querySelectorAll('.reading-time')).map(element => element.textContent?.trim())).toEqual([
      '1 min read',
      '1 min read',
    ]);
  });

  it('should safely render an omitted body without a reading-time placeholder', async () => {
    const host = await render(article());
    expect(host.querySelectorAll('.reading-time')).toHaveLength(0);
    expect(host.querySelector('.article-content div')?.textContent?.trim()).toBe('');
  });
});
