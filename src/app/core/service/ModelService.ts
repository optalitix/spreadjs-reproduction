import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '../../core/service/Logger';
import { ModelFile, ModelDefinition } from '../model/ModelFile'
import { RuntimeConfiguration } from '../configuration/RuntimeConfiguration';
import { InvalidModelError, UnexpectedModelError } from './ModelErrors';

@Injectable({ providedIn: 'root' })
export class ModelService {

  private _client: string;
  private _auth: string;

  constructor(private _httpClient: HttpClient, private _logger: Logger, private _runtime: RuntimeConfiguration) {
    this._logger.debug('config', _runtime);
    if (_runtime.jwtToken) {
      this._client = 'acumen';// if jwt token set we assume acumen is calling
      this._auth = _runtime.jwtToken;
    } else {
      this._client = 'local';
      this._auth = null;
    }
  }

  /**
   * Adds the workbook model to the remote api.
   * @param {ModelFile} definition - Worbook schema + file.
   * @returns schema of the newly created model.
   */
  public async addModel(definition: ModelFile): Promise<ModelDefinition> {
    const headers = this.getHeader({ 'Content-Type': 'application/json' });
    const url = this.getUrl('upsert', false);
    this._logger.debug('uploading file', {url, definition});
    const call = this._httpClient
      .post<any>(url, definition, { headers: headers })
      .toPromise()
      ;
    return await call.then(data => {
      this._logger.debug('response', data);
      return data as ModelDefinition;
    }, error => {
      this._logger.error(error);

      if (error.status >= 400 && error.status < 500 && error.error) {
        throw new InvalidModelError("Invalid model", error.error);
      }

      throw new UnexpectedModelError(error);
    });
  }

  /**
   * Adds the workbook model to the remote api.
   * @param {ModelFile} definition - Worbook schema + file.
   * @returns schema of the newly created model.
   */
  public async addRequesLog(id: string, version: number, data: object): Promise<string> {
    return new Promise((resolve, reject) => {

      const headers = this.getHeader({ 'Content-Type': 'application/json', 'Debug-Mode': 'Id' });
      let url = this.getUrl('requestLog', false, {id});
      url += '?version=' + version;
   
      this._httpClient.post<any>(url, data, { headers: headers,  observe: "response" as 'body' }).subscribe(
        response => {
          console.log(response);
          var id = response.headers.get('Request-Id');
          resolve(id);
        }, error => {
          this._logger.error(error);
          reject(error);
        }
      );
    });

  }

  /**
   * Gets the model schema from the remote api
   * @param {string} id - Model unique identifer.
   * @param {number} version - Model version.
   */
  public async getModel(id: string, version: number): Promise<ModelDefinition> {
    const headers = this.getHeader({ 'Content-Type': 'application/json' });
    const url = this.getUrl('list', false, { id: id });
    const call = this._httpClient
      .get<any>(url + '?version=' + version, { headers: headers })
      .toPromise()
      ;
    return await call.then(data => {
      this._logger.debug('response', data);
      return data as ModelDefinition;
    });
  }

  /**
 * Gets the session data from the remote api
 * @param {string} session - Session unique identifer.
 */
  public async getSession(session: string): Promise<object> {
    const headers = this.getHeader(null);
    const url = this.getUrl('session', false, { id: session });
    const call = this._httpClient
      .get<any>(url, { headers: headers })
      .toPromise()
      ;
    return await call.then(data => {
      this._logger.debug('response', data);
      return data;
    });
  }

  /**
* Gets the session data from the remote api
* @param {string} id - Session unique identifer.
* @param {object} data - Session data.
*/
  public async updateSession(session: string, data: object): Promise<object> {
    const headers = this.getHeader(null);
    const url = this.getUrl('session', false, { id: session });
    const call = this._httpClient
      .put<any>(url, data, { headers: headers })
      .toPromise()
      ;
    return await call.then(data => {
      this._logger.debug('response', data);
      return data;
    });
  }

  public async getFile(id: string, version: number): Promise<any> {
    const headers = this.getHeader({});
    const url = this.getUrl('file', false, { id: id });
    const call = this._httpClient
      .get<any>(url + '?version=' + version, { headers: headers, responseType: 'blob' as 'json' })
      .toPromise()
      ;
    return await call.then(data => {
      return data;
    });
  }

  /**
   * Runs the model.
   * @param {string} id - Model unique identifer.
   * @param {number} version - Model version.
   * @param {any} json - Model's inputs.
   * @returns {any} Execution result.
   */
  public async callModel(id: string, version: number, json: any): Promise<any> {
    const headers = this.getHeader({ 'Content-Type': 'application/json' });
    const url = this.getUrl('execute', false, { id: id });
    const call = this._httpClient
      .post<any>(url + '?version=' + version, json, { headers: headers })
      .toPromise()
      ;
    return await call.then(data => {
      this._logger.debug('response', data);

      return data;
    }, error => {
      if (error.status >= 400 && error.status < 500 && error.error) {
        error = error.error;
      }
      this._logger.debug('response error', error);
      return error;
    });
  }

  /**
   * Gets the redirection url to use after a model was created.
   * @param {} source - Model's unique identifier.
   * @returns {string} redirection url.
   */
  public getRedirection(source: any): string {
    if (this._client == 'acumen')
      return this.getUrl('redirect', false, source);

    let path = this.getUrl('redirect', true, source);
    if (!path.startsWith('/'))
      path = '/' + path;
    return path;
  }

  getRequestLogRedirection(source: any) {
    return this.getUrl('requestLogDetail', false, source);
  }

  /**
 * Gets the redirection url to use after a model was created.
 * @param {} source - Model's unique identifier.
 * @returns {string} redirection url.
 */
  public getCancellationRedirection(source: any): string {
    if (this._client == 'acumen')
      return this.getUrl('cancel', false, source);

    let path = this.getUrl(source ? 'redirect' : 'cancel', true, source);
    if (!path.startsWith('/'))
      path = '/' + path;
    return path;
  }

  private getHeader(parameters: any): any {

    const headers = (this._auth) ? { 'Authorization': 'Bearer ' + this._auth } : {};
    if (!parameters) {
      return headers;
    }
    //copying additional headers from parameters
    return Object.assign(headers, parameters);
  }

  private getUrl(area: string, pathOnly: boolean, source?: any): string {
    const endpoint: string = this._runtime.api[this._client].endpoint;
    let path = this._runtime.api[this._client][area];
    if (!path)
      throw 'Missing url from configuration (' + this._client + ') : ' + path;

    const found = path.matchAll(/\{(\w+)\}/g); //replacing substitution tokens by source value (or empty if not found)
    for (const match of found) {
      let value = '';
      if (source) {
        value = source[match[1]];
        if (value == undefined)
          value = '';
      }
      path = path.replace(match[0], value);
    }
    if (pathOnly)
      return path;

    return this.combine(endpoint, path);
  }

  private combine(path: string, path2: string): string {
    path = (path) ? path.trim() : '';
    path2 = (path2) ? path2.trim() : '';

    if (path.endsWith('/')) {
      if (path2.startsWith('/')) {
        return path + path2.substr(1);
      } else {
        return path + path2;
      }
    } else {
      if (path2.startsWith('/')) {
        return path + path2;
      } else {
        return path + '/' + path2;
      }
    }
  }
}