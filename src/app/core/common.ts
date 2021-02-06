import { ParamMap } from "@angular/router";
import * as _ from "underscore";

export function indexOf(array, findObject) {
  for(let i = 0; i < array.length; i++) {
    let obj = array[i];
    if(_.isEqual(obj, findObject)) {
      return i;
    }
  }
  return -1;
}

export function pluralize(input: string): string {
    if(input == null || input == '') {
      return '';
    }
    if(input.endsWith('e')) {
      return input + 's';
    }
    for(let vowel of ['a', 'i', 'o', 'u', 's']) {
      if(input.endsWith(vowel)) {
        return input + 'es';
      }
    }
    if(input.toLowerCase() == 'person') {
      return 'people';
    }
    return input + 's';
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}