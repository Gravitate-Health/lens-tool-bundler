import {Telecom} from './telecom.js';

export class Contact {
  name: string;
  telecom: Telecom[];

  constructor(name: string, telecom: Telecom[]) {
    this.name = name;
    this.telecom = telecom;
  }

  public static defaultValues(): Contact {
    return new Contact('Gravitate Health', [Telecom.defaultValues()]);
  }
}
