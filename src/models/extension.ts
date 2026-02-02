export class Extension {
  url: string;
  valueString: string;

  constructor(url: string, valueString: string) {
    this.url = url;
    this.valueString = valueString;
  }

  public static defaultValues(): Extension {
    return new Extension('http://hl7.eu/fhir/ig/gravitate-health/StructureDefinition/lee-version', 'dev'); // TO-DO: Revise to adapt to the real version
  }
}
