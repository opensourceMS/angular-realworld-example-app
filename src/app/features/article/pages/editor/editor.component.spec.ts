import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { ArticlesService } from '../../services/articles.service';
import EditorComponent from './editor.component';

describe('EditorComponent', () => {
  const loadedArticle = (body?: string): Article => ({
    slug: 'test-article',
    title: 'Test Article',
    description: 'A description',
    body,
    tagList: ['angular', 'testing'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'owner', bio: '', image: '', following: false },
  });

  async function createEditor(article: Article) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { slug: 'test-article' } } } },
        { provide: ArticlesService, useValue: { get: () => of(article) } },
        { provide: UserService, useValue: { getCurrentUser: () => of({ user: { username: 'owner' } }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should populate the existing body, tags, and form values when loading a complete article', async () => {
    const component = await createEditor(loadedArticle('original markdown body'));

    expect(component.articleForm.value).toEqual({
      title: 'Test Article',
      description: 'A description',
      body: 'original markdown body',
    });
    expect(component.tagList()).toEqual(['angular', 'testing']);
  });

  it('should keep the body control safe when a loaded article omits body', async () => {
    const component = await createEditor(loadedArticle());

    expect(component.articleForm.value).toEqual({
      title: 'Test Article',
      description: 'A description',
      body: '',
    });
    expect(component.tagList()).toEqual(['angular', 'testing']);
  });
});
