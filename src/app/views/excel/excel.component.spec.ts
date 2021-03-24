import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExcelComponent } from './excel.component';
import { InputlistComponent } from './inputlist/inputlist.component';
import { GrapeCityComponent } from '../../components/excelGrid/grapecity/grapecity.component'
import { Logger } from '../../core/service/Logger';
import { NotifyService } from '../../core/service/NotifyService';
import { RuntimeConfiguration } from '../../core/configuration/RuntimeConfiguration';
import { ToasterService } from 'angular2-toaster';

describe('ExcelComponent', () => {
  let component: ExcelComponent;
  let fixture: ComponentFixture<ExcelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: RuntimeConfiguration, useValue: { apiUrl: "", logLevel: null } },
        ToasterService,
        Logger,
        NotifyService
      ],
      declarations: [ExcelComponent, InputlistComponent, GrapeCityComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy('component failed to be created');
    expect(component.excelGrid).toBeTruthy('no grid');
    expect(component.inputsListComponent).toBeTruthy('no input list');
    expect(component.outputsListComponent).toBeTruthy('no output list');
  });
});
