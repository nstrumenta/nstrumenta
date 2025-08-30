import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateAsQueryParam' })
export class DateAsQueryParamPipe implements PipeTransform {
  transform(url): unknown {
    return url + '?' + Date.now();
  }
}
