import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Logger } from 'src/app/core/service/Logger';
import { ModelService } from 'src/app/core/service/ModelService';

@Component({
  selector: 'app-rawform',
  templateUrl: './rawform.component.html',
  styleUrls: ['./rawform.component.scss'],
})
export class RawformComponent {
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
  public model = '{}';

  constructor(private _logger: Logger, private _modelBuilder: ModelService) {}

  public onSubmit(input: any): void {
    this.callingApi = true;
    this._logger.debug('calling model', input);

    this._modelBuilder.callModel(this.modelId, this.modelVersion, input).then(response => {
      this.callingApi = false;
      this.onResponse.emit(response);
    });
  }
}
