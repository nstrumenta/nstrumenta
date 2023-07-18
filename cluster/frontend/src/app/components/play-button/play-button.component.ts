import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-play-button',
  templateUrl: './play-button.component.html',
  styleUrls: ['./play-button.component.scss'],
})
export class PlayButtonComponent {
  @Input() play = false;

  @Input() keyboard = true;

  @Output() playChanged = new EventEmitter<boolean>();

  constructor() {}

  setPlayback(value: boolean) {
    if (this.play !== value) {
      this.togglePlayback();
    }
  }

  togglePlayback(): void {
    this.play = !this.play;
    this.updatePlayback();
  }

  updatePlayback(): void {
    console.log('updatePlayback');
    this.playChanged.emit(this.play);
  }

  @HostListener('document:keyup.space', ['$event'])
  onPlayKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.togglePlayback();
      event.preventDefault();
    }
  }
}
