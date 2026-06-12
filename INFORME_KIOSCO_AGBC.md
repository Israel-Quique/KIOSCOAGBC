# INFORME DE USO DEL KIOSCO AGBC (USUARIO NO TECNICO)

Fecha: 8 de mayo de 2026  
Pasante: ____________________

## 1. Introduccion

El sistema **KIOSCO AGBC** es una interfaz de autoservicio de Correos de Bolivia que centraliza accesos a servicios postales digitales desde una sola pantalla.

Su objetivo es que una persona sin conocimientos tecnicos pueda:
- Rastrear correspondencia.
- Consultar tarifas postales.
- Registrar o consultar reclamos.
- Acceder al formulario de declaracion aduanera.

Usuarios esperados:
- Cliente/ciudadano que usa el kiosco por cuenta propia.
- Operador de atencion que orienta al cliente cuando tiene dudas.
- Personal administrativo/supervision que verifica disponibilidad del kiosco.

## 2. Acceso al sistema

Forma de acceso:
1. Abrir un navegador web en el equipo del kiosco.
2. Ingresar a la URL local donde se despliega el kiosco (por ejemplo `http://localhost/.../index.html`).
3. Esperar la carga del panel principal.

Observacion importante:
- En la version revisada, **no existe pantalla de inicio de sesion** dentro del kiosco.
- El acceso a servicios se hace directamente desde tarjetas en la pantalla principal.

## 3. Descripcion de la interfaz principal

Captura sugerida: pantalla completa del panel principal (`index2.html`) con las 4 tarjetas visibles.

Elementos principales:
- **Encabezado superior**:
  - Logo institucional.
  - Titulo dinamico del servicio activo.
  - Boton `Inicio` (icono casa): retorna al panel principal.
  - Boton `Volver` (icono flecha): sale del servicio actual y vuelve al panel.
- **Area central**:
  - Tarjeta 1: Rastreo de correspondencia.
  - Tarjeta 2: Calculadora postal.
  - Tarjeta 3: Sistema de reclamos Correos.
  - Tarjeta 4: Kiosco aduana.
- **Comportamiento visual**:
  - Al pasar el cursor, la tarjeta rota y muestra QR.
  - Al hacer clic, la tarjeta se marca, vibra y abre el servicio.

## 4. Flujos de uso por rol

### 4.1 Rol: Cliente/Ciudadano (autoservicio)

#### Funcion A: Rastrear correspondencia
Captura de pantalla: tarjeta "Rastreo de correspondencia" y luego pantalla del rastreo.

Descripcion:
Permite consultar el estado de un envio postal usando el sistema TrackingBO.

Pasos:
1. Ubicar la tarjeta **Rastreo de correspondencia**.
2. Hacer clic sobre la tarjeta.
3. Esperar a que cargue el servicio de rastreo.
4. Ingresar codigo de seguimiento en la pagina del servicio.

Resultado esperado:
- Se muestra el historial/estado del envio.
- Si no carga, aparece mensaje de indisponibilidad temporal.

#### Funcion B: Consultar calculadora postal
Captura de pantalla: tarjeta "Calculadora postal" y pantalla de cotizacion.

Descripcion:
Permite estimar costos de envio segun origen, destino y tipo de correspondencia.

Pasos:
1. Hacer clic en **Calculadora postal**.
2. Esperar carga del servicio.
3. Completar los campos solicitados.
4. Ejecutar la consulta de tarifa.

Resultado esperado:
- El sistema muestra la tarifa estimada.

#### Funcion C: Registrar/consultar reclamo
Captura de pantalla: tarjeta "Sistema de reclamos Correos" y formulario de contacto/reclamo.

Descripcion:
Permite registrar incidencias relacionadas con servicios postales.

Pasos:
1. Hacer clic en **Sistema de reclamos Correos**.
2. Esperar carga del formulario.
3. Completar los datos solicitados.
4. Enviar el reclamo.

Resultado esperado:
- Se registra el reclamo y el sistema muestra confirmacion (segun respuesta del servicio externo).

#### Funcion D: Declaracion aduanera
Captura de pantalla: tarjeta "Kiosco aduana" y formulario de declaracion.

Descripcion:
Permite abrir el formulario aduanero para envios internacionales.

Pasos:
1. Hacer clic en **Kiosco aduana**.
2. Esperar carga del sitio.
3. Completar la declaracion con los datos solicitados.

Resultado esperado:
- El usuario puede iniciar o completar su declaracion.

### 4.2 Rol: Operador de atencion

#### Funcion A: Guiar al usuario al servicio correcto
Captura de pantalla: panel principal con tarjeta seleccionada.

Descripcion:
El operador orienta al cliente a seleccionar el modulo adecuado.

