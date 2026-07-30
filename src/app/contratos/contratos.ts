import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../shared/footer/footer';
import { ContratoService, Contrato, Documento } from '../services/contrato.service';
import { PropiedadService, Propiedad } from '../services/propiedad.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule],
  templateUrl: './contratos.html',
  styleUrl: './contratos.css'
})
export class ContratosComponent implements OnInit {
  private contratoService: ContratoService = inject(ContratoService);
  private propiedadService: PropiedadService = inject(PropiedadService);
  authService: AuthService = inject(AuthService);
  private http: HttpClient = inject(HttpClient);

  usuarioActual = computed(() => this.authService.obtenerUsuario());

  contratosList = signal<Contrato[]>([]);
  propiedadesList = signal<Propiedad[]>([]);
  clientesList = signal<any[]>([]);
  agentesList = signal<any[]>([]);

  planesFinanciamiento: any[] = [];
  planSeleccionado: string = 'contado';

  // Form Model for Contract
  nuevoContrato: Contrato = {
    id_propiedad: 0,
    id_cliente: 0,
    id_agente: 0,
    tipo_contrato: 'compra-venta',
    precio_acordado: 0,
    fecha_inicio: '',
    estado: 'activo',
    metodo_pago: 'contado',
    cuota_inicial: 0,
    num_cuotas: 0,
    monto_cuota: 0
  };

  // Form Model for Document upload
  nuevoDoc: Documento = {
    id_contrato: undefined,
    id_propiedad: undefined,
    tipo_documento: 'pdf',
    nombre_archivo: '',
    url_archivo: ''
  };

  ngOnInit(): void {
    this.cargarContratos();
    this.cargarDatosGenerales();

    // Auto set agent ID in form if user is Agent
    const user = this.usuarioActual();
    if (user && user.rol === 'agente') {
      this.nuevoContrato.id_agente = user.id_agente || 0;
    }
  }

  cargarContratos(): void {
    this.contratoService.listarContratos().subscribe({
      next: (res) => {
        const list = res;
        // Filter based on roles
        const user = this.usuarioActual();
        if (user) {
          if (user.rol === 'cliente') {
            this.contratosList.set(list.filter((c: any) => c.id_cliente === user.id_cliente));
          } else if (user.rol === 'agente') {
            this.contratosList.set(list.filter((c: any) => c.id_agente === user.id_agente));
          } else {
            this.contratosList.set(list);
          }
        }
      },
      error: (err) => console.error('Error al cargar contratos:', err)
    });
  }

  cargarDatosGenerales(): void {
    // Load reserved or available properties
    this.propiedadService.listarPropiedades().subscribe({
      next: (data) => this.propiedadesList.set(data),
      error: (err) => console.error(err)
    });

    if (this.authService.esAdmin() || this.authService.esAgente()) {
      this.http.get<any>('http://localhost:3000/clientes').subscribe({
        next: (res) => this.clientesList.set(Array.isArray(res) ? res : (res.clientes || [])),
        error: (err) => console.error(err)
      });
      this.http.get<any>('http://localhost:3000/agentes').subscribe({
        next: (res) => this.agentesList.set(Array.isArray(res) ? res : (res.agentes || [])),
        error: (err) => console.error(err)
      });
    }
  }

  onPropiedadSeleccionada(): void {
    const propId = Number(this.nuevoContrato.id_propiedad);
    const prop = this.propiedadesList().find(p => p.id_propiedad === propId);
    if (prop) {
      this.nuevoContrato.precio_acordado = prop.precio;
      this.actualizarPlanesFinanciamiento();
    }
  }

  actualizarPlanesFinanciamiento(): void {
    const precio = this.nuevoContrato.precio_acordado || 0;
    this.planesFinanciamiento = [
      {
        id: 'contado',
        nombre: 'Pago al Contado (100%)',
        metodo_pago: 'contado',
        cuota_inicial: precio,
        num_cuotas: 0,
        monto_cuota: 0,
        descripcion: 'Pago total inmediato del lote'
      },
      {
        id: 'financiado_12',
        nombre: 'Crédito Directo 12 meses (10% Inicial)',
        metodo_pago: 'financiado',
        cuota_inicial: Number((precio * 0.10).toFixed(2)),
        num_cuotas: 12,
        monto_cuota: Number(((precio * 0.90) / 12).toFixed(2)),
        descripcion: 'Inicial del 10% + 12 cuotas mensuales sin intereses'
      },
      {
        id: 'financiado_24',
        nombre: 'Crédito Directo 24 meses (15% Inicial)',
        metodo_pago: 'financiado',
        cuota_inicial: Number((precio * 0.15).toFixed(2)),
        num_cuotas: 24,
        monto_cuota: Number(((precio * 0.85) / 24).toFixed(2)),
        descripcion: 'Inicial del 15% + 24 cuotas mensuales sin intereses'
      },
      {
        id: 'financiado_36',
        nombre: 'Crédito Directo 36 meses (20% Inicial)',
        metodo_pago: 'financiado',
        cuota_inicial: Number((precio * 0.20).toFixed(2)),
        num_cuotas: 36,
        monto_cuota: Number(((precio * 0.80) / 36).toFixed(2)),
        descripcion: 'Inicial del 20% + 36 cuotas mensuales sin intereses'
      },
      {
        id: 'financiado_48',
        nombre: 'Crédito Directo 48 meses (25% Inicial)',
        metodo_pago: 'financiado',
        cuota_inicial: Number((precio * 0.25).toFixed(2)),
        num_cuotas: 48,
        monto_cuota: Number(((precio * 0.75) / 48).toFixed(2)),
        descripcion: 'Inicial del 25% + 48 cuotas mensuales sin intereses'
      },
      {
        id: 'financiado_60',
        nombre: 'Crédito Directo 60 meses (30% Inicial)',
        metodo_pago: 'financiado',
        cuota_inicial: Number((precio * 0.30).toFixed(2)),
        num_cuotas: 60,
        monto_cuota: Number(((precio * 0.70) / 60).toFixed(2)),
        descripcion: 'Inicial del 30% + 60 cuotas mensuales sin intereses'
      }
    ];

    this.seleccionarPlan(this.planSeleccionado);
  }

