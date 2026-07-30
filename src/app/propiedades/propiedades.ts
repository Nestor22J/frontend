import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../shared/footer/footer';
import { PropiedadService, Propiedad } from '../services/propiedad.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-propiedades',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule],
  templateUrl: './propiedades.html',
  styleUrl: './propiedades.css'
})
export class PropiedadesComponent implements OnInit {
  private propiedadService: PropiedadService = inject(PropiedadService);
  authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  propiedadesList = signal<Propiedad[]>([]);
  selectedTab = signal<'mapa' | 'catalogo' | 'zona' | 'editar'>('mapa');

  // SVG Selected Lot
  selectedLotLabel = signal<string | null>(null);
  selectedLotData = signal<Propiedad | null>(null);

  // Form Model for Editing a Pre-defined Lot
  newPropiedad: Propiedad = {
    id_propiedad: undefined,
    id_agente: 1,
    titulo: '',
    tipo_propiedad: 'terreno',
    modalidad: 'venta',
    precio: 0,
    area_m2: 120,
    descripcion: '',
    direccion: '',
    distrito: 'Pachacámac',
    ciudad: 'Lima',
    estado: 'disponible'
  };

  usuarioActual = computed(() => this.authService.obtenerUsuario());

  propiedadesEditables = computed(() => {
    const list = this.propiedadesList();
    const user = this.usuarioActual();
    if (!user) return [];
    if (user.rol === 'admin') return list;
    if (user.rol === 'agente') {
      return list.filter(p => p.id_agente === user.id_agente);
    }
    return [];
  });

  ngOnInit(): void {
    this.cargarPropiedades();
    const user = this.usuarioActual();
    if (user) {
      if (user.rol === 'agente') {
        this.newPropiedad.id_agente = user.id_agente || 1;
      } else if (user.rol === 'admin') {
        this.newPropiedad.id_agente = 1;
      }
    }
  }

  // Catalog Filters
  searchQuery = signal<string>('');
  statusFilter = signal<string>('todos');
  maxPriceFilter = signal<number | null>(null);
  minAreaFilter = signal<number | null>(null);

  filteredPropiedades = computed(() => {
    let list = this.propiedadesList();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const maxPrice = this.maxPriceFilter();
    const minArea = this.minAreaFilter();
    const user = this.usuarioActual();

    // El cliente no debe ver terrenos vendidos en su catálogo
    if (user && user.rol === 'cliente') {
      list = list.filter(p => p.estado !== 'vendido');
    }

    if (query) {
      list = list.filter(p => 
        p.titulo.toLowerCase().includes(query) || 
        (p.descripcion && p.descripcion.toLowerCase().includes(query)) ||
        (p.nombre_agente && p.nombre_agente.toLowerCase().includes(query))
      );
    }

    if (status !== 'todos') {
      list = list.filter(p => p.estado === status);
    }

    if (maxPrice !== null && maxPrice > 0) {
      list = list.filter(p => Number(p.precio) <= maxPrice);
    }

    if (minArea !== null && minArea > 0) {
      list = list.filter(p => (p.area_m2 || 0) >= minArea);
    }

    return list;
  });

  changeTab(tab: 'mapa' | 'catalogo' | 'zona' | 'editar'): void {
    const user = this.usuarioActual();
    // Restrict "zona" tab only to clients
    if (tab === 'zona' && (!user || user.rol !== 'cliente')) {
      return;
    }

    this.selectedTab.set(tab);
    if (tab === 'editar' && this.selectedLotLabel()) {
      // Auto populate if a lot is already selected on the map
      this.newPropiedad.titulo = this.selectedLotLabel() || '';
      this.onEditLotSelect();
    }
  }

  cargarPropiedades(): void {
    this.propiedadService.listarPropiedades().subscribe({
      next: (data) => {
        this.propiedadesList.set(data);
        // If a lot was already selected, refresh its data
        if (this.selectedLotLabel()) {
          this.selectLot(this.selectedLotLabel()!);
        }
      },
      error: (err) => console.error('Error al cargar propiedades:', err)
    });
  }

  // Handle Interactive Map Lot Click
  selectLot(lotLabel: string): void {
    this.selectedLotLabel.set(lotLabel);
    
    // Find matching property in database list
    const match = this.propiedadesList().find(p => p.titulo === lotLabel);

    if (match) {
      this.selectedLotData.set(match);
    } else {
      this.selectedLotData.set(null);
    }
  }

  // Get status color class for SVG
  getLotColor(lotLabel: string): string {
    const match = this.propiedadesList().find(p => p.titulo === lotLabel);
    if (!match) return 'lot-unregistered';
    if (match.estado === 'disponible') return 'lot-available';
    if (match.estado === 'reservado') return 'lot-reserved';
    return 'lot-sold';
  }

  separarLote(): void {
    const lot = this.selectedLotData();
    if (!lot || !lot.id_propiedad) return;

    const user = this.usuarioActual();
    const payload: any = { estado: 'reservado' };
    if (user && user.rol === 'cliente') {
      payload.id_cliente_reservado = user.id_cliente || null;
    }

    this.propiedadService.actualizarPropiedad(lot.id_propiedad, payload).subscribe({
      next: () => {
        alert(`¡Lote ${this.selectedLotLabel()} reservado con éxito!`);
        this.cargarPropiedades();
      },
      error: (err) => {
        console.error('Error al reservar lote:', err);
        alert('No se pudo reservar el lote.');
      }
    });
  }

