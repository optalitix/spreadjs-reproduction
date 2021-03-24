import { Injectable, isDevMode } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

export class Endpoints {
  public local: EndpointConfig;
  public acumen: EndpointConfig;
}
export class EndpointConfig {
  public endpoint: string;
  public upsert: string;
  public list: string;
  public execute: string;
  public redirect: string;
}

@Injectable()
export class RuntimeConfiguration {
  api: Endpoints;
  logLevel: string;
  version: string;
  grapecityLicense: string;
  jwtToken: string;

  constructor(private _httpClient: HttpClient, private _route: ActivatedRoute) { }

  private loadFile(path: string, ignoreFailure: boolean): Promise<any> {
    return new Promise((r, e) => {
      this._httpClient.get(path)
        .subscribe(
          (content: RuntimeConfiguration) => {
            Object.assign(this, content);
            r(this);
          },
          error => { if (!ignoreFailure) e(error); else r(this); });
    })
  }

  async load(): Promise<any> {
    //loading config from file
    let config = await this.loadFile('./assets/runtime.json?t=' + new Date().getTime(), false); //base config
    if (isDevMode()) {
      config = await this.loadFile('./assets/runtime.local.json?t=' + new Date().getTime(), true); //overwriting secrets (api keys, etc...)
    }

    //getting endpoint from caller
    this._route.queryParams.subscribe((params) => {
      
      if (params.source) {
        this.jwtToken = params.source;
        const payload: any = JSON.parse(atob(this.jwtToken.split('.')[1]));
        config.api['acumen'].endpoint = payload.iss;  //issuer will be considered for endpoint          
      }
    });

    return config;
  }
}

export function RuntimeConfigurationFactory(runtimeConfig: RuntimeConfiguration) {
  return () => runtimeConfig.load();
}