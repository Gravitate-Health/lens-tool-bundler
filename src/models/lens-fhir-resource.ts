import {Contact} from './contact.js';
import {Content} from './content.js';
import {Extension} from './extension.js';
import {Identifier} from './identifier.js';
import {Jurisdiction} from './jurisdiction.js';
import {Meta} from './meta.js';
import {Parameter} from './parameter.js';
import {Telecom} from './telecom.js';
import {Type} from './type.js'; // Add this import statement

export class LensFhirResource {
  contact: Contact[];
  content: Content[];
  copyright: string;
  date: string;
  description: string;
  experimental: boolean;
  extension: Extension[];
  id: string;
  identifier: Identifier[];
  jurisdiction: Jurisdiction[];
  meta: Meta;
  name: string;
  parameter: Parameter[];
  publisher: string;
  purpose: string;
  resourceType: string;
  status: string;
  title: string;
  type: Type;
  url: string;
  usage: string;
  version: string;

  // eslint-disable-next-line max-params
  private constructor(resourceType: string, meta: Meta, extension: Extension[], url: string, identifier: Identifier[], version: string, name: string, title: string, status: string, experimental: boolean, type: Type, publisher: string, contact: Contact[], description: string, jurisdiction: Jurisdiction[], purpose: string, usage: string, copyright: string, parameter: Parameter[], content: Content[]) {
    this.resourceType = resourceType;
    this.id = name.toLowerCase().replaceAll(/\s+/g, '-');
    this.date = new Date().toISOString();
    this.meta = meta;
    this.extension = extension;
    this.url = url;
    this.identifier = identifier;
    this.version = version;
    this.name = name;
    this.title = title;
    this.status = status;
    this.experimental = experimental;
    this.type = type;
    this.publisher = publisher;
    this.contact = contact;
    this.description = description;
    this.jurisdiction = jurisdiction;
    this.purpose = purpose;
    this.usage = usage;
    this.copyright = copyright;
    this.parameter = parameter;
    this.content = content;
  }
  // ...

  static defaultValues(name: string, lens: string): LensFhirResource {
    return new LensFhirResource(
      'Library',
      new Meta(),
      [Extension.defaultValues()],
      'http://hl7.eu/fhir/ig/gravitate-health/Library/mock-lib',
      [new Identifier('http://gravitate-health.lst.tfo.upm.es', name)],
      '0.0.1',
      name,
      name,
      'draft',
      true,
      Type.defaultValues(),
      'Gravitate Health Project - UPM Team',
      [Contact.defaultValues()], // Add the missing Contact parameter
      'Description to be specified',
      [Jurisdiction.defaultValues()],
      'Purpose yo be specified',
      'Usage to be specified',
      '© 2024 Gravitate Health',
      [Parameter.defaultValues()],
      [new Content('application/javascript', lens)],
    );
  }

  static fromPackageJson(packageJson: any, lens: string): LensFhirResource {
    // Extract values from package.json with sensible fallbacks
    const name = packageJson.name || 'unnamed-lens';
    const version = packageJson.version || '0.0.1';
    const description = packageJson.description || 'No description provided';
    const author = packageJson.author || 'Unknown';
    const license = packageJson.license || 'UNLICENSED';

    // Parse author - can be string or object
    let authorName = author;
    let authorContact = Contact.defaultValues();

    if (typeof author === 'object' && author.name) {
      authorName = author.name;
      // Create contact with author information
      const telecom = [];
      if (author.email) {
        telecom.push(new Telecom('email', author.email));
      }

      if (author.url) {
        telecom.push(new Telecom('url', author.url));
      }

      if (telecom.length > 0) {
        authorContact = new Contact(author.name, telecom);
      }
    } else if (typeof author === 'string') {
      authorContact = new Contact(author, []);
    }

    // Extract additional fields
    const purpose = packageJson.purpose || 'Purpose to be specified';
    const usage = packageJson.usage || 'Usage to be specified';
    const copyright = packageJson.copyright || (license ? `Licensed under ${license}` : '© 2026');

    return new LensFhirResource(
      'Library',
      new Meta(),
      [Extension.defaultValues()],
      'http://hl7.eu/fhir/ig/gravitate-health/Library/mock-lib',
      [new Identifier('http://gravitate-health.lst.tfo.upm.es', name)],
      version,
      name,
      name,
      'draft',
      true,
      Type.defaultValues(),
      authorName,
      [authorContact],
      description,
      [Jurisdiction.defaultValues()],
      purpose,
      usage,
      copyright,
      [Parameter.defaultValues()],
      [new Content('application/javascript', lens)],
    );
  }

  // eslint-disable-next-line max-params
  static interactiveValues(name: string, description: string, purpose: string, usage: string, lens: string): LensFhirResource {
    return new LensFhirResource(
      'Library',
      new Meta(),
      [Extension.defaultValues()],
      'http://hl7.eu/fhir/ig/gravitate-health/Library/mock-lib',
      [new Identifier('http://gravitate-health.lst.tfo.upm.es', name)],
      '0.0.1',
      name,
      name,
      'draft',
      true,
      Type.defaultValues(),
      'Gravitate Health Project - UPM Team',
      [Contact.defaultValues()], // Add the missing Contact parameter
      description,
      [Jurisdiction.defaultValues()],
      purpose,
      usage,
      '© 2024 Gravitate Health',
      [Parameter.defaultValues()],
      [new Content('application/javascript', lens)],
    )
  }
}
