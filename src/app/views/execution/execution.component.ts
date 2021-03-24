import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ModelService } from 'src/app/core/service/ModelService';

import { environment } from 'src/environments/environment';
import { Logger } from 'src/app/core/service/Logger';
import { InputsformComponent } from './inputsform/inputsform.component';

@Component({
  templateUrl: './execution.component.html',
  styleUrls: ['./execution.component.scss']
})
export class ExecutionComponent implements OnInit {

  public isDev = !environment.production;
  public modelId: string;
  public modelVersion: number;
  public response: any;
  public isRaw = false;

  @ViewChild('inputsListComponent')
  public inputsListComponent: InputsformComponent;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _logger: Logger, private _modelBuilder: ModelService) {
  }

  ngOnInit() {
    this.modelId = this._activatedRoute.snapshot.params['id'];
    this._activatedRoute.queryParams.subscribe(params => {
      if (params.version) {
        this.modelVersion = params.version;
      } else {
        this.modelVersion = 1;
      }
      this._modelBuilder.getModel(this.modelId, this.modelVersion).then(data => {
        this._logger.debug('model loaded', data);
        this.inputsListComponent.insertInput(data.inputs, data.inputLists);
      });
    });
  }

  public onResponse(response: any) {
    this._logger.debug('onreponse', response);
    if (response) {
      this.response = JSON.stringify(response);
    } else {
      this.response = '';
    }
  }

  public gotoNewVersion() {
    this._router.navigate([this.modelId], { queryParams: { version: this.modelVersion } });
  }
}