  seleccionarPlan(planId: string): void {
    this.planSeleccionado = planId;
    const plan = this.planesFinanciamiento.find(p => p.id === planId);
    if (plan) {
      this.nuevoContrato.metodo_pago = plan.metodo_pago;
      this.nuevoContrato.cuota_inicial = plan.cuota_inicial;
      this.nuevoContrato.num_cuotas = plan.num_cuotas;
      this.nuevoContrato.monto_cuota = plan.monto_cuota;
    }
  }

  crearContrato(): void {
    if (!this.nuevoContrato.id_propiedad || !this.nuevoContrato.id_cliente || !this.nuevoContrato.precio_acordado || !this.nuevoContrato.fecha_inicio) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    // Auto set agent from property
    if (this.authService.esCliente()) {
      const prop = this.propiedadesList().find(p => p.id_propiedad === Number(this.nuevoContrato.id_propiedad));
      this.nuevoContrato.id_agente = prop ? prop.id_agente : 1;
    }

    // Convert types
    this.nuevoContrato.id_propiedad = Number(this.nuevoContrato.id_propiedad);
    this.nuevoContrato.id_cliente = Number(this.nuevoContrato.id_cliente);
    this.nuevoContrato.id_agente = Number(this.nuevoContrato.id_agente);
    this.nuevoContrato.precio_acordado = Number(this.nuevoContrato.precio_acordado);
    this.nuevoContrato.cuota_inicial = Number(this.nuevoContrato.cuota_inicial || 0);
    this.nuevoContrato.num_cuotas = Number(this.nuevoContrato.num_cuotas || 0);
    this.nuevoContrato.monto_cuota = Number(this.nuevoContrato.monto_cuota || 0);

    this.contratoService.crearContrato(this.nuevoContrato).subscribe({
      next: () => {
        alert('¡Contrato generado con éxito!');
        // Update property state to sold
        this.propiedadService.actualizarPropiedad(this.nuevoContrato.id_propiedad, { estado: 'vendido' }).subscribe();
        this.nuevoContrato.precio_acordado = 0;
        this.nuevoContrato.fecha_inicio = '';
        this.nuevoContrato.metodo_pago = 'contado';
        this.nuevoContrato.cuota_inicial = 0;
        this.nuevoContrato.num_cuotas = 0;
        this.nuevoContrato.monto_cuota = 0;
        this.planSeleccionado = 'contado';
        this.planesFinanciamiento = [];
        this.cargarContratos();
      },
      error: (err) => {
        console.error('Error al crear contrato:', err);
        alert(err.error?.mensaje || 'Error al crear el contrato.');
      }
    });
  }

  cambiarEstadoContrato(idContrato: number, nuevoEstado: 'activo' | 'finalizado' | 'anulado'): void {
    this.contratoService.actualizarContrato(idContrato, { estado: nuevoEstado }).subscribe({
      next: () => {
        alert(`Estado del contrato cambiado a: ${nuevoEstado}`);
        this.cargarContratos();
      },
      error: (err) => console.error(err)
    });
  }

  // File Upload Simulation
  registrarArchivoDoc(contratoId: number): void {
    const fileName = prompt('Ingrese el nombre del documento (Ej. Contrato_CompraVenta_Firmado.pdf):');
    if (!fileName) return;
    const fileUrl = prompt('Ingrese el enlace / URL de descarga del documento (PDF):', 'http://example.com/contrato.pdf');
    if (!fileUrl) return;

    const docPayload: Documento = {
      id_contrato: contratoId,
      tipo_documento: 'pdf',
      nombre_archivo: fileName,
      url_archivo: fileUrl
    };

    this.contratoService.crearDocumento(docPayload).subscribe({
      next: () => {
        alert('¡Documento digital registrado y enlazado al contrato con éxito!');
        this.cargarContratos();
      },
      error: (err) => {
        console.error('Error al registrar documento:', err);
        alert('Error al enlazar el documento.');
      }
    });
  }
}
