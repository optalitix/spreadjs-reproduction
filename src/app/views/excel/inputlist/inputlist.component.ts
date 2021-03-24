import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { InputDefinition } from 'src/app/core/model/inputDefinition'
import { Logger } from 'src/app/core/service/Logger'

@Component({
  selector: 'app-inputlist',
  templateUrl: './inputlist.component.html',
  styleUrls: ['./inputlist.component.scss'],
})
export class InputlistComponent {
  @Input()
  public title: string;
  @Output()
  public deletedCell = new EventEmitter<string>();

  modalRef: NgbModalRef;
  public list = new Array<InputDefinition>();
  public errors: any = {};  
  selectedItem: any = {};
  form = new FormGroup({});
  model = {};
  fields: FormlyFieldConfig[] = []; 

  constructor(private modalService: NgbModal, private _logger: Logger) { } 

  onCellDataUpdate(): void {
    this._logger.debug('on cell update', this.model);

    for (let key in this.model) {
      if (Object.prototype.hasOwnProperty.call(this.model, key)) {
        const update = this.model[key];

        if ('name' in update) {
          update.name = update.name.replace(/\s+/g, '');
        }

        const field = this.list.filter(x => x.address == key)[0];

        if (field.type == 'List' && 'name' in update) {
          const listName = field.name + '/';
          const fields = this.list.filter(x => x.name.startsWith(listName));

          for (let i = 0; i < fields.length; i++) {
            if ('name' in fields[i]) {
              fields[i].name = fields[i].name.replace(listName, update.name + "/");
            }
          }
        }

        Object.assign(field, update);

        this._logger.debug('on cell updated', field);
      }
    }
  }

  open(content, data: InputDefinition): void {

    const defaultFields: Array<any> = [{
      key: data.address + '.name',
      type: 'input',
      name: 'name',
      defaultValue: data.name,
      templateOptions: {
        label: 'Name',
        placeholder: 'Enter name',
        required: true,
      }
    },
    {
      key: data.address + '.title',
      type: 'input',
      name: 'title',
      defaultValue: data.title,
      templateOptions: {
        label: 'Title',
        placeholder: 'Enter title',
        required: true,
      }
    },
    {
      key: data.address + '.required',
      type: 'checkbox',
      name: 'required',
      defaultValue: data.required,
      templateOptions: {
        label: 'Required',
        placeholder: 'Enter title',
        required: true,
      }
    }];

    if (data.type != 'List') {
      defaultFields.push({
        key: data.address + ".type",
        type: 'select',
        name: 'type',
        defaultValue: data.type,
        templateOptions: {
          label: 'Type',
          placeholder: 'Enter type',
          required: true,
          options: [
            { value: 'String', label: 'String' },
            { value: 'Number', label: 'Number' },
            { value: 'Date', label: 'Date' }
          ],
        }
      });
    } else {
      defaultFields.push({
        key: data.address + '.maxItems',
        type: 'input',
        name: 'maxItems',
        defaultValue: data.maxItems,
        templateOptions: {
          label: 'Max Rows',
          placeholder: '-1 for unlimited'
        }
      });
    }

    this.fields = defaultFields;
    this._logger.debug('open', { data: data, fields: this.fields });

    this.selectedItem = data;
    this.modalRef = this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' })
    /*this.modalRef.result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${reason}`;
    });*/
  }

  upsertInput(input: InputDefinition) {  

    const duplicated = this.list.filter(x => x.name == input.name);
    if (duplicated && duplicated.length > 0) {
      this.errors[input.name] = 'Duplicate Name';
    } else {
      delete this.errors[input.name];
    }
    this.list.push(input);
    this.list.sort((x, y) => x.name.localeCompare(y.name));
  }

  public serialize(input: InputDefinition): string {
    return JSON.stringify(input);
  }

  public removeItem(key: InputDefinition) {
    this._logger.debug('remove', key);
    const item = this.list.filter(x => x.name == key.name)[0];
    this.deletedCell.emit(item.address);
    let update: InputDefinition[];
    if (item.type == 'List') {
      update = this.list.filter(x => x.name != key.name && !x.name.startsWith(key + '/'));
    } else {
      update = this.list.filter(x => x.name != key.name);
    }

    update.sort((x, y) => x.name.localeCompare(y.name));
    this.list = update;
  }

  public enrichInputs(inputs: InputDefinition[]): any[] {
    const enriched = [];

    for (let i = 0; i < inputs.length; i++) {
      const index = inputs[i].name.indexOf('/');
      enriched.push({
        data: inputs[i],
        meta: {
          name: index >= 0 ? inputs[i].name.substr(index + 1) : inputs[i].name,
          padding: index >= 0 ? '15px' : '0'
        }
      });
    }
    return enriched;
  }
}