  liberarLote(): void {
    const lot = this.selectedLotData();
    if (!lot || !lot.id_propiedad) return;

    this.propiedadService.actualizarPropiedad(lot.id_propiedad, { estado: 'disponible', id_cliente_reservado: null }).subscribe({
      next: () => {
        alert(`¡Reserva del lote ${this.selectedLotLabel()} anulada con éxito!`);
        this.cargarPropiedades();
      },
      error: (err) => {
        console.error('Error al liberar lote:', err);
        alert('No se pudo anular la reserva.');
      }
    });
  }

  separarLoteCatalog(p: Propiedad): void {
    if (!p.id_propiedad) return;
    const user = this.usuarioActual();
    const payload: any = { estado: 'reservado' };
    if (user && user.rol === 'cliente') {
      payload.id_cliente_reservado = user.id_cliente || null;
    }
    this.propiedadService.actualizarPropiedad(p.id_propiedad, payload).subscribe({
      next: () => {
        alert(`¡Lote ${p.titulo} reservado con éxito!`);
        this.cargarPropiedades();
      },
      error: (err) => {
        console.error('Error al reservar lote desde catálogo:', err);
        alert('No se pudo reservar el lote.');
      }
    });
  }

  liberarLoteCatalog(p: Propiedad): void {
    if (!p.id_propiedad) return;
    this.propiedadService.actualizarPropiedad(p.id_propiedad, { estado: 'disponible', id_cliente_reservado: null }).subscribe({
      next: () => {
        alert(`¡Reserva del lote ${p.titulo} anulada con éxito!`);
        this.cargarPropiedades();
      },
      error: (err) => {
        console.error('Error al liberar lote desde catálogo:', err);
        alert('No se pudo anular la reserva.');
      }
    });
  }

  crearContratoDesdeReserva(p: Propiedad): void {
    this.router.navigate(['/contratos']);
  }

  cambiarEstadoLote(nuevoEstado: 'disponible' | 'reservado' | 'vendido'): void {
    const lot = this.selectedLotData();
    if (!lot || !lot.id_propiedad) return;

    this.propiedadService.actualizarPropiedad(lot.id_propiedad, { estado: nuevoEstado }).subscribe({
      next: () => {
        alert(`Estado del lote ${this.selectedLotLabel()} actualizado a "${nuevoEstado}"`);
        this.cargarPropiedades();
      },
      error: (err) => {
        console.error('Error al actualizar estado de lote:', err);
        alert('No se pudo cambiar el estado del lote.');
      }
    });
  }

  agendarCita(): void {
    this.router.navigate(['/citas']);
  }

  verEnPlano(lotLabel: string): void {
    this.changeTab('mapa');
    this.selectLot(lotLabel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Pool of custom-generated terrain images and locations
  getLotImage(p: Propiedad): string {
    if (p.url_principal) return p.url_principal;

    const title = p.titulo || '';

    // 1. Lotes colindantes al Club House & Piscina (Mz. A L-01, Mz. A L-02)
    if (title.includes('Mz. A L-01') || title.includes('Mz. A L-02')) {
      return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'; // Piscina y club house de fondo
    }

    // 2. Lotes colindantes a la Zona de Parrillas & Juegos (Mz. C L-07, Mz. C L-08)
    if (title.includes('Mz. C L-07') || title.includes('Mz. C L-08')) {
      return 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80'; // Pérgola de jardín y zona de parrillas premium
    }

    // 3. Lotes colindantes a las Áreas Verdes y Senderos (Mz. B L-06, Mz. D L-12)
    if (title.includes('Mz. B L-06') || title.includes('Mz. D L-12')) {
      return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'; // Parques y áreas verdes
    }

    // 4. Lotes estándar (Frente a pistas, vista limpia del valle)
    // Rotamos entre nuestra imagen frontal generada y fotos premium de terrenos
    const standardImages = [
      'terrenos/terreno_front_estandar.png', // Imagen generada frontal
      'terrenos/terreno_02.png',              // Terreno marcado con estacas
      'terrenos/terreno_05.png',              // Terreno limpio
    ];

    const idx = p.id_propiedad ?? 0;
    return standardImages[idx % standardImages.length];
  }


  // Populate form when selecting a lot to edit
  onEditLotSelect(): void {
    const match = this.propiedadesList().find(p => p.titulo === this.newPropiedad.titulo);
    if (match) {
      this.newPropiedad.id_propiedad = match.id_propiedad;
      this.newPropiedad.precio = Number(match.precio);
      this.newPropiedad.area_m2 = match.area_m2;
      this.newPropiedad.descripcion = match.descripcion;
      this.newPropiedad.id_agente = match.id_agente;
      this.newPropiedad.estado = match.estado;
      this.newPropiedad.direccion = match.direccion;
      this.newPropiedad.distrito = match.distrito;
      this.newPropiedad.ciudad = match.ciudad;
      this.newPropiedad.tipo_propiedad = match.tipo_propiedad;
      this.newPropiedad.modalidad = match.modalidad;
    }
  }

  // Save changes to property (lot characteristics)
  guardarCambiosLote(): void {
    if (!this.newPropiedad.id_propiedad) {
      alert('Por favor seleccione un lote válido a editar');
      return;
    }

    if (!this.newPropiedad.precio || !this.newPropiedad.area_m2) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    this.propiedadService.actualizarPropiedad(this.newPropiedad.id_propiedad, this.newPropiedad).subscribe({
      next: () => {
        alert(`¡Características del lote ${this.newPropiedad.titulo} actualizadas con éxito!`);
        this.cargarPropiedades();
        this.changeTab('mapa');
      },
      error: (err) => {
        console.error('Error al actualizar lote:', err);
        alert('Ocurrió un error al actualizar el lote.');
      }
    });
  }
}
