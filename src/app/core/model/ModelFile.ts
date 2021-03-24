import { InputDefinition } from './inputDefinition'

export class ModelFile {
  public id: string;
  public name: string;
  public file: string;
  public revisionDescription: string;
  public version: number;
  public inputs: Array<InputDefinition>;
  public outputs: Array<InputDefinition>;
  public inputLists: Array<InputDefinition>;
  public outputLists: Array<InputDefinition>;
}

export class ModelDefinition {
  public id: string;
  public name: string;
  public version: number;
  public inputs: Array<InputDefinition>;
  public outputs: Array<InputDefinition>;
  public inputLists: Array<InputDefinition>;
  public outputLists: Array<InputDefinition>;
}
