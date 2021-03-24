import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from 'src/app/core/service/Logger';
import { RuntimeConfiguration } from 'src/app/core/configuration/RuntimeConfiguration';
import { InputsformComponent } from './inputsform.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('InputsformComponent', () => {
  let component: InputsformComponent;
  let fixture: ComponentFixture<InputsformComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: RuntimeConfiguration, useValue: {apiUrl:"", logLevel:null} },        
        Logger
      ],
      declarations: [ InputsformComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputsformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
