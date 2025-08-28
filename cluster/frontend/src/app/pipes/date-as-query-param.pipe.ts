import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateAsQueryParam',
    standalone: false
})
export class DateAsQueryParamPipe implements PipeTransform {
  transform(url): unknown {
    return url + '?' + Date.now();
  }
}
