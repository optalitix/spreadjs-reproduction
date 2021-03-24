import { InputType } from '../selectedCellEvent';
import * as GC from '@grapecity/spread-sheets';
import * as XLSX from 'xlsx';
import { InputCellType } from './InputCellType';

export class InputCellTypeHelper {

    private _iconInput: any;
    private _iconOutput: any;
    private _workbook: GC.Spread.Sheets.Workbook;  

    constructor(iconInput, iconOutput, workbook: GC.Spread.Sheets.Workbook) {

        this._iconInput = iconInput;
        this._iconOutput = iconOutput;
        this._workbook = workbook;
    }

    public setCellType(range: GC.Spread.Sheets.CellRange, direction: InputType): void {

        if (direction == InputType.in || direction == InputType.listIn) {
            range.cellType(new InputCellType(this._iconInput));          
          } else {
            range.cellType(new InputCellType(this._iconOutput));
          }
    }

    public clearCellType(range: GC.Spread.Sheets.CellRange): void {
        range.cellType(new GC.Spread.Sheets.CellTypes.Base());
    }

    public getWorksheet(address: string): GC.Spread.Sheets.Worksheet {
        const idx = address.lastIndexOf("-");
        const sheetname = address.substr(0, (idx)).trim();

        let worksheet: GC.Spread.Sheets.Worksheet = null;
        for (let s = 0; s < this._workbook.sheets.length; s++) {

            if (this._workbook.sheets[s].name() == sheetname) {
                worksheet = this._workbook.sheets[s];
                break;
            }
        }

        return worksheet;
    }

    public getRange(address: string): GC.Spread.Sheets.CellRange {
        const idx = address.lastIndexOf("-");
        const sheetname = address.substr(0, (idx)).trim();
        const rangeName = address.substr(idx + 1).trim();

        let worksheet: GC.Spread.Sheets.Worksheet = null;
        for (let s = 0; s < this._workbook.sheets.length; s++) {

            if (this._workbook.sheets[s].name() == sheetname) {
                worksheet = this._workbook.sheets[s];
                break;
            }
        }

        if (worksheet == null) {
            return null;
        }

        let range: GC.Spread.Sheets.CellRange;
        if (rangeName.indexOf(":") >= 0) {
            const parts = rangeName.split(':');
            var coordinates1: XLSX.CellAddress = XLSX.utils.decode_cell(parts[0]);
            var coordinates2: XLSX.CellAddress = XLSX.utils.decode_cell(parts[1]);

            range = worksheet.getRange(coordinates1.r, coordinates1.c, coordinates2.r - coordinates1.r + 1, coordinates2.c - coordinates1.c + 1);
        } else {
            var coordinates: XLSX.CellAddress = XLSX.utils.decode_cell(rangeName);
            range = worksheet.getCell(coordinates.r, coordinates.c);
        }

        return range;
    }
}
