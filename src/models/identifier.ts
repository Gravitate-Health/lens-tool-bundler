export class Identifier {
  system: string;
  value: string;

  constructor(system: string, value: string) {
    this.system = system;
    this.value = value;
  }

  public static defaultValues(): Identifier {
    return new Identifier('http://non-existent.com', 'lens'); // TO-DO: Revise to adapt to the real version
  }
}
