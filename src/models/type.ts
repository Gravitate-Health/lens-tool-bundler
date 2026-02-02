import {Coding} from './coding.js';

export class Type {
  coding: Coding[];

  constructor(coding: Coding[]) {
    this.coding = coding;
  }

  public static defaultValues(): Type {
    return new Type([new Coding('logical-library')]);
  }
}
