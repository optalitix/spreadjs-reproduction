export class InputDefinition {
  public address: string;
  public name: string;
  public title: string;
  public type: string;
  public default: any; 
  public format: string;
  public required: boolean;
  public maxItems?:number;
  public originalType: string;
  public options: Array<any>;
}
