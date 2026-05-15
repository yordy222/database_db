import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  _id?: string; // Mongo usa _id [cite: 169]
  name: string;
  category: string;
  price: number;
  stock: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  public apiUrl = 'http://localhost:4000/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> { 
    return this.http.get<Product[]>(this.apiUrl); 
  }
  
  create(data: Product): Observable<Product> { 
    return this.http.post<Product>(this.apiUrl, data); 
  }

  update(data: Product): Observable<Product> {
    if (!data._id) throw new Error('Falta el ID');
    return this.http.put<Product>(`${this.apiUrl}/${data._id}`, data);
  }

  remove(id: string): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/${id}`); 
  }
}