export class Coding {
  code: string;
  system?: string;

  constructor(code: string, system?: string) {
    this.code = code;
    this.system = system;
  }
}
