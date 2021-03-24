import { InputDefinition } from 'src/app/core/model/inputDefinition'

export enum InputType {
  in,
  out,
  listIn,
  listOut
}
export class SelectedCellEvent {
  public type: InputType;
  public meta: InputDefinition;
}
