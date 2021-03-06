
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { saveAs } from "file-saver";
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public listFiles(path: string) {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/file-system/list-files?folder=' + encodeURI(path));
  }

  public listFolders(path: string) {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/file-system/list-folders?folder=' + encodeURI(path));
  }

  public getFileContent(path: string) {
    const requestOptions: object = {
      responseType: 'text'
    };
    return this.httpClient.get<string>(
      this.ticketService.getBackendUrl() +
      'api/files?file=' + encodeURI(path),
      requestOptions);
  }

  public downloadFile(path: string) {
    this.httpClient.get(
      this.ticketService.getBackendUrl() +
      'api/files?file=' + encodeURI(path), {
        observe: 'response',
        responseType: 'arraybuffer',
      }).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.substr(disp.indexOf('=') + 1);
        filename = filename.substr(0, filename.indexOf(';'));
        const file = new Blob([res.body], { type: 'application/zip' });
        saveAs(file, filename);
      });
  }

  public uploadFile(path: string, file: any) {
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpClient.put<any>(
      this.ticketService.getBackendUrl() +
      'api/files?folder=' + encodeURI(path),
      formData
    );
  }


  public saveFile(path: string, content: string) {
    const folder = path.substr(0, path.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: 'text/plain'});
    formData.append('file', blob, path.substr(path.lastIndexOf('/') + 1));
    return this.httpClient.put<any>(
      this.ticketService.getBackendUrl() +
      'api/files?folder=' + encodeURI(folder),
      formData
    );
  }

  public deleteFile(path: string) {
    return this.httpClient.delete<string>(
      this.ticketService.getBackendUrl() + 'magic/modules/system/file-system/file?file=' + encodeURI(path)
    );
  }

  public createFolder(path: string) {
    return this.httpClient.put<void>(
      this.ticketService.getBackendUrl() + 'magic/modules/system/file-system/folder', {
        folder: path
      }
    );
  }

  public deleteFolder(path: string) {
    return this.httpClient.delete<void>(
      this.ticketService.getBackendUrl() + 'magic/modules/system/file-system/folder?folder=' + encodeURI(path));
  }
}
