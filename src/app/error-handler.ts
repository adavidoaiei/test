import { ErrorHandler, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  errorSignal = signal<string | null>(null);

  handleError(error: any): void {
    console.error('Global Error:', error);
    this.errorSignal.set(error.message || String(error));
  }

  clearError() {
    this.errorSignal.set(null);
  }
}
