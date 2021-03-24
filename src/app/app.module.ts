import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SpreadSheetsModule } from '@grapecity/spread-sheets-angular';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToasterModule, ToasterService } from 'angular2-toaster';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { FormlyModule } from '@ngx-formly/core';
import { AngularSplitModule } from 'angular-split';
import { NgxFileDropModule } from 'ngx-file-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArrayTypeComponent } from './components/array.type';
import { RuntimeConfiguration, RuntimeConfigurationFactory } from './core/configuration/RuntimeConfiguration';
import { Logger } from './core/service/Logger';
import { NotifyService } from './core/service/NotifyService';
import { ExcelComponent } from './views/excel/excel.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { GrapeCityComponent } from './components/excelGrid/grapecity/grapecity.component';
import { InputlistComponent } from './views/excel/inputlist/inputlist.component';
import { ExecutionComponent } from './views/execution/execution.component';
import { InputsformComponent } from './views/execution/inputsform/inputsform.component';
import { RawformComponent } from './views/execution/rawform/rawform.component';
import { FormComponent } from './views/form/form.component';

@NgModule({
  declarations: [
    AppComponent,
    InputlistComponent,
    InputsformComponent,
    RawformComponent,
    ExcelComponent,
    ExecutionComponent,
    FormComponent,
    GrapeCityComponent,
    ArrayTypeComponent,
    SpinnerComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    ToasterModule.forRoot(),
    SpreadSheetsModule,
    AppRoutingModule,
    AngularSplitModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    FormlyModule.forRoot({
      types: [{ name: 'array', component: ArrayTypeComponent }],
    }),
    FormlyBootstrapModule,
    NgxFileDropModule
  ],
  providers: [
    { provide: Window, useValue: window },
    RuntimeConfiguration,
    Logger,
    NotifyService,
    {
      provide: APP_INITIALIZER,
      useFactory: RuntimeConfigurationFactory,
      deps: [RuntimeConfiguration, HttpClient],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
