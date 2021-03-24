import { ExcelGridComponent } from 'src/app/components/excelGrid/excelGridComponent';
import { ModelDefinition } from 'src/app/core/model/ModelFile';
import { InputDefinition } from 'src/app/core/model/InputDefinition';
import { Logger } from 'src/app/core/service/Logger';

export class DataLoader {

    private _excelGrid: ExcelGridComponent;
    private _logger: Logger;

    constructor(excelGrid: ExcelGridComponent, logger: Logger) {

        this._excelGrid = excelGrid;
        this._logger = logger;
    }

    public readSessionData(schema: ModelDefinition): object {
        const obj = { inputs: {}, outputs: {} };
        if (schema) {
            if (schema.inputs) {
                var inputs = this.readInputs(schema.inputs);
                Object.assign(obj.inputs, inputs);
            }
            if (schema.inputLists) {
                var inputs = this.readListInputs(schema.inputLists);
                Object.assign(obj.inputs, inputs);
            }
            if (schema.outputs) {
                var inputs = this.readInputs(schema.outputs);
                Object.assign(obj.outputs, inputs);
            }
            if (schema.outputLists) {
                var inputs = this.readListInputs(schema.outputLists);
                Object.assign(obj.outputs, inputs);
            }
        }

        return obj;
    }

    public loadSessionData(model: ModelDefinition, data: object) {
        if (data) {
            if (model.inputs && data['inputs']) {
                this.loadInputs(model.inputs, data['inputs']);
            }
            if (model.inputLists && data['inputs']) {
                this.loadListInputs(model.inputLists, data['inputs']);
            }
            if (model.outputs && data['outputs']) {
                this.loadInputs(model.outputs, data['outputs']);
            }
            if (model.outputs && data['outputs']) {
                this.loadListInputs(model.outputLists, data['outputs']);
            }
        }
    }

    private readInputs(inputs: Array<InputDefinition>): object {
        var obj = {};
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const value = this._excelGrid.getValue(input.address);
            obj[input.name] = value;
        }
        return obj;
    }

    private readListInputs(inputs: Array<InputDefinition>): object {
        var obj = {};

        for (let i = 0; i < inputs.length; i++) {
            const list = inputs[i];
            if (list.type != 'List') {
                continue;
            }

            var columns = inputs.filter(x => x.type != 'List' && x.name.startsWith(list.name + '/'));
            var rows = [];

            let maxLength = 0;
            const holder = {};
            for (let col = 0; col < columns.length; col++) {
                const column = columns[col];
                const values = this._excelGrid.getValue(column.address);
                if (values.length > maxLength) {
                    maxLength = values.length;
                }
                holder[column.name] = values;
            }

            for (let row = 0; row < maxLength; row++) {
                const rowItem = {};

                for (let col = 0; col < columns.length; col++) {
                    const column = columns[col];
                    const fieldName = column.name.split('/')[1];
                    
                    var x = holder[column.name][row];
                    if(x && x.length){
                        rowItem[fieldName]= x[0];
                    }
                }

                rows.push(rowItem);
            }

            obj[list.name] = rows;
        }

        return obj;
    }

    private loadInputs(inputs: Array<InputDefinition>, data: object) {
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].name in data) {
                const input = inputs[i];
                const value = data[input.name];

                this._logger.debug('overwritting', { input, value });
                this._excelGrid.setValue(input.address, value);
            }
        }
    }

    private loadListInputs(inputs: Array<InputDefinition>, data: object) {
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].name in data) {
                const list = inputs[i];
                if (list.type != 'List') {
                    continue;
                }

                var columns = inputs.filter(x => x.type != 'List' && x.name.startsWith(list.name + '/'));

                for (let col = 0; col < columns.length; col++) {

                    const metadata = this.getColumnMetadata(columns[col]);
                    for (let row = metadata.min; row <= metadata.max; row++) {
                        const index = row - metadata.min;
                        let value = null;

                        if (data[list.name] && index < data[list.name].length) {
                            value = data[inputs[i].name][index][metadata.field];
                        }

                        const address = `${metadata.sheetName} - ${metadata.columnName}${row}`;
                        this._logger.debug('overwritting', { address, value });
                        this._excelGrid.setValue(address, value);
                    }
                }
            }
        }
    }

    private getColumnMetadata(column: InputDefinition) {

        let splitIndex = column.address.indexOf('-');// <TABLE_NAME> - <COLUMN><MIN_ROW>:<COLUMN><MAX_ROW>
        const sheetName = column.address.substr(0, splitIndex - 1);
        const rangeName = column.address.substr(splitIndex + 1);
        splitIndex = rangeName.indexOf(':');
        const minRange = rangeName.substr(1, splitIndex - 1);
        const maxRange = rangeName.substr(splitIndex + 1);
        const parts = minRange.match(/([A-z]+)(\d+)/);
        const columnName = parts[1];
        const min = parseInt(parts[2]);
        const max = parseInt(maxRange.split(/([A-z]+)(\d+)/)[2]);
        const field = column.name.split('/')[1];// <TABLE_NAME>/<COLUMN_NAME>

        return { sheetName, columnName, field, min, max };
    }
}