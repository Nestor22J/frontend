import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../shared/footer/footer';
import { CitaService, Cita } from '../services/cita.service';
import { PropiedadService, Propiedad } from '../services/propiedad.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css'
})
export class CitasComponent implements OnInit {
  private citaService: CitaService = inject(CitaService);
  private propiedadService: PropiedadService = inject(PropiedadService);
  authService: AuthService = inject(AuthService);
  private http: HttpClient = inject(HttpClient);

  usuarioActual = computed(() => this.authService.obtenerUsuario());

  citasList = signal<Cita[]>([]);
  propiedadesList = signal<Propiedad[]>([]);
  clientesList = signal<any[]>([]);
  agentesList = signal<any[]>([]);

  // Form Model
  nuevaCita: Cita = {
    id_propiedad: 0,
    id_cliente: 0,
    id_agente: 0,
    fecha_hora: '',
    modalidad: 'presencial',
    notas: ''
  };

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarPropiedadesYPersonas();
    
    // Set default client/agent IDs based on role
    const user = this.usuarioActual();
    if (user) {
      if (user.rol === 'cliente') {
        this.nuevaCita.id_cliente = user.id_cliente || 0;
      } else if (user.rol === 'agente') {
        this.nuevaCita.id_agente = user.id_agente || 0;
      }
    }
  }

  cargarCitas(): void {
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        // Filter citations based on user role to keep data secure and clean
        const user = this.usuarioActual();
        if (user) {
          if (user.rol === 'cliente') {
            this.citasList.set(data.filter(c => c.id_cliente === user.id_cliente));
          } else if (user.rol === 'agente') {
            this.citasList.set(data.filter(c => c.id_agente === user.id_agente));
          } else {
            this.citasList.set(data);
          }
        }
      },
      error: (err) => console.error('Error al cargar citas:', err)
    });
  }

  cargarPropiedadesYPersonas(): void {
    // Properties
    this.propiedadService.listarPropiedades().subscribe({
      next: (data) => {
        const user = this.usuarioActual();
        if (user && user.rol === 'agente') {
          this.propiedadesList.set(data.filter(p => p.estado === 'disponible' && p.id_agente === user.id_agente));
        } else {
          this.propiedadesList.set(data.filter(p => p.estado === 'disponible'));
        }
      },
      error: (err) => console.error('Error al cargar propiedades:', err)
    });

    // If admin or agent, load lists to select in form dropdowns
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

  agendarCita(): void {
    if (!this.nuevaCita.id_propiedad || !this.nuevaCita.fecha_hora) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    // Auto assign agent if client bookings
    if (this.authService.esCliente()) {
      // Find property agent
      const prop = this.propiedadesList().find(p => p.id_propiedad === Number(this.nuevaCita.id_propiedad));
      if (prop) {
        this.nuevaCita.id_agente = prop.id_agente;
      } else {
        this.nuevaCita.id_agente = 1; // Default fallback agent
      }
    }

    // Map IDs to numbers
    this.nuevaCita.id_propiedad = Number(this.nuevaCita.id_propiedad);
    this.nuevaCita.id_cliente = Number(this.nuevaCita.id_cliente);
    this.nuevaCita.id_agente = Number(this.nuevaCita.id_agente);

    this.citaService.crearCita(this.nuevaCita).subscribe({
      next: () => {
        alert('¡Cita registrada correctamente!');
        this.nuevaCita.fecha_hora = '';
        this.nuevaCita.notas = '';
        this.cargarCitas();
      },
      error: (err) => {
        console.error('Error al agendar cita:', err);
        alert(err.error?.mensaje || 'Error al agendar la cita.');
      }
    });
  }

  cambiarEstado(idCita: number, nuevoEstado: 'confirmada' | 'cancelada' | 'realizada'): void {
    this.citaService.actualizarCita(idCita, { estado: nuevoEstado }).subscribe({
      next: () => {
        alert(`Cita cambiada a: ${nuevoEstado}`);
        this.cargarCitas();
      },
      error: (err) => console.error('Error al cambiar estado de cita:', err)
    });
  }
}
