import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { ModelDefinition } from 'src/app/core/model/ModelFile';
import { Logger } from 'src/app/core/service/Logger';
import { NotifyService } from 'src/app/core/service/NotifyService';
import { ModelService } from 'src/app/core/service/ModelService';
import { environment } from 'src/environments/environment';
import { ExcelGridComponent } from '../../components/excelGrid/excelGridComponent';
import { DataLoader } from './helpers/DataLoader';


@Component({
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  public isDev = !environment.production;
  private _version = 1;
  private _redirection: string;
  public previousSchema: ModelDefinition;
  public runningModel: boolean;

  @ViewChild('excelGrid')
  public excelGrid: ExcelGridComponent;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _logger: Logger,
    private _modelBuilder: ModelService,
    private _notify: NotifyService
  ) { }

  ngOnInit(): void {
    const id = this._activatedRoute.snapshot.params['id'];

    this._activatedRoute.queryParams.subscribe((params) => {
      if (params.version) {
        this._version = params.version;
      }

      this._modelBuilder.getModel(id, this._version).then((model) => {
        this._version = model.version;
        this.previousSchema = model;

        this._modelBuilder.getFile(id, this._version).then(blob => {
          this.excelGrid.handleFileInput(new File([blob], 'tmp.xlsx', { type: blob.type }), this.previousSchema);
        });
      });
    });
  }

  onWorkbookReady() {
    this._logger.debug('workbook ready');
    const session = this._activatedRoute.snapshot.params['session'];

    this._modelBuilder.getSession(session).then((data) => {
      this._redirection = data['returnUrl'];
      this.loadSessionData(data);
    });
  }

  loadSessionData(data: object) {
    var loader = new DataLoader(this.excelGrid, this._logger);
    loader.loadSessionData(this.previousSchema, data);
  }
  
  saveSession(){
    const session = this._activatedRoute.snapshot.params['session'];
    var loader = new DataLoader(this.excelGrid, this._logger);
    const content = loader.readSessionData(this.previousSchema); 

    this._logger.debug('calling requestLog',{id:this.previousSchema.id, version:this._version});
    //to add header to get id
    this._modelBuilder.addRequesLog(this.previousSchema.id, this._version, content['inputs']).then((requestLogId) => {

      this._modelBuilder.updateSession(session, content).then((response) => {
        if(response['callbackUrl']){
          this._logger.debug('redirecting to', response['callbackUrl']);
          window.location.href = response['callbackUrl'];
        }else {
          const redirectionUrl = this._modelBuilder.getRequestLogRedirection({id : requestLogId});

          this._logger.debug('redirecting to', redirectionUrl);
         window.location.href = redirectionUrl;
        }
      });
    });
  }

  leave() {
    const source = { id: this.previousSchema.id };
    if (this._redirection) { //if return url set we use it
      window.location.href = this._redirection;
    } else {
      let redirectionUrl = this._modelBuilder.getRedirection(source);
      this._logger.debug('redirecting to ', redirectionUrl);

      if (redirectionUrl.startsWith('/')) {
        window.location.href = redirectionUrl;
      } else {
        const version = (this.previousSchema) ? this.previousSchema.version : 1;
        redirectionUrl = redirectionUrl + '?version=' + version;
        window.location.href = redirectionUrl;
      }
    }
  }

  public substituteErrorMessages(inputs: object): string {
    const messages = [];
    for (var key in inputs) {
      // check if the property/key is defined in the object itself, not in parent
      if (inputs.hasOwnProperty(key)) {
        var text: string = inputs[key];
        switch (inputs[key]) {
          case "INVALID_NAME": { text = "Invalid model name. Only alphanumeric characters are allowed."; } break;
          case "NAME_ALREADY_IN_USE": { text = "Model name already in use."; } break;
          case "NO_INPUTS": { text = "No inputs specified"; } break;
          case "NO_REVISION": { text = "Please state the reason of the revision change."; } break;
          case "NO_FILE": { text = "No files attached"; } break;
        }
        messages.push(text);
      }
    }

    return messages.join("\n");
  }

}
