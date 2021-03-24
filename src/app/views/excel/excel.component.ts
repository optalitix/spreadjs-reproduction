import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { InputDefinition } from 'src/app/core/model/inputDefinition';
import { ModelDefinition } from 'src/app/core/model/ModelFile';
import { Logger } from 'src/app/core/service/Logger';
import { NotifyService } from 'src/app/core/service/NotifyService';
import { ModelService } from 'src/app/core/service/ModelService';
import { InvalidModelError } from 'src/app/core/service/ModelErrors';
import { environment } from 'src/environments/environment';
import { ExcelGridComponent } from '../../components/excelGrid/excelGridComponent';
import { InputType, SelectedCellEvent } from '../../components/excelGrid/selectedCellEvent';
import { InputlistComponent } from './inputlist/inputlist.component';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';


@Component({
  templateUrl: './excel.component.html',
  styleUrls: ['./excel.component.scss'],
})
export class ExcelComponent implements OnInit {
  public isDev = !environment.production;
  private _version = 1;
  public previousSchema: ModelDefinition;
  public loadingModel = false;
  public modelName: string;
  public modalRef: NgbModalRef;
  public files: NgxFileDropEntry[] = [];

  @ViewChild('excelGrid')
  public excelGrid: ExcelGridComponent;

  @ViewChild('inputsListComponent')
  public inputsListComponent: InputlistComponent;

  @ViewChild('outputsListComponent')
  public outputsListComponent: InputlistComponent;

  @Input('cellCoordinate')
  public cellCoordinate: string;

  @Input('cellDirection')
  public cellDirection: string;

