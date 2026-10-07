IMPORTANTE

Este documento representa el estado del proyecto antes de implementar
las observaciones funcionales.

No volver a analizar todo el repositorio salvo que sea estrictamente necesario.

Reglas:
- No rehacer módulos existentes.
- No cambiar la arquitectura actual.
- No instalar dependencias innecesarias.
- No modificar migraciones anteriores.
- No modificar autenticación.
- No modificar usuarios.
- Reutilizar Cliente, Pedido, Unidad, Parametro e Incidencia.
- Unidad ya soporta múltiples Pedido[] a nivel de base de datos.
- La limitación de múltiples pedidos está actualmente en UI y lógica.

DECISIONES ADICIONALES FASE 1.1

1. Viaje.factorEmisionAplicado Float? guarda como snapshot el
   factor de emisión utilizado para calcular el CO2.

2. Un Viaje solo puede pasar a CERRADO cuando todos sus pedidos
   estén ENTREGADO. No existe cierre manual en este alcance.

3. Solo un Viaje PLANIFICADO puede agregar o quitar pedidos.
   Una vez EN_RUTA, la composición de carga queda bloqueada.

4. Pedidos nuevos:
   - destinatarioNombre obligatorio y no vacío
   - destinatarioDireccion obligatoria y no vacía
   - pesoKg > 0
   - cantidadUnidades entero > 0
   - origenId != destinoId
   - destinatarioTelefono opcional
   - factorPesoVol se conserva solo por compatibilidad y no será
     obligatorio para pedidos nuevos.