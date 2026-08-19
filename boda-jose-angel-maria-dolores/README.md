# Invitación de Boda — Landing Page

Landing page elegante para invitaciones de boda con confirmación de asistencia.

## Contenido incluido

- **Hero** — Fecha, nombres, lugar
- **Detalles del evento** — Horario, dress code
- **Nuestra historia** — Sección personalizable
- **Ubicación** — Dirección + mapa interactivo
- **Confirmación de asistencia** — Formulario RSVP

## Cómo usar

1. Abre `index.html` en el navegador (doble clic o arrastra al navegador).
2. Para evitar restricciones de CORS en el mapa, sirve los archivos con un servidor local:
   ```bash
   npx serve .
   # o: python -m http.server 8000
   ```
3. Personaliza nombres, fechas, lugar y coordenadas del mapa en `index.html`.

## Personalización del mapa

Para cambiar la ubicación del mapa:

1. Ve a [OpenStreetMap](https://www.openstreetmap.org) y busca tu lugar.
2. Haz clic en "Compartir" → "Incorporar" y copia la URL del iframe.
3. Sustituye el atributo `src` del iframe en la sección de ubicación.

O usa [Google Maps](https://maps.google.com) → Compartir → Incorporar un mapa y reemplaza el iframe.

## Formulario y Google Sheets

El formulario envía los datos por `POST` a Google Apps Script, que:

1. **Guarda cada respuesta** en la hoja de cálculo vinculada.
2. **Envía un correo** al email del invitado con una copia de su confirmación (desde **invitacionesboda.es@gmail.com**).

La URL del Web App está en `script.js` → `RSVP_SCRIPT_URL`.

### Configurar Apps Script (una vez)

1. Inicia sesión en Google con **invitacionesboda.es@gmail.com** (cuenta que envía las confirmaciones) y abre la hoja de asistencia.
2. **Extensiones → Apps Script**.
3. Sustituye todo `Code.gs` por el contenido de `google-apps-script-rsvp.gs`.
4. Guarda. Ejecuta `doGet` o `doPost` una vez y **autoriza** permisos (Hojas de cálculo y Gmail).
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **yo**
   - Acceso: **Cualquier persona**
6. Si la URL cambia, actualízala en `RSVP_SCRIPT_URL` dentro de `script.js`.

Al abrir la URL `/exec` en el navegador verás un mensaje de estado (`doGet`). El formulario usa `doPost`.

### Columnas de la hoja (fila 1)

Pega estas **15 cabeceras** en la fila 1, de la columna A a la O (en este orden):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fecha_envio` | `nombre` | `email` | `asistencia` | `asistencia_label` | `tipo_grupo` | `acompanantes` | `ninos` | `total_invitados` | `nombres_acompanantes` | `sin_alergias` | `alergias_seleccionadas` | `alojamiento` | `cancion` | `mensaje` |

**Qué guarda cada una**

| Columna | Contenido |
|---------|-----------|
| `fecha_envio` | Fecha/hora del envío |
| `nombre` / `email` | Quién confirma |
| `asistencia` | `si` o `no` |
| `asistencia_label` | `Asistirá` / `No asistirá` |
| `tipo_grupo` | `Solo/a` o `Con acompañantes` (vacío si no asiste) |
| `acompanantes` / `ninos` / `total_invitados` | Recuento de personas |
| `nombres_acompanantes` | Lista de acompañantes (ej. `Ana (adulto); Luis (niño)`) |
| `sin_alergias` | `Sí` / `No` |
| `alergias_seleccionadas` | Detalle de alergias o «No tengo ninguna» |
| `alojamiento` | `Sí` / `No` (vacío si no asiste) |
| `cancion` / `mensaje` | Opcionales |

Se eliminaron las columnas duplicadas `lista_invitados` (igual que `nombres_acompanantes`) y `alergia` (igual que `alergias_seleccionadas`).

**Cómo dejar la fila 1 en Google Sheets**

1. **Hoja nueva o sin datos:** deja la celda **A1 vacía**. Tras pegar el `.gs` actualizado y enviar una confirmación de prueba, el script escribe la fila 1 automáticamente.
2. **Ya tienes 16 columnas antiguas:** en la fila 1, borra las columnas **`lista_invitados`** y **`alergia`** (o elimina esas dos columnas enteras del libro) y comprueba que el orden coincida con la tabla de arriba. Los datos antiguos en esas columnas eran copia de J y L; no se pierde información útil si J y L ya estaban rellenas.
3. **Más simple:** crea una pestaña nueva (ej. `Confirmaciones`), deja **A1 vacía**, y en `google-apps-script-rsvp.gs` pon `sheetName: 'Confirmaciones'` en `RSVP_CONFIG`.
4. Tras cambiar el script en Google: **Implementar → Administrar implementaciones → Editar → Nueva versión** (o nueva implementación) para que `doPost` use las 15 columnas.

### Borrar datos en la hoja

Tras instalar el script anterior, al recargar la hoja aparece el menú **Boda → Borrar datos insertados**.

(El archivo `google-sheets-borrar-datos.js` queda obsoleto; la lógica está integrada en `google-apps-script-rsvp.gs`.)

## Estructura

```
src/
├── index.html                      # Contenido principal
├── styles.css                      # Estilos
├── script.js                       # Interactividad y formulario
├── google-apps-script-rsvp.gs      # Código completo para Apps Script (hoja + email)
├── google-sheets-borrar-datos.js   # (legacy) Solo menú borrar; usar .gs anterior
└── README.md                       # Esta guía
```
