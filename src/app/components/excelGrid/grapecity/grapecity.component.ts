import { Component, OnInit, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { SelectedCellEvent, InputType } from '../selectedCellEvent';
import { ExcelGridComponent } from '../excelGridComponent';
import { InputDefinition } from '../../../core/model/inputDefinition';
import { RuntimeConfiguration } from '../../../core/configuration/RuntimeConfiguration';
import * as ExcelIO from '@grapecity/spread-excelio';
import * as XLSX from 'xlsx';
import { Logger } from '../../../core/service/Logger';
import * as GC from '@grapecity/spread-sheets';
import { ModelDefinition } from '../../../core/model/ModelFile';
import { InputCellTypeHelper } from './InputCellTypeHelper';
import '@grapecity/spread-sheets-charts';

@Component({
  selector: 'excel-grapecity',
  templateUrl: './grapecity.component.html',
  styleUrls: ['./grapecity.component.scss'],
})
export class GrapeCityComponent extends ExcelGridComponent implements OnInit {

  private _previousSchema: ModelDefinition;
  private _inputCellTypeHelper: InputCellTypeHelper;
  private _encodedFile: string;

  @Input()
  public readOnly: boolean = true;
  @Output()
  public selectedCell = new EventEmitter<SelectedCellEvent>();
  @Output()
  public workbookReady = new EventEmitter<boolean>();

  @ViewChild('iconIn')
  public iconIn: any;
  @ViewChild('iconOut')
  public iconOut: any;

  public finalData = {};
  public sheets = {};
  public sheetNames = [];
  public activeSheet = '';
  public fileData = null;
  public expandedItem = '';
  public sheetData = [];
  title = 'spreadjs-angular-app';
  hostStyle = {
    width: 'calc(100%)',
    height: '98%',
    overflow: 'hidden',
    float: 'left',
  };

  rowOutlineInfo: any;
  showRowOutline = true;
  private workBook: GC.Spread.Sheets.Workbook;

  constructor(private _logger: Logger, private _runtime: RuntimeConfiguration) {
    super();
    if (this._runtime.grapecityLicense && this._runtime.grapecityLicense != '') {
      this._logger.debug('setting license');
      GC.Spread.Sheets.LicenseKey = (ExcelIO as any).LicenseKey = this._runtime.grapecityLicense;
    }
  }

  ngOnInit(): void { }

  processDataType(workSheet: GC.Spread.Sheets.Worksheet, cell: GC.Spread.Sheets.CellRange, options: Array<object> = null): string {
    const formula = workSheet.getFormula(cell.row, cell.col);
    let value = cell.value();
    if (formula)
      value = GC.Spread.Sheets.CalcEngine.evaluateFormula(workSheet, formula, 0, 0);
    else if (options && options.length > 0)
      value = options[0];

    let format: string = cell.formatter()?.toLowerCase();
    let type = '';
    if (value === '' || (value == null && format == null)) {
      return 'String';
    }
    if (!isNaN(value) && !(value instanceof Date)) {
      type = 'Number';
    } else {
      if (value instanceof Date || (format && format.indexOf('y') > -1 && format.indexOf('m') > -1 && format.indexOf('d') > -1)) {
        type = 'Date';
      } else if (new RegExp(/(\d+[%])/, 'gm').test(value)) {
        type = 'Number';
      } else {
        type = 'String';
      }
    }
    return type;
  }

  async handleFileInput(file: File, previousSchema: ModelDefinition) {
    const context = this;
    context._logger.debug('file', file);


    var fileTask = new Promise<string>(resolve => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function () {
        var base64data = reader.result as string;

        context._logger.debug('file64 converted');
        resolve(base64data);
      }
    });


    this.loadingData = true;
    this._previousSchema = previousSchema;

    while (!this.workBook) { //waiting for initSpread to occur
      await this.delay(100);
    }

    this._inputCellTypeHelper = new InputCellTypeHelper(this.iconIn, this.iconOut, this.workBook);


    this.workBook.suspendCalcService();
    this.workBook.suspendEvent();
    this.workBook.suspendPaint();
    this.workBook.options.calcOnDemand = true;
    const io = new ExcelIO.IO();
    io.open(file, async (json) => {
      this._logger.debug('Loading json', json);

      var filePromise = new Promise<void>(() => {
        this.workBook.fromJSON(json);

        this.loadedData = true;
        this._logger.debug('file loaded');


        this.workBook.contextMenu.menuData = [];
        // clear menu items
        if (this.readOnly) {
          this._logger.debug('configuring context menu.');

          // add new menu item
          this.workBook.contextMenu.menuData.push({
            text: 'Select as an Input',
            name: 'selectinput',
            command: () => {
              this.parseSelectedCells(InputType.in);
            },
            workArea: 'viewport', // rowHeader
          });

          this.workBook.contextMenu.menuData.push({
            text: 'Select as an Output',
            name: 'selectoutput',
            command: () => {
              this.parseSelectedCells(InputType.out);
            },
            workArea: 'viewport', // rowHeader
          });
          this.workBook.contextMenu.menuData.push({
            text: 'Select as Input Table',
            name: 'selectinputList',
            command: () => {
              this.parseSelectedCells(InputType.listIn);
            },
            workArea: 'viewport', // rowHeader
          });
          this.workBook.contextMenu.menuData.push({
            text: 'Select as Output Table',
            name: 'selectoutputList',
            command: () => {
              this.parseSelectedCells(InputType.listOut);
            },
            workArea: 'viewport', // rowHeader
          });
        }
        this._logger.debug('context menu configured.');

        if (this.readOnly) {
          this._logger.debug('readonly mode.');

          this.workBook.options.newTabVisible = false;
          this.workBook.options.tabEditable = false;
        }

        for (let i = 0; i < this.workBook.sheets.length; i++) {
          const spreadSheet = this.workBook.sheets[i];         
          if (this.readOnly) {
            spreadSheet.options.isProtected = true;
            //spreadSheet.charts.clear();//bug with the charts so we clear them at the moment     
          } else {
            spreadSheet.charts.preserveUnsupportedChart(true);
          }
        }

        if (this._previousSchema) {
          this.loadPreviousSchema();
        }

        if (!this.readOnly)
          this.workBook.resumeCalcService();
        this.workBook.resumeEvent();
        this.workBook.resumePaint();
        this.workbookReady.emit(true);
      });

      this._encodedFile = await fileTask;
      context._logger.debug('file64', this._encodedFile ? this._encodedFile.substr(0, 25) + '...' : null);
      await filePromise;

    }, (error) => {
      this._logger.error('Unable to load file', error)
    });
  }

  parseSelectedCells(direction: InputType) {
    // const workBook = this.workBook;
    const t: GC.Spread.Sheets.Range[] = this.workBook
      .getActiveSheet()
      .getSelections();

    const range = t[t.length - 1];
    switch (direction) {
      case InputType.in:
      case InputType.out:
        {
          this.parseInput(direction, range);
        }
        break;
      case InputType.listIn:
      case InputType.listOut:
        {
          this.parseListInput(direction, range);
        }
        break;
      default:
        throw new Error('Unhandled value --> ' + direction);
    }
  }

  parseInput(direction: InputType, range: GC.Spread.Sheets.Range) {
    const workBook = this.workBook;
    const workSheet = workBook.getActiveSheet();

    for (let r = range.row; r < range.row + range.rowCount; r++) {
      const rowIndex = r;
      for (let c = range.col; c < range.col + range.colCount; c++) {
        const columnIndex = c;

        const address = this.getCellName(workSheet, columnIndex, rowIndex);
        const cell = workSheet.getCell(rowIndex, columnIndex);

        if (this.readOnly)
          this._inputCellTypeHelper.setCellType(cell, direction);

        const name = this.getDisplayName(workSheet, columnIndex, rowIndex);
        const formula = workSheet.getFormula(rowIndex, columnIndex);
        let value = cell.value();
        if (formula)
          value = GC.Spread.Sheets.CalcEngine.evaluateFormula(workSheet, formula, 0, 0);


        const options = this.getOptions(workSheet, cell);
        const type = this.processDataType(workSheet, cell, options);
        const event: SelectedCellEvent = {
          type: direction,
          meta: {
            address,
            name: name.replace(/\s+/g, ''),
            title: name,
            type,
            default: this.parseValue(value, type),
            required: false,
            format: null,
            originalType: type,
            options: options
          },
        };

        this.selectedCell.emit(event);
      }
    }
  }

  getOptions(workSheet: GC.Spread.Sheets.Worksheet, cell: GC.Spread.Sheets.CellRange): Array<any> {

    var validator = workSheet.getDataValidator(cell.row, cell.col, GC.Spread.Sheets.SheetArea.viewport);
    if (validator) {
      const validList = validator.getValidList(workSheet, 1, 1);
      return validList;
    }

    return null;
  }

  unselectCell(address: string): void {
    this._logger.debug('rmv icon from cell ', address);
    const cell = this._inputCellTypeHelper.getRange(address);
    if (cell) {
      this._inputCellTypeHelper.clearCellType(cell);
    }
  }

  parseListInput(direction: InputType, range: GC.Spread.Sheets.Range) {
    const workBook = this.workBook;
    const workSheet = workBook.getActiveSheet();
    const rowIndex = range.row;

    const listAddress = this.getCellName(workSheet, range.col, rowIndex);
    let listName = listAddress;
    const tmpCell = workSheet.getCell(rowIndex - 2, range.col);
    if (tmpCell) {
      let tmpName = tmpCell.value();
      if (tmpName) {
        tmpName = tmpName.toString();
        if (this.isValidName(tmpName)) {
          listName = tmpName;
        }
      }
    }

    const listDefinition: InputDefinition = {
      address: listAddress + ':' + XLSX.utils.encode_col(range.col + range.colCount - 1) + (rowIndex + range.rowCount),
      name: listName.replace(/\s+/g, ''),
      default: null,
      format: null,
      required: false,
      title: listName,
      type: 'List',
      maxItems: range.rowCount,
      originalType: 'List',
      options: null
    };

    const listEvent = new SelectedCellEvent();
    listEvent.type = direction;
    listEvent.meta = listDefinition;
    this.selectedCell.emit(listEvent);

    for (let c = range.col; c < range.col + range.colCount; c++) {
      const address = this.getCellName(workSheet, c, rowIndex);
      const formula = workSheet.getFormula(rowIndex, c);
      if (formula && direction == InputType.listIn) {
        this._logger.debug('Not selecting formula(' + address + ')', formula);
        continue;
      }

      const cellName = workSheet.getCell(rowIndex - 1, c);
      const cellValue = workSheet.getCell(rowIndex, c);

      let name: string = cellName.text();
      name = (!name) ? '' : name.trim();
      if (name == '') {
        name = address;
      }
      let value = cellValue.value();
      if (formula)
        value = GC.Spread.Sheets.CalcEngine.evaluateFormula(workSheet, formula, 0, 0);
      const type: string = this.processDataType(workSheet, cellValue);

      const event = {
        type: direction,
        meta: {
          address: address + ':' + XLSX.utils.encode_col(c) + (rowIndex + range.rowCount),
          name: (listName + '/' + name).replace(/\s+/g, ''),
          title: name,
          default: this.parseValue(value, type),
          type,
          required: false,
          format: null,
          maxItems: null,
          originalType: type,
          options: null
        },
      };

      this.selectedCell.emit(event);
    }

    const listRange = this._inputCellTypeHelper.getRange(listDefinition.address);
    if (this.readOnly)
      this._inputCellTypeHelper.setCellType(listRange, direction);
  }

  getDisplayName(
    worksheet: GC.Spread.Sheets.Worksheet,
    column: number,
    row: number
  ): string {
    const cell = worksheet.getCell(row, column - 1);
    if (cell) {
      const text = cell.value();
      if (typeof text === 'string' && this.isValidName(text)) {
        return text;
      }
    }

    return this.getCellName(worksheet, column, row);
  }

  getCellName(worksheet: GC.Spread.Sheets.Worksheet, column: number, row: number) {
    const sheetName = (worksheet.toJSON() as any).name;
    const columnName = XLSX.utils.encode_col(column);

    return sheetName + ' - ' + columnName + [row + 1];
  }

  parseValue(value: any, type: string) {
    this._logger.debug(type);

    switch (type) {
      case 'Percent':
      case 'Number': {
        return parseFloat(value);
      }
      case 'String': {
        if (value == '') {
          return null;
        }
        return value;
      }
      case 'Date': {
        return value;
      }
      default:
        throw new Error("Unsupported type '" + type + "'");
    }
  }

  selectCells(direction: InputType, array: Array<any>) {
    const worksheet = this.workBook.getActiveSheet();
    const address1: XLSX.CellAddress = XLSX.utils.decode_cell(array[0].columnName + (array[0].row + 1));
    let address2: XLSX.CellAddress;
    if (array.length > 1) {
      address2 = XLSX.utils.decode_cell(array[1].columnName + (array[1].row + 1));
    } else {
      address2 = address1;
    }

    worksheet.setActiveCell(address1.r, address1.c);
    worksheet.addSelection(
      address1.r,
      address1.c,
      address2.r - address1.r + 1,
      address2.c - address1.c + 1
    );

    this.parseSelectedCells(direction);
  }

  getFileAsBase64(): string {

    return this._encodedFile;
  }

  private overwriteInput(input: InputDefinition, direction: InputType): InputDefinition {
    this._logger.debug('input name :', input);

    const cell = this._inputCellTypeHelper.getRange(input.address);
    if (!cell) {
      return null;
    }
    if (this.readOnly)
      this._inputCellTypeHelper.setCellType(cell, direction);
    const type = input.type == 'List' ? 'List' : this.processDataType(this._inputCellTypeHelper.getWorksheet(input.address), cell);
    const value = input.type == 'List' ? null : this.parseValue(cell.value(), type);

    Object.assign(input, { default: value, type, });

    return input;
  }

  private loadInput(inputs: InputDefinition[], direction: InputType): void {
    if (inputs) {
      for (let i = 0; i < inputs.length; i++) {
        const input = this.overwriteInput(inputs[i], direction);
        if (!input) {
          continue;
        }

        const event = { type: direction, meta: input };
        this.selectedCell.emit(event);
      }
    }
  }

  public loadPreviousSchema(): void {
    const schema = this._previousSchema;

    this.loadInput(schema.inputs, InputType.in);
    this.loadInput(schema.outputs, InputType.out);
    this.loadInput(schema.inputLists, InputType.listIn);
    this.loadInput(schema.outputLists, InputType.listOut);
  }

  public initSpread($event: any): void {
    this.workBook = $event.spread;
  }

  public refreshCell(address: string): void {
    const workSheet = this._inputCellTypeHelper.getWorksheet(address);
    const cell = this._inputCellTypeHelper.getRange(address);
    const formula = workSheet.getFormula(cell.row, cell.col);
    let value = cell.value();
    if (formula)
      value = GC.Spread.Sheets.CalcEngine.evaluateFormula(workSheet, formula, 0, 0);
    cell.value(value);
  }

  public setValue(address: string, value: any): void {
    const cell = this._inputCellTypeHelper.getRange(address);
    cell.value(value);
  }

  public getValue(address: string): any {

    if (address.indexOf(':') >= 0) {
      const cell = this._inputCellTypeHelper.getRange(address);
      const array = cell.sheet.getArray(cell.row, cell.col, cell.rowCount, cell.colCount);

      return array;

    } else {
      const cell = this._inputCellTypeHelper.getRange(address);
      return cell.value();
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
