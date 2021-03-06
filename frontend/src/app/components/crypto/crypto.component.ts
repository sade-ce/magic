
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetupService } from 'src/app/services/setup-service';
import { TicketService } from 'src/app/services/ticket-service';
import { KeysService } from 'src/app/services/keys-service';
import { EvaluatorService } from 'src/app/services/evaluator-service';
import { ImportKeyDialogComponent } from './modals/import-key-dialog';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'crypto-home',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent implements OnInit {
  public isFetching = false;
  public keyExists = false;
  public fingerprint: string;
  public publicKey: string;
  public seed: string = '';
  public strength: number = null;
  public strengthOptions: number[] = [
    2048,
    4096,
    8192
  ];
  public displayedColumns: string[] = [
    'subject',
    'email',
    'domain',
    'delete',
  ];
  public keys: any = [];
  public filter = '';

  public displayedColumnsInvocations: string[] = [
    'crypto_key',
    'request_id',
    'created',
    'request',
  ];
  public invocations: any = [];
  public invocationsFilter: any = {
    limit: 10,
    offset: 0,
  };
  public invocationsCount: number;

  public allKeys: any[] = [];
  public keyFilter = -1;

  constructor(
    private ticketService: TicketService,
    private evaluatorService: EvaluatorService,
    private keysService: KeysService,
    private service: SetupService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.service.getPublicKey().subscribe((res: any) => {
      if (res.result !== 'FAILURE') {
        this.showKey(res);
      }
    }, (error: any) => {
      this.snackBar.open(error.error.msg);
    });
    this.getKeys();
    this.getInvocations();
    this.keysService.getAllKeys().subscribe(res => {
      this.allKeys = res;
    });
  }

  generate() {
    this.isFetching = true;
    this.service.generateKeyPair(this.seed, this.strength).subscribe((res: any) => {
      this.isFetching = false;
      this.showKey(res);
      this.snackBar.open('Key successfully created', 'ok', {
        duration: 5000,
      });
      this.seed = '';
      this.strength = null;
      this.keysService.evictCache('magic.crypto.get-server-public-key').subscribe(res3 => {
        console.log('Public key was evicted from cache');
      });
      this.keysService.evictCache('magic.crypto.get-server-private-key').subscribe(res3 => {
        console.log('Private key was evicted from cache');
      });
    }, (error: any) => {
      this.isFetching = false;
      this.snackBar.open(error.error.message);
    });
  }

  showKey(key: any) {
    this.keyExists = true;
    this.fingerprint = key.fingerprint;
    this.publicKey = key['public-key'];
  }

  getQrCodeKeyFingerprintURL() {
    return this.ticketService.getBackendUrl() +
      'magic/modules/system/images/generate-qr?size=5&content=' +
      encodeURIComponent(this.ticketService.getBackendUrl() +
        'magic/modules/system/crypto/public-key-raw')
  }

  getKeys() {
    this.keysService.getKeys(this.filter).subscribe(res => {
      this.keys = res || [];
    });
  }

  importKey() {
    const dialogRef = this.dialog.open(ImportKeyDialogComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        readOnly: false,
        enabled: true,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== undefined) {
        if (res.domain && res.domain !== '') {
          if (res.domain.startsWith('http://')) {
            res.domain = res.domain.substring(7);
          } else if (res.domain.startsWith('https://')) {
            res.domain = res.domain.substring(8);
          }
        }
        this.keysService.importKey(
          res.subject,
          res.domain,
          res.email,
          res.content,
          res.vocabulary,
          res.fingerprint,
          res.enabled)
          .subscribe(res => {
            this.getKeys();
          }, error => {
            this.snackBar.open(error.error.message, 'ok');
          });
      }
    });
  }

  editKeyFromReceipt(el: any) {
    if (this.allKeys.length !== 0) {
      const result = this.allKeys.filter(x => x.id === el.crypto_key)[0];
      this.editKey(result, true);
    }
  }

  editKey(key: any, readOnly: boolean) {
    const dialogRef = this.dialog.open(ImportKeyDialogComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        id: key.id,
        imported: key.imported,
        subject: key.subject,
        domain: key.domain,
        email: key.email,
        content: key.content,
        vocabulary: key.vocabulary,
        fingerprint: key.fingerprint,
        type: key.type,
        enabled: key.enabled,
        readOnly,
      }
    });
    dialogRef.afterClosed().subscribe(nKey => {
      if (nKey !== undefined) {
        if (nKey.domain) {
          if (nKey.domain.startsWith('http://')) {
            nKey.domain = nKey.domain.substring(7);
          } else if (nKey.domain.startsWith('https://')) {
            nKey.domain = nKey.domain.substring(8);
          }
        }
        this.keysService.editKey(
          nKey.id,
          nKey.subject,
          nKey.domain,
          nKey.email,
          nKey.content,
          nKey.fingerprint,
          nKey.vocabulary,
          nKey.enabled)
          .subscribe(res2 => {
            this.getKeys();
            this.keysService.evictCache('public-key.' + nKey.fingerprint).subscribe(res3 => {
              console.log(res3);
            });
          }, error => {
            this.snackBar.open(error.error.message, 'ok');
          });
      }
    });
  }

  deleteKey(id: number) {
    this.keysService.deleteKey(id).subscribe(res => {
      this.keysService.getKeys(this.filter).subscribe(res => {
        this.keys = res || [];
      });
      var oldKeyFingerprint = this.allKeys.filter(x => x.id === id)[0].fingerprint;
      this.keysService.getAllKeys().subscribe(res => {
        this.allKeys = res;
      });
      delete this.invocationsFilter.crypto_key;
      this.invocationsFilter.offset = 0;
      this.keyFilter = -1;
      this.getInvocations();
      this.keysService.evictCache('magic.crypto.get-server-public-key').subscribe(res3 => {
        console.log('Public key was evicted from cache');
      });
      this.keysService.evictCache('magic.crypto.get-server-private-key').subscribe(res3 => {
        console.log('Private key was evicted from cache');
      });
      this.keysService.evictCache('public-key.' + oldKeyFingerprint).subscribe(res3 => {
        console.log('Client key was evicted from the cache');
      });
    });
  }

  getInvocations() {
    if (this.keyFilter !== -1) {
      this.invocationsFilter.crypto_key = this.keyFilter;
    } else {
      delete this.invocationsFilter.crypto_key;
    }
    this.evaluatorService.invocations(this.invocationsFilter).subscribe(res => {
      this.invocations = res;
      this.evaluatorService.countInvocations(this.invocationsFilter).subscribe(res => {
        this.invocationsCount = res.count;
      });
    });
  }

  paged(e: PageEvent) {
    this.invocationsFilter.offset = e.pageSize * e.pageIndex;
    this.getInvocations();
  }

  viewReceipt(el: any) {
    if (el.viewReceipt && el.viewReceipt === true) {
      el.viewReceipt = false;
    }
    else if (el.viewReceipt && el.viewReceipt === false) {
      el.viewReceipt = true;
    } else {
      el.viewReceipt = true;
    }
  }

  clearFilter() {
    this.keyFilter = -1;
    this.invocationsFilter.offset = 0;
    this.getInvocations();
  }

  filterChanged() {
    this.invocationsFilter.offset = 0;
    this.getInvocations();
  }

  getCryptoKey(cryptoKey: number, fullIdentity: boolean) {
    if (this.allKeys.length === 0) {
      return cryptoKey;
    } else {
      const result = this.allKeys.filter(x => x.id === cryptoKey)[0];
      if (fullIdentity) {
        return result.subject + ' - ' + result.email;
      } else {
        return result.subject;
      }
    }
  }

  getLocaleDate(date: string) {
    return new Date(date).toLocaleString();
  }
}
