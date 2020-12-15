import { Pipe, PipeTransform } from '@angular/core';
import { pluralize } from './core/common';

@Pipe({
  name: 'pluralize'
})
export class PluralizePipe implements PipeTransform {
  transform(input: string): string {
    return pluralize(input);
  }
}
