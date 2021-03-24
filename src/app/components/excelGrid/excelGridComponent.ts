import { EventEmitter } from '@angular/core';
import { ModelDefinition } from '../../core/model/ModelFile';
import { SelectedCellEvent, InputType } from './selectedCellEvent';

export abstract class ExcelGridComponent {
  public loadedData: boolean = false;
  public loadingData: boolean = false;
  private _namex = new RegExp("^[A-Za-z]");

  selectedCell: EventEmitter<SelectedCellEvent>;  
  workbookReady: EventEmitter<boolean>;

  abstract handleFileInput(file: File, previousSchema: ModelDefinition): Promise<void>;
  abstract getFileAsBase64(): string;
  abstract parseSelectedCells(direction: InputType): void;
  abstract selectCells(direction: InputType, cells: Array<any>): void;
  abstract unselectCell(address: string): void;
  abstract refreshCell(address: string): void;
  abstract setValue(address: string, value: any): void;
  abstract getValue(address: string): any;

  isValidName(name: string): boolean {
    return this._namex.test(name);
  }
}