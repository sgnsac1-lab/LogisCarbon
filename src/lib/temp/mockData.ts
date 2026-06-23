export const mockStats = {
  totalPedidos: 124,
  emisionesMes: "1,450 kg CO2",
  unidadesEnRuta: 8,
  rentabilidadGlobal: "18.5%"
};

export const mockCatalogos = [
  { id: "1", tipo: "Destino", nombre: "Centro de Distribución Norte", estado: "Activo" },
  { id: "2", tipo: "Destino", nombre: "Planta Sur", estado: "Activo" },
  { id: "3", tipo: "Servicio", nombre: "Flete Directo", estado: "Activo" },
  { id: "4", tipo: "Servicio", nombre: "Consolidado", estado: "Inactivo" },
];

export const mockClientes = [
  { id: "CLI-001", razonSocial: "Acme Corp", documento: "20123456789", estado: "Activo" },
  { id: "CLI-002", razonSocial: "Global Tech SAC", documento: "20987654321", estado: "Activo" },
  { id: "CLI-003", razonSocial: "BioFoods SA", documento: "20456123789", estado: "Inactivo" },
];

export const mockPedidos = [
  { id: "PED-001", cliente: "Acme Corp", ruta: "Planta Centro -> Cedis Norte", fecha: "2023-10-25", estado: "En Tránsito" },
  { id: "PED-002", cliente: "Global Tech", ruta: "Puerto -> Cedis Sur", fecha: "2023-10-26", estado: "Pendiente" },
  { id: "PED-003", cliente: "BioFoods SA", ruta: "Agro Sur -> Mercado Central", fecha: "2023-10-24", estado: "Entregado" },
];

export const mockFlota = [
  { id: "TRK-01", placa: "ABC-123", capacidad: "30 Ton", estado: "Disponible", conductor: "Juan Pérez" },
  { id: "TRK-02", placa: "XYZ-987", capacidad: "15 Ton", estado: "En ruta", conductor: "María Gómez" },
  { id: "TRK-03", placa: "LMN-456", capacidad: "30 Ton", estado: "Mantenimiento", conductor: "-" },
];

export const mockUsuarios = [
  { id: "USR-001", nombre: "Admin Principal", email: "admin@logiscarbon.com", rol: "Admin", estado: "Activo" },
  { id: "USR-002", nombre: "Juan Operaciones", email: "juan@logiscarbon.com", rol: "Operaciones", estado: "Activo" },
  { id: "USR-003", nombre: "Gerencia General", email: "gerencia@logiscarbon.com", rol: "Gerencia", estado: "Activo" },
  { id: "USR-004", nombre: "Cliente Demo", email: "cliente@acme.com", rol: "Cliente", estado: "Activo" },
];

export const mockTrazabilidad = {
  pedidoId: "PED-001",
  hitos: [
    { id: 1, fecha: "2023-10-25 08:00 AM", evento: "Pedido registrado", tipo: "success", completado: true },
    { id: 2, fecha: "2023-10-25 09:30 AM", evento: "Unidad asignada (TRK-02)", tipo: "success", completado: true },
    { id: 3, fecha: "2023-10-25 11:15 AM", evento: "Carga completada", tipo: "success", completado: true },
    { id: 4, fecha: "2023-10-25 02:00 PM", evento: "Incidencia: Retraso por tráfico en KM 45", tipo: "warning", completado: true },
    { id: 5, fecha: "Pendiente", evento: "Llegada al destino", tipo: "pending", completado: false },
  ]
};

export const mockGetTrazabilidad = (pedidoId: string) => {
  const pedido = mockPedidos.find(p => p.id === pedidoId);
  
  if (!pedido) return null;
  
  if (pedido.id === "PED-001") {
    return mockTrazabilidad;
  }
  
  if (pedido.estado === "Pendiente") {
    return {
      pedidoId: pedido.id,
      hitos: [
        { id: 1, fecha: pedido.fecha + " 08:00 AM", evento: "Pedido registrado", tipo: "success", completado: true },
        { id: 2, fecha: "Pendiente", evento: "Asignación de unidad", tipo: "pending", completado: false },
        { id: 3, fecha: "Pendiente", evento: "Llegada al destino", tipo: "pending", completado: false },
      ]
    };
  }

  if (pedido.estado === "Entregado") {
    return {
      pedidoId: pedido.id,
      hitos: [
        { id: 1, fecha: pedido.fecha + " 08:00 AM", evento: "Pedido registrado", tipo: "success", completado: true },
        { id: 2, fecha: pedido.fecha + " 09:30 AM", evento: "Unidad asignada (TRK-01)", tipo: "success", completado: true },
        { id: 3, fecha: pedido.fecha + " 10:15 AM", evento: "Carga completada", tipo: "success", completado: true },
        { id: 4, fecha: pedido.fecha + " 04:30 PM", evento: "Llegada al destino", tipo: "success", completado: true },
        { id: 5, fecha: pedido.fecha + " 06:00 PM", evento: "Descarga y confirmación", tipo: "success", completado: true },
      ]
    };
  }
  
  return {
    pedidoId: pedido.id,
    hitos: [
      { id: 1, fecha: pedido.fecha + " 08:00 AM", evento: "Pedido registrado", tipo: "success", completado: true },
      { id: 2, fecha: "Pendiente", evento: "En tránsito", tipo: "pending", completado: false },
    ]
  };
};