  public descriptionOk: boolean = false;
  @Input('description')
  public description: string = '';

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _logger: Logger,
    private _modelBuilder: ModelService,
    private _modalService: NgbModal,
    private _notify: NotifyService
  ) { }

  ngOnInit(): void {
    const id = this._activatedRoute.snapshot.params['id'];
    if (id) {
      this._activatedRoute.queryParams.subscribe((params) => {
        if (params.version) {
          this._version = params.version;
        }

        this._modelBuilder.getModel(id, this._version).then((model) => {
          this._version = model.version + 1;
          this.previousSchema = model;
          this.modelName = model.name;

          this._logger.debug('previous schema', this.previousSchema);
        });
      });
    }
  }

  onWorkbookReady(){
    this.cellCoordinate = "A1";
    this.cellDirection = "in";

    this.simulateRightClick();
  }

  onSelectedCell(event: SelectedCellEvent) {
    if (event.type == InputType.in || event.type == InputType.listIn) {
      this._logger.debug('adding input', event.meta);
      this.inputsListComponent.upsertInput(event.meta);
    } else {
      this._logger.debug('adding output', event.meta);
      this.outputsListComponent.upsertInput(event.meta);
    }
  }

  onDescriptionChange(txt) {
    this.description = (txt) ? txt.trim() : null;
    this.descriptionOk = this.description && this.description != '';
  }

  simulateRightClick(): void {
    const getCellCoordinates = (input: string) => {     
      const coordinates = input.match(/^(?<column>[A-Za-z]+)(?<row>\d+)$/).groups;
      
      return { columnName: coordinates.column, row: parseInt(coordinates.row, 10) - 1 };
    }

    const parts = this.cellCoordinate.split(':');
    const cells = [];

    for (const part of parts) {
      const coordinate = getCellCoordinates(part);
      cells.push(coordinate);
    }

    this.excelGrid.selectCells(InputType[this.cellDirection], cells);
  }

  public onCellRemoved(event: string): void {
    this._logger.debug('unselect cell ', event);
    this.excelGrid.unselectCell(event);
  }

  async loadFile(files) {

    if (!this.modelName) {
      const parts = files[0].name.split('.');
      const name = parts.slice(0, parts.length - 1).join(' ');
      this.modelName = name;
    }

    await this.excelGrid.handleFileInput(files, this.previousSchema);
  }

  leave() {
    this.loadingModel = true;
    const source = (this.previousSchema) ? { id: this.previousSchema.id } : null;
    let redirectionUrl = this._modelBuilder.getCancellationRedirection(source);
    this._logger.debug('redirecting to ', redirectionUrl);

    if (redirectionUrl.startsWith('/')) {
      window.location.href = redirectionUrl;
    } else {
      //const version = (this.previousSchema) ? this.previousSchema.version : 1;
      //redirectionUrl = redirectionUrl + '?version=' + version;
      window.location.href = redirectionUrl;
    }
  }

  async uploadModelRequest(modal): Promise<any> {
    if (!this.previousSchema) {
      this.description = 'Initial commit';
      await this.uploadModel();
    } else {
      this.modalRef = this._modalService.open(modal, { ariaLabelledBy: 'modal-basic-title' });
      this.modalRef.result.then(async (result) => {

        if (result == 'Save')
          await this.uploadModel();
      }, async (reason) => {

        if (reason == 'Save')
          await this.uploadModel();
      });
    }
  }

  private async uploadModel(): Promise<any> {
    this.loadingModel = true;

    const inputs: InputDefinition[] = this.inputsListComponent.list.filter((x) => x.address.indexOf(':') == -1);
    const outputs: InputDefinition[] = this.outputsListComponent.list.filter((x) => x.address.indexOf(':') == -1);
    const inputLists: InputDefinition[] = this.inputsListComponent.list.filter((x) => x.address.indexOf(':') > -1);
    const outputLists: InputDefinition[] = this.outputsListComponent.list.filter((x) => x.address.indexOf(':') > -1);

    const file = this.excelGrid.getFileAsBase64();

    try {
      const model: any = await this._modelBuilder.addModel({
        name: this.modelName,
        id: this.previousSchema?.id,
        revisionDescription: this.description,
        version: this._version,
        inputs,
        outputs,
        inputLists,
        outputLists,
        file,
      });

      this._logger.debug('model created', model);
      let redirectionUrl = this._modelBuilder.getRedirection({ id: model.id });
      this._logger.debug('redirecting to ', redirectionUrl);
      if (redirectionUrl.startsWith('/')) {
        this._router.navigate([redirectionUrl], { queryParams: { version: this._version } });
      } else {
        redirectionUrl = redirectionUrl + '?version=' + this._version;
        window.location.href = redirectionUrl;
      }

    } catch (ex) {
      if (ex instanceof InvalidModelError) {
        this._logger.error('InvalidModelError', ex.properties);
        var messages = this.substituteErrorMessages(ex.properties);
        this._notify.error('Unable to upload model', messages);
      } else {
        this._notify.error('Unable to upload model');
      }

      this.loadingModel = false;
    }
  }

  public substituteErrorMessages(inputs: object) : string{
    const messages = [];
    for (var key in inputs) {
      // check if the property/key is defined in the object itself, not in parent
      if (inputs.hasOwnProperty(key)) {
        var text: string = inputs[key];
        switch( inputs[key]){
          case "INVALID_NAME":{text = "Invalid model name. Only alphanumeric characters are allowed.";} break;
          case "NAME_ALREADY_IN_USE":{text = "Model name already in use.";} break;
          case "NO_INPUTS":{text = "No inputs specified";} break;
          case "NO_REVISION":{text = "Please state the reason of the revision change.";} break;
          case "NO_FILE":{text = "No files attached";} break;
        }
        messages.push(text);
      }
    }
    
    return messages.join("\n");
  }

  public dragEnd(unit, event): void {
    window.dispatchEvent(new Event('resize'));
  }

  public dragStart(unit, event): void {
  }

  public fileDropped(files: NgxFileDropEntry[]) {
    this.files = files;

    const supportedFileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (files.length === 1 && files[0].fileEntry.isFile) {
      const fileEntry = files[0].fileEntry as FileSystemFileEntry;

      this._logger.debug("files", fileEntry);
      const filesToRead = [];
      fileEntry.file(async (file: File) => {

        if (file.type && supportedFileTypes.includes(file.type)) {
          const parts = file.name.split('.');
          const name = parts.slice(0, parts.length - 1).join(' ');
          if (!this.modelName) {
            this.modelName = name;
          }
          filesToRead.push(file);
        } else if (!file.type) {
          this._logger.warn("No file type defined", file);
          filesToRead.push(file);
        } else {
          this._logger.warn("Invalid file type", file.type);
        }

        if (filesToRead.length > 0) {
          await this.excelGrid.handleFileInput(filesToRead[0], this.previousSchema);
        } else {
          this._notify.error('Invalid file type');
        }
      });
    } else {
      this._notify.error('Only one file allowed to upload')
    }
  }

  public fileOver(event): void {
    console.log(event);
  }

  public fileLeave(event): void {
    console.log(event);
  }
}
