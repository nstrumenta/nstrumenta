import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  private units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  transform(bytes: number | string = 0, precision = 2): string {
    // Handle null, undefined, or non-numeric values
    if (bytes == null || bytes === '' || isNaN(parseFloat(String(bytes))) || !isFinite(Number(bytes))) {
      return '---';
    }

    // Convert to number
  let numBytes = Number(bytes);
    let unit = 0;

    while (numBytes >= 1024) {
      numBytes /= 1024;
      unit++;
    }

    return numBytes.toFixed(+precision) + ' ' + this.units[unit];
  }
}
