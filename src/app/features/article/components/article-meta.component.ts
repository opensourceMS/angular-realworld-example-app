import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Article } from '../models/article.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DefaultImagePipe } from '../../../shared/pipes/default-image.pipe';
import { ReadingTimePipe } from '../../../shared/pipes/reading-time.pipe';

@Component({
  selector: 'app-article-meta',
  template: `
    <div class="article-meta">
      <a [routerLink]="['/profile', article.author.username]">
        <img [src]="article.author.image | defaultImage" />
      </a>

      <div class="info">
        <a class="author" [routerLink]="['/profile', article.author.username]">
          {{ article.author.username }}
        </a>
        <span class="date">
          {{ article.createdAt | date: 'longDate' }}
        </span>
        @if (article.body != null) {
          <span class="reading-time">{{ article.body | readingTime }}</span>
        }
      </div>

      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DefaultImagePipe, ReadingTimePipe],
})
export class ArticleMetaComponent {
  @Input() article!: Article;
}
