
export type Rol = 'ADMIN' | 'OPERACIONES' | 'GERENCIA';
export type TipoCatalogo = 'DESTINO' | 'FACTOR_OPERATIVO' | 'TIPO_EVENTO';
export type EstadoUnidad = 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
export type EstadoPedido = 'PENDIENTE' | 'EN_TRANSITO' | 'ENTREGADO' | 'OBSERVADO';
export type EstadoViaje = 'PLANIFICADO' | 'EN_RUTA' | 'CERRADO';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: Date;
}

export interface Parametro {
  id: number;
  tipo: TipoCatalogo;
  nombre: string;
  activo: boolean;
  pedidosOrigen?: Pedido[];
  pedidosDestino?: Pedido[];
  rutasOrigen?: Ruta[];
  rutasDestino?: Ruta[];
  tramosOrigen?: ViajeTramo[];
  tramosDestino?: ViajeTramo[];
}

export interface ViajeActivoResumen {
  id: number;
  codigo: string;
  estado: EstadoViaje;
}

export interface Unidad {
  id: number;
  placa: string;
  codigoInterno: string;
  marca: string;
  anio: number;
  capacidadTon: number;
  factorEmision: number;
  conductorActual: string | null;
  estado: EstadoUnidad;
  viajeActivo?: ViajeActivoResumen | null;
  pedidos?: Pedido[];
  viajes?: Viaje[];
}

export interface Cliente {
  id: number;
  razonSocial: string;
  documento: string;
  pedidos?: Pedido[];
}

export interface Pedido {
  id: number;
  codigo: string;
  clienteId: number;
  cliente?: Cliente; 
  origenId: number;
  origen?: Parametro;
  destinoId: number;
  destino?: Parametro;
  destinatarioNombre: string | null;
  destinatarioDireccion: string | null;
  destinatarioTelefono: string | null;
  pesoKg: number | null;
  cantidadUnidades: number | null;
  factorPesoVol: string | null;
  observaciones: string | null;
  estado: EstadoPedido;
  unidadId: number | null;
  unidad?: Unidad | null;
  viajeId: number | null;
  viaje?: Viaje | null;
  distanciaKm: number | null;
  ingresoFlete: number | null;
  costoCombustible: number | null;
  costoPeaje: number | null;
  costoCarga: number | null;
  impactoCo2: number | null;
  margenNeto: number | null;
  rentabilidad: number | null;
  incidencias?: Incidencia[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Incidencia {
  id: number;
  pedidoId: number;
  pedido?: Pedido;
  tipoEvento: string;
  ubicacion: string | null;
  detalle: string;
  fechaHora: Date;
}

export interface Ruta {
  id: number;
  origenId: number;
  origen?: Parametro;
  destinoId: number;
  destino?: Parametro;
  distanciaKm: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Viaje {
  id: number;
  codigo: string;
  unidadId: number;
  unidad?: Unidad;
  conductor: string | null;
  estado: EstadoViaje;
  fechaInicio: Date | null;
  fechaCierre: Date | null;
  distanciaTotal: number | null;
  factorEmisionAplicado: number | null;
  co2Total: number | null;
  tramos?: ViajeTramo[];
  pedidos?: Pedido[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ViajeTramo {
  id: number;
  viajeId: number;
  viaje?: Viaje;
  orden: number;
  origenId: number;
  origen?: Parametro;
  destinoId: number;
  destino?: Parametro;
  distanciaKm: number;
  createdAt: Date;
}