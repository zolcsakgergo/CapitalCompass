import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/api/positions`;

  constructor(private http: HttpClient) {}

  getPositions(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  deletePosition(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
