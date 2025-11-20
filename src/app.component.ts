
import { ChangeDetectionStrategy, Component, inject, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { BrandIdentity } from './models/brand-identity.model';

type AppState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);
  private readonly platformId = inject(PLATFORM_ID);
  
  mission = signal<string>('');
  state = signal<AppState>('idle');
  error = signal<string | null>(null);
  
  brandIdentity = signal<BrandIdentity | null>(null);
  primaryLogo = signal<string | null>(null);
  secondaryMarks = signal<string[]>([]);

  // For loading state UI
  loadingMessage = signal<string>('');
  loadingProgress = signal<number>(0);
  private loadingInterval: any;

  constructor() {
    effect(() => {
      const identity = this.brandIdentity();
      if (identity && isPlatformBrowser(this.platformId)) {
        this.loadGoogleFont(identity.fonts.header.importUrl);
        this.loadGoogleFont(identity.fonts.body.importUrl);
      }
    });
  }

  async generateBrandIdentity(): Promise<void> {
    if (this.mission().trim().length < 10) {
      this.error.set('Please provide a more detailed mission statement.');
      this.state.set('error');
      return;
    }

    this.state.set('loading');
    this.error.set(null);
    this.brandIdentity.set(null);
    this.primaryLogo.set(null);
    this.secondaryMarks.set([]);
    this.startLoadingAnimation();

    try {
      const [identity, images] = await Promise.all([
        this.geminiService.generateBrandIdentity(this.mission()),
        this.geminiService.generateLogos(this.mission())
      ]);

      this.brandIdentity.set(identity);
      
      if (images && images.length > 0) {
        this.primaryLogo.set(`data:image/png;base64,${images[0]}`);
        if (images.length > 1) {
          this.secondaryMarks.set(images.slice(1).map(img => `data:image/png;base64,${img}`));
        }
      }
      
      this.state.set('success');
    } catch (err) {
      console.error(err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
      this.error.set(`Failed to generate brand identity. ${errorMessage}`);
      this.state.set('error');
    } finally {
      this.stopLoadingAnimation();
    }
  }

  copyToClipboard(text: string): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy:', err));
    }
  }

  private loadGoogleFont(url: string): void {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.href = url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  private startLoadingAnimation(): void {
    const messages = [
      "Analyzing your mission...",
      "Generating logo concepts...",
      "Curating color palette...",
      "Pairing perfect fonts...",
      "Finalizing your brand bible..."
    ];
    let messageIndex = 0;
    this.loadingMessage.set(messages[messageIndex]);
    this.loadingProgress.set(0);

    this.loadingInterval = setInterval(() => {
      this.loadingProgress.update(p => Math.min(p + 5, 100));
      if (this.loadingProgress() >= (messageIndex + 1) * 20 && messageIndex < messages.length - 1) {
        messageIndex++;
        this.loadingMessage.set(messages[messageIndex]);
      }
    }, 500);
  }

  private stopLoadingAnimation(): void {
    clearInterval(this.loadingInterval);
    this.loadingProgress.set(100);
    this.loadingMessage.set("Done!");
  }
}