Pasos:
1. Preguntar al cliente que tramite necesita.
2. Identificar la tarjeta correspondiente.
3. Indicar al cliente que haga clic.
4. Verificar que la pagina cargue correctamente.

Resultado esperado:
- El cliente ingresa al modulo correcto sin asistencia tecnica.

#### Funcion B: Recuperar la pantalla inicial
Captura de pantalla: botones `Inicio` y `Volver` del encabezado.

Descripcion:
Permite salir de un servicio y regresar al menu principal.

Pasos:
1. Si el usuario quedo en una pagina no deseada, presionar `Volver`.
2. Si se requiere reinicio total de navegacion, presionar `Inicio`.
3. Esperar animacion de retorno al panel principal.

Resultado esperado:
- Se restaura la pantalla con las 4 tarjetas del kiosco.

### 4.3 Rol: Administrador / supervision operativa

#### Funcion A: Verificar disponibilidad del kiosco
Captura de pantalla: estado de carga o mensaje de error visible.

Descripcion:
Permite comprobar si los servicios externos responden desde el kiosco.

Pasos:
1. Probar cada tarjeta (rastreo, calculadora, reclamos, aduana).
2. Esperar hasta 10 segundos por modulo.
3. Registrar modulos que cargan y modulos con error.

Resultado esperado:
- Lista de servicios operativos y no operativos para reporte diario.

#### Funcion B: Validar mensajes de error para reporte
Captura de pantalla: mensaje "no disponible por ahora".

Descripcion:
Cuando un servicio falla, el kiosco muestra un mensaje orientativo.

Pasos:
1. Intentar abrir el servicio con falla.
2. Capturar pantalla del mensaje mostrado.
3. Registrar fecha, hora y servicio afectado.
4. Escalar al area tecnica si persiste.

Resultado esperado:
- Evidencia documentada para seguimiento tecnico.

## 5. Mensajes del sistema y accion recomendada

### 5.1 "Cargando servicio..."
Significado:
- El kiosco esta esperando respuesta del servicio externo.

Que hacer:
1. Esperar unos segundos.
2. Si tarda demasiado, usar `Volver` o `Inicio`.
3. Reintentar una vez.

### 5.2 "[Servicio]: no disponible por ahora"
Significado:
- El modulo externo no respondio o no pudo mostrarse dentro del kiosco.

Que hacer:
1. Regresar al inicio.
2. Reintentar despues de 1-2 minutos.
3. Si persiste, informar al operador o soporte.

### 5.3 "No pudimos abrir este servicio por el momento"
Significado:
- Error general de carga del modulo.

Que hacer:
1. Presionar `Volver`.
2. Intentar nuevamente.
3. Si continua, registrar evidencia (captura + hora).

### 5.4 Pantalla en blanco o sin contenido
Significado:
- Posible bloqueo/caida parcial del servicio embebido.

Que hacer:
1. Presionar `Inicio`.
2. Abrir otro modulo para validar conexion.
3. Reportar al responsable si se repite.

## 6. Preguntas frecuentes (FAQ)

1. **No abre el servicio al hacer clic, que hago?**  
Esperar hasta 10 segundos. Si no carga, presionar `Inicio` y volver a intentar.

2. **Me equivoque de modulo, como regreso?**  
Usar `Volver` para salir del modulo actual o `Inicio` para volver directo al panel principal.

3. **El sistema muestra "no disponible por ahora", significa que hice algo mal?**  
No necesariamente. Generalmente es una caida temporal del servicio externo. Reintentar mas tarde.

4. **Puedo seguir usando el kiosco si falla un modulo?**  
Si. Puedes volver al panel principal y usar los otros modulos que si esten disponibles.

5. **Si el usuario no entiende que modulo elegir, como lo ayudamos rapido?**  
Aplicar esta guia:
- Seguimiento de envio -> Rastreo de correspondencia.
- Calcular costo -> Calculadora postal.
- Queja o incidencia -> Sistema de reclamos.
- Tramite internacional -> Kiosco aduana.

6. **Hay que iniciar sesion para usar el kiosco?**  
En la version evaluada no. El acceso es directo desde la pantalla principal.

---

## 7. Evidencias recomendadas para anexar

Para cumplir la rubricа, adjuntar como minimo:
1. Captura del panel principal etiquetado por secciones.
2. Captura de cada funcion (4 modulos).
3. Captura del uso de `Inicio` y `Volver`.
4. Captura de al menos 2 mensajes del sistema (carga y error).
5. Captura de FAQ aplicada a un caso real (opcional, suma claridad).

Archivos de imagen disponibles en esta carpeta que puedes reutilizar como evidencia:
- `RASTREO.png`, `CALCULO.png`, `RECLAMO2.png`, `DECLARACION2.png`
- `correos2.png`, `KIOSCO.png`, `TRACKINGBO.png`
