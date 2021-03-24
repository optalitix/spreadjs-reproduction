import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { InputDefinition } from 'src/app/core/model/inputDefinition';
import { Logger } from 'src/app/core/service/Logger';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ModelService } from 'src/app/core/service/ModelService';

@Component({
  selector: 'app-inputsform',
  templateUrl: './inputsform.component.html',
  styleUrls: ['./inputsform.component.scss'],
})
export class InputsformComponent implements OnChanges {
  @Input()
  public title: string;
  @Input()
  public readonly: boolean;
  @Input()
  public modelId: string;
  @Input()
  public modelVersion: number;
  @Output()
  onResponse: EventEmitter<any> = new EventEmitter<any>();

  public callingApi = false;

  model = {};
  fields: FormlyFieldConfig[];
  form = new FormGroup({});

  constructor(private _logger: Logger, private _modelBuilder: ModelService) {
    this.fields = [];
  }

  ngOnChanges(changes: SimpleChanges): void { }

  public onSubmit(input: any): void {
    this.callingApi = true;
    this._logger.debug('calling model', input);

    this._modelBuilder.callModel(this.modelId, this.modelVersion, input).then(response => {
      this.callingApi = false;
      this.onResponse.emit(response);
    });
  }

  public serialize(input: InputDefinition): string {
    return JSON.stringify(input);
  }

  public insertInput(inputs: InputDefinition[], listInputs: InputDefinition[]): void {
    const fields: FormlyFieldConfig[] = [];
    if (inputs != null) {
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        fields.push({
          key: input.name,
          type: 'input',
          name: input.name,
          defaultValue: input.required ? null : input.default,
          templateOptions: {
            label: input.title,
            type: this.getInputType(input.type),
            required: input.required,
            attributes: {
              'data-definition': JSON.stringify(input)
            }
          }
        });
      }
    }

    if (listInputs != null) {
      const listDefs = listInputs.filter(x => x.type == 'List');

      for (let i = 0; i < listDefs.length; i++) {
        var columns = listInputs.filter(x => x.name.startsWith(listDefs[i].name + '/'));
        this._logger.debug('columns', columns);
        const columnsfield: FormlyFieldConfig[] = [];

        for (let c = 0; c < columns.length; c++) {
          const column = columns[c];
          const name: string = column.name.replace(listDefs[i].name + '/', '');
          columnsfield.push({
            key: name,
            type: 'input',
            name: column.name,
            defaultValue: column.required ? null : column.default,
            templateOptions: {
              label: column.title,
              type: this.getInputType(column.type),
              required: column.required,
              attributes: {
                'data-definition': JSON.stringify(column)
              }
            }
          });
        }

        fields.push({
          key: listDefs[i].name,
          type: 'array',
          fieldArray: {
            fieldGroup: columnsfield
          },
          templateOptions: {
            label: listDefs[i].title,
            rows: listDefs[i].maxItems
          }
        });
      }
    }

    this.fields = fields;
    this.onResponse.emit(null);
  }

  private getInputType(type: string): string {
    switch (type) {
      case 'Number': return 'number';
      case 'Date': return 'date';
    }

    return 'text';
  }
}
