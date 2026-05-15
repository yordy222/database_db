import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from './product.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./app.component.css'],
  template: `
    <div class="shell">

      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="logo-icon">📦</span>
          <span class="logo-text">InventarioYa</span>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item active"><span class="nav-icon">⊞</span> Dashboard</a>
          <a class="nav-item"><span class="nav-icon">◻</span> Productos</a>
          <a class="nav-item"><span class="nav-icon">🛒</span> Ventas</a>
          <a class="nav-item"><span class="nav-icon">📊</span> Reportes</a>
          <a class="nav-item"><span class="nav-icon">⚙</span> Configuración</a>
        </nav>
        <div class="sidebar-bottom">
          <span class="logout-btn">↩ Cerrar Sesión</span>
        </div>
      </aside>

      <div class="main">

        <header class="topbar">
          <h1 class="topbar-title">Gestión de Productos</h1>
          <div class="topbar-right">
            <div class="search-wrap">
              <input class="search-input" type="text" [(ngModel)]="searchQuery"
                     (input)="onSearch()" placeholder="Buscar producto...">
              <span class="search-icon">🔍</span>
            </div>
            <div class="user-badge">
              <span class="user-name">Usuario</span>
              <div class="avatar">U</div>
            </div>
          </div>
        </header>

        <div class="content">

          <p class="section-label">Métricas Clave</p>
          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-icon blue">📦</div>
              <div>
                <div class="metric-label">Productos Totales</div>
                <div class="metric-value">{{ totalProducts.toLocaleString() }}</div>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon pink">💰</div>
              <div>
                <div class="metric-label">Valor Total del Inventario</div>
                <div class="metric-value">\${{ valorInventario.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <div class="bottom-grid">

            <div class="table-card">
              <div class="table-header">
                <h2>Catálogo de Productos</h2>
                <button class="btn-add" (click)="openModal()">+ Agregar Nuevo Producto</button>
              </div>

              <div class="table-filters">
                <div class="filter-search-wrap">
                  <span>🔍</span>
                  <input type="text" [(ngModel)]="searchQuery"
                         (input)="onSearch()" placeholder="Buscar...">
                </div>
                <select [(ngModel)]="filterCat" (change)="onSearch()">
                  <option value="">Todas las Categorías</option>
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
                <select [(ngModel)]="sortDir" (change)="onSearch()">
                  <option value="desc">Monto ↓</option>
                  <option value="asc">Monto ↑</option>
                </select>
              </div>

              <div *ngIf="error" class="error-banner">⚠️ {{ error }}</div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of filteredProducts; let i = index">
                      <td class="id-cell">{{ i + 1 }}</td>
                      <td>
                        <div class="prod-thumb" [style.background]="catColor(p.category)">
                          {{ p.name.charAt(0) }}
                        </div>
                      </td>
                      <td class="name-cell">{{ p.name }}</td>
                      <td><span class="badge" [class]="'badge-' + catKey(p.category)">{{ p.category }}</span></td>
                      <td class="price-cell">\${{ p.price.toFixed(2) }}</td>
                      <td>
                        <span class="stock-num" [class.low-stock]="p.stock < 15">{{ p.stock }}</span>
                      </td>
                      <td class="actions-cell">
                        <button class="action-btn edit-btn" (click)="editProduct(p)" title="Editar">✏️</button>
                        <button class="action-btn del-btn" (click)="deleteProduct(p._id!)" title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                    <tr *ngIf="filteredProducts.length === 0">
                      <td colspan="7" class="empty-row">No hay productos que mostrar.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="right-col">
              <div class="chart-card">
                <div class="chart-card-header">
                  <span class="chart-title">Unidades en Stock por Categoría</span>
                  <span class="chart-type-label">Área/Línea</span>
                </div>
                <canvas #lineChart id="lineChart"></canvas>
              </div>
              <div class="chart-card">
                <div class="pie-row">
                  <div class="pie-item">
                    <canvas #pie1 id="pie1"></canvas>
                    <span class="pie-label">Mayor stock disponible</span>
                  </div>
                  <div class="pie-item">
                    <canvas #pie2 id="pie2"></canvas>
                    <span class="pie-label">Menor stock disponible (Críticos)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <div class="modal-header">
          <h3>{{ editMode ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
          <button type="button" class="modal-close" (click)="closeModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" name="name" [(ngModel)]="form.name" placeholder="Nombre del producto">
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <input type="text" name="category" [(ngModel)]="form.category" placeholder="Ej: Electrónica">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Precio ($)</label>
              <input type="number" name="price" [(ngModel)]="form.price" placeholder="0.00" min="0">
            </div>
            <div class="form-group">
              <label>Stock</label>
              <input type="number" name="stock" [(ngModel)]="form.stock" placeholder="0" min="0">
            </div>
          </div>
          <div *ngIf="formError" class="error-banner">{{ formError }}</div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
          
          <button type="submit" class="btn-save">
            {{ editMode ? 'Actualizar' : 'Agregar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pie1') pie1Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pie2') pie2Ref!: ElementRef<HTMLCanvasElement>;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery = '';
  filterCat = '';
  sortDir = 'desc';

  // Variables dinámicas
  categories: string[] = [];
  totalProducts = 0;
  valorInventario = 0;

  showModal = false;
  editMode = false;
  form: Product = { name: '', category: '', price: 0, stock: 0 };
  error = '';
  formError = '';

  lineChart?: Chart;
  pie1Chart?: Chart;
  pie2Chart?: Chart;

  constructor(private api: ProductService) { }

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    // Se inicializan cuando la vista cargue, pero se re-dibujarán con los datos
  }

  loadProducts() {
    this.api.getAll().subscribe({
      next: data => {
        this.products = data;
        this.processMetricsAndFilters();
        this.applyFilters();
        this.initCharts();
      },
      error: () => {
        this.error = "Error al cargar los productos. Problema en el backend o conexión.";
        this.processMetricsAndFilters();
        this.applyFilters();
        this.initCharts();
      }
    });
  }

  // --- NUEVA FUNCIÓN: Extrae métricas dependientes exclusivamente de los productos ---
  processMetricsAndFilters() {
    // 1. Total de productos
    this.totalProducts = this.products.length;

    // 2. Extraer categorías únicas para el filtro y para la gráfica de líneas
    const allCats = this.products.map(p => p.category).filter(c => c && c.trim() !== '');
    this.categories = [...new Set(allCats)];

    // 3. Valor total del inventario
    this.valorInventario = this.products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
  }

  onSearch() { this.applyFilters(); }

  applyFilters() {
    let list = [...this.products];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (this.filterCat) list = list.filter(p => p.category === this.filterCat);
    list.sort((a, b) => this.sortDir === 'asc' ? a.price - b.price : b.price - a.price);
    this.filteredProducts = list;
  }

  openModal() {
    this.form = { name: '', category: '', price: 0, stock: 0 };
    this.editMode = false;
    this.formError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.formError = '';
  }

  editProduct(p: Product) {
    this.form = { ...p };
    this.editMode = true;
    this.formError = '';
    this.showModal = true;
  }

  save() {
    if (!this.form.name || !this.form.category || this.form.price == null || this.form.price < 0 || this.form.stock == null || this.form.stock < 0) {
      this.formError = 'Datos inválidos o incompletos. Revisa nombre, categoría, precio y stock.';
      return;
    }

    if (this.editMode && this.form._id) {
      // 1. ACTUALIZACIÓN OPTIMISTA: Actualizamos localmente para mejor UX
      const index = this.products.findIndex(p => p._id === this.form._id);

      if (index !== -1) {
        this.products[index] = { ...this.form };
        this.actualizarVistaLocal();
        this.closeModal();

        // Mandamos al servidor en segundo plano
        this.api.update(this.form).subscribe({
          error: e => {
            alert('Error al guardar en la base de datos: ' + (e?.error?.error || 'Desconocido'));
            this.loadProducts(); // Si falla recargamos la verdad de la DB
          }
        });
      }
    } else {
      // 2. ACTUALIZACIÓN (CREACIÓN)
      // Primero al server para obtener el _id de Mongo
      this.api.create(this.form).subscribe({
        next: (nuevoProductoDesdeDB) => {
          this.products.unshift(nuevoProductoDesdeDB);
          this.actualizarVistaLocal();
          this.closeModal();
        },
        error: e => {
          this.formError = e?.error?.error || 'Error de conexión con el servidor.';
        }
      });
    }
  }

  deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;

    // ELIMINACIÓN LOCAL Optimista
    this.products = this.products.filter(p => p._id !== id);
    this.actualizarVistaLocal();

    // Avisamos al backend en segundo plano
    this.api.remove(id).subscribe({
      error: () => {
        alert('Error al eliminar en la nube. Recargando datos...');
        this.loadProducts();
      }
    });
  }

  // --- Método auxiliar para no repetir código ---
  actualizarVistaLocal() {
    this.processMetricsAndFilters();
    this.applyFilters();
    this.initCharts();
  }

  private colorPalette = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#ec4899'];

  catColor(cat: string): string {
    const idx = this.categories.indexOf(cat);
    return this.colorPalette[idx % this.colorPalette.length] ?? '#6b7280';
  }

  catKey(cat: string): string {
    return cat.toLowerCase().replace(/\s+/g, '-');
  }

  initCharts() {
    const lineEl = document.getElementById('lineChart') as HTMLCanvasElement;
    const p1El = document.getElementById('pie1') as HTMLCanvasElement;
    const p2El = document.getElementById('pie2') as HTMLCanvasElement;
    if (!lineEl || !p1El || !p2El) return;

    // Destruir instancias previas para evitar superposición
    if (this.lineChart) this.lineChart.destroy();
    if (this.pie1Chart) this.pie1Chart.destroy();
    if (this.pie2Chart) this.pie2Chart.destroy();

    const dataByCat = this.categories.map(cat => {
      // Suma de unidades de stock por categoría:
      return this.products.filter(p => p.category === cat).reduce((sum, p) => sum + p.stock, 0);
    });

    this.lineChart = new Chart(lineEl, {
      type: 'line',
      data: {
        labels: this.categories.length > 0 ? this.categories : ['Sin datos'],
        datasets: [{
          label: 'Cantidad',
          data: dataByCat.length > 0 ? dataByCat : [0],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 9 }, stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 9 } } }
        }
      }
    });


    const highestStock = this.products
      .filter(p => p.stock >= 15)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    const labelsPie1 = highestStock.length ? highestStock.map(p => p.name) : ['Sin stock alto'];
    const dataPie1 = highestStock.length ? highestStock.map(p => p.stock) : [1];
    const bgPie1 = highestStock.length ? ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444'] : ['#e5e7eb'];


    const lowestStock = this.products
      .filter(p => p.stock < 15)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    const labelsPie2 = lowestStock.length ? lowestStock.map(p => p.name) : ['Sin stock crítico'];
    const dataPie2 = lowestStock.length ? lowestStock.map(p => p.stock) : [1];
    const bgPie2 = lowestStock.length ? ['#ec4899', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'] : ['#e5e7eb'];

    const pieOpts: any = {
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: function (context: any) {

              if (context.label.includes('Sin stock')) return ' 0 unidades';
              return ` ${context.raw} unidades`;
            }
          }
        }
      }
    };

    this.pie1Chart = new Chart(p1El, {
      type: 'pie',
      data: {
        labels: labelsPie1,
        datasets: [{ data: dataPie1, backgroundColor: bgPie1, borderWidth: 1 }]
      },
      options: pieOpts
    });

    this.pie2Chart = new Chart(p2El, {
      type: 'pie',
      data: {
        labels: labelsPie2,
        datasets: [{ data: dataPie2, backgroundColor: bgPie2, borderWidth: 1 }]
      },
      options: pieOpts
    });
  }
}