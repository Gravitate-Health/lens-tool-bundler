export class Telecom {
  system: string;
  value: string;

  constructor(system: string, value: string) {
    this.system = system;
    this.value = value;
  }

  public static defaultValues(): Telecom {
    return new Telecom('url', 'https://www.gravitatehealth.eu/');
  }
}
