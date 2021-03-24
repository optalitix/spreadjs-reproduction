import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Logger } from 'src/app/core/service/Logger';
import { RuntimeConfiguration } from 'src/app/core/configuration/RuntimeConfiguration';
import { RawformComponent } from './rawform.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('RawformComponent', () => {
  let component: RawformComponent;
  let fixture: ComponentFixture<RawformComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: RuntimeConfiguration, useValue: {apiUrl:"", logLevel:null} },        
        Logger
      ],
      declarations: [ RawformComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RawformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
