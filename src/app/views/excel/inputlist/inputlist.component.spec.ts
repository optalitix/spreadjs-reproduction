import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from 'src/app/core/service/Logger';
import { RuntimeConfiguration } from 'src/app/core/configuration/RuntimeConfiguration';
import { InputlistComponent } from './inputlist.component';

describe('InputlistComponent', () => {
  let component: InputlistComponent;
  let fixture: ComponentFixture<InputlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RuntimeConfiguration, useValue: {apiUrl:"", logLevel:null} },        
        Logger
      ],
      declarations: [ InputlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
