import { Pipe, PipeTransform } from '@angular/core';
import { capitalize } from './core/common';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
  transform(input: string): string {
    return capitalize(input);
  }
}
