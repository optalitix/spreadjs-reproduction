import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormComponent } from './form.component';
import { GrapeCityComponent } from '../../components/excelGrid/grapecity/grapecity.component'
import { Logger } from 'src/app/core/service/Logger';
import { NotifyService } from 'src/app/core/service/NotifyService';
import { RuntimeConfiguration } from 'src/app/core/configuration/RuntimeConfiguration';
import { ToasterService } from 'angular2-toaster';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: RuntimeConfiguration, useValue: { apiUrl: "", logLevel: null } },
        ToasterService,
        Logger,
        NotifyService
      ],
      declarations: [FormComponent, GrapeCityComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy('component failed to be created');
    expect(component.excelGrid).toBeTruthy('no grid');
  });
});
