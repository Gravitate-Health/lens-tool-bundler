import {Coding} from './coding.js';

export class Jurisdiction {
  coding: Coding[];

  constructor(coding: Coding[]) {
    this.coding = coding;
  }

  public static defaultValues(): Jurisdiction {
    return new Jurisdiction([new Coding('US', 'urn:iso:std:iso:3166')]);
  }
}
