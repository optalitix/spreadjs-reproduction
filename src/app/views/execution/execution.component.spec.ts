import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExecutionComponent } from './execution.component';
import { Logger } from 'src/app/core/service/Logger';
import { RuntimeConfiguration , EndpointConfig} from 'src/app/core/configuration/RuntimeConfiguration';
import { InputsformComponent } from './inputsform/inputsform.component';

describe('ExecutionComponent', () => {
  let component: ExecutionComponent;
  let fixture: ComponentFixture<ExecutionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: RuntimeConfiguration, useValue: {apiUrl:"", logLevel:null, api : {local: new EndpointConfig(), api : new EndpointConfig() }} },        
        Logger
      ],
      declarations: [ExecutionComponent, InputsformComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy('component failed to be created');   
  });
});
