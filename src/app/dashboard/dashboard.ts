import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../shared/footer/footer';
import { AuthService, Usuario } from '../services/auth.service';
import { PropiedadService, Propiedad } from '../services/propiedad.service';
import { CitaService, Cita } from '../services/cita.service';
import { ContratoService, Contrato } from '../services/contrato.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private http: HttpClient = inject(HttpClient);
  authService: AuthService = inject(AuthService);
  private propiedadService: PropiedadService = inject(PropiedadService);
  private citaService: CitaService = inject(CitaService);
  private contratoService: ContratoService = inject(ContratoService);

  usuarioActual = computed(() => this.authService.obtenerUsuario());

  // Statistics
  totalLotes = signal(0);
  totalCitas = signal(0);
  totalContratos = signal(0);
  totalClientes = signal(0);

  // Lists
  usuariosList = signal<any[]>([]);
  agentesList = signal<any[]>([]);
  clientesList = signal<any[]>([]);

  // Agent/Client specific lists
  misCitasList = signal<Cita[]>([]);
  misContratosList = signal<Contrato[]>([]);
  misPropiedadesList = signal<Propiedad[]>([]);

  // Active Tab for Admin
  activeTab = signal<'stats' | 'usuarios' | 'agentes' | 'clientes'>('stats');

  ngOnInit(): void {
    this.cargarEstadisticas();
    if (this.authService.esAdmin()) {
      this.cargarDatosAdministrativos();
    }
  }

  changeTab(tab: 'stats' | 'usuarios' | 'agentes' | 'clientes'): void {
    this.activeTab.set(tab);
  }

  cargarEstadisticas(): void {
    const user = this.usuarioActual();
    if (!user) return;

    // 1. Load properties
    this.propiedadService.listarPropiedades().subscribe({
      next: (data) => {
        if (this.authService.esAdmin()) {
          this.totalLotes.set(data.length);
        } else if (this.authService.esAgente()) {
          // Agent sees properties they manage
          const filtered = data.filter(p => p.id_agente === user.id_agente);
          this.totalLotes.set(filtered.length);
          this.misPropiedadesList.set(filtered);
        } else if (this.authService.esCliente()) {
          // Client sees their reserved properties OR properties with contracts
          this.contratoService.listarContratos().subscribe(contratos => {
            const clientContratos = contratos.filter(c => c.id_cliente === user.id_cliente);
            const propIds = clientContratos.map(c => c.id_propiedad);
            
            // Filter: has contract OR is reserved by this client
            const filtered = data.filter(p => 
              propIds.includes(p.id_propiedad || -1) || 
              p.id_cliente_reservado === user.id_cliente
            );
            
            this.totalLotes.set(filtered.length);
            this.misPropiedadesList.set(filtered);
          });
        }
      },
      error: (err) => console.error('Error al cargar lotes:', err)
    });

    // 2. Load appointments
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        if (this.authService.esAdmin()) {
          this.totalCitas.set(data.length);
        } else if (this.authService.esAgente()) {
          const filtered = data.filter(c => c.id_agente === user.id_agente);
          this.totalCitas.set(filtered.length);
          this.misCitasList.set(filtered);
        } else if (this.authService.esCliente()) {
          const filtered = data.filter(c => c.id_cliente === user.id_cliente);
          this.totalCitas.set(filtered.length);
          this.misCitasList.set(filtered);
        }
      },
      error: (err) => console.error('Error al cargar citas:', err)
    });

    // 3. Load contracts
    this.contratoService.listarContratos().subscribe({
      next: (data) => {
        if (this.authService.esAdmin()) {
          this.totalContratos.set(data.length);
        } else if (this.authService.esAgente()) {
          const filtered = data.filter(c => c.id_agente === user.id_agente);
          this.totalContratos.set(filtered.length);
          this.misContratosList.set(filtered);
        } else if (this.authService.esCliente()) {
          const filtered = data.filter(c => c.id_cliente === user.id_cliente);
          this.totalContratos.set(filtered.length);
          this.misContratosList.set(filtered);
        }
      },
      error: (err) => console.error('Error al cargar contratos:', err)
    });
  }

  cargarDatosAdministrativos(): void {
    // Load all users
    this.http.get<any>('http://localhost:3000/usuarios').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data.usuarios || []);
        this.usuariosList.set(list);
      },
      error: (err) => console.error('Error al cargar usuarios:', err)
    });

    // Load agents list
    this.http.get<any>('http://localhost:3000/agentes').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res.agentes || []);
        this.agentesList.set(list);
      },
      error: (err) => console.error('Error al cargar agentes:', err)
    });

    // Load clients list
    this.http.get<any>('http://localhost:3000/clientes').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res.clientes || []);
        this.clientesList.set(list);
        this.totalClientes.set(list.length);
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  cambiarEstadoUsuario(user: any): void {
    const nuevoEstado = !user.estado;
    this.http.put(`http://localhost:3000/usuarios/${user.id_usuario}`, {
      estado: nuevoEstado
    }).subscribe({
      next: () => {
        user.estado = nuevoEstado;
        this.successAlert(`El usuario ${user.nombre} ha sido ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        alert('No se pudo actualizar el estado del usuario');
      }
    });
  }

  successAlert(msg: string): void {
    alert(msg);
  }
}
