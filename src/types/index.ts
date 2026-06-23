
export type Rol = 'ADMIN' | 'OPERACIONES' | 'GERENCIA';
export type TipoCatalogo = 'DESTINO' | 'FACTOR_OPERATIVO' | 'TIPO_EVENTO';
export type EstadoUnidad = 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
export type EstadoPedido = 'PENDIENTE' | 'EN_TRANSITO' | 'ENTREGADO' | 'OBSERVADO';

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
  pedidos?: Pedido[];
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
  factorPesoVol: string | null;
  observaciones: string | null;
  estado: EstadoPedido;
  unidadId: number | null;
  unidad?: Unidad | null;
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