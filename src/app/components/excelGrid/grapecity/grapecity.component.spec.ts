import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from '../../../core/service/Logger';
import { RuntimeConfiguration } from '../../../core/configuration/RuntimeConfiguration';
import { GrapeCityComponent } from './grapecity.component';

describe('Test4Component', () => {
  let component: GrapeCityComponent;
  let fixture: ComponentFixture<GrapeCityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RuntimeConfiguration, useValue: {apiUrl:"", logLevel:null} },        
        Logger
      ],
      declarations: [GrapeCityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GrapeCityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
