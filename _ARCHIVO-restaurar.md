# Archivo — cambios temporales a restaurar

Dos elementos se ocultaron temporalmente del sitio público. Nada se borró: aquí
está todo para **volver a activarlos** en un paso. (También se puede revertir el
commit correspondiente con `git revert`, o pedírmelo y lo hago yo.)

---

## 1. Buque "Santiago I"  — *restaurar el martes*

Se quitó de la web pública y la flota quedó en **5 buques** (3 fresqueros + 2 factoría).
Para volver a **6 buques** con el Santiago I, deshacer estos cambios:

**`index.html`**
- Flota (hero): `5 buques operando` → `6 buques operando`; `2 buques factoría` → `3 buques factoría`.
- Flota (KPI): `<strong>5</strong><span>Buques propios</span>` → `6`; `<strong>2</strong><span>Factoría</span>` → `3`.
- Empresa (KPI hero): `data-count="5"` (buques propios) → `6`.
- Tarjeta "Trabajá con nosotros": `2 plantas · 5 buques` → `... · 6 buques`.
- Modal "Pesca responsable": `5 buques propios operando…` → `6 buques propios…`;
  `Mar Esmeralda (53 m) y Kaleu Kaleu (56 m) procesan…` → `Mar Esmeralda (53 m), Kaleu Kaleu (56 m) y Santiago I procesan…`.
- Modal "Flota completa": `5 buques, una sola promesa.` → `6 buques, una sola promesa.`;
  `(Mar Esmeralda, Kaleu Kaleu)` → `(Mar Esmeralda, Kaleu Kaleu, Santiago I)`;
  stat `<strong>5</strong><span>Buques</span>` → `6`.
- Modal planta Rawson: `Buques operando … 5` → `6`.
- Modal "Quiénes somos" (empresa-full): `<strong>5</strong><span>Buques propios</span>` → `6`.

**`netlify/functions/chatbot.mjs`** (prompt del asistente)
- `5 buques propios. … Mar Esmeralda (53 m), Kaleu Kaleu (56 m).` →
  `6 buques propios. … Mar Esmeralda (53 m), Kaleu Kaleu (56 m), Santiago I.`

> Tras editar, **republicar** (push a `main` o `netlify deploy --prod`).
> El diccionario i18n ya tiene las versiones "6 buques" de cuando estaba activo;
> si algo quedara en español, se re-traduce solo en runtime.

---

## 2. Botón de WhatsApp — *desactivado por el momento*

El markup de WhatsApp **sigue en la página**; sólo está oculto. Hay dos formas de reactivarlo:

- **Global (para todos los visitantes):** en `app.js`, cambiar
  `const CV_WHATSAPP_DEFAULT = false;` → `= true;` y **republicar**.
- **Desde el admin:** *Ajustes → "Mostrar WhatsApp en la web"* (escribe
  `cv_settings.whatsappEnabled`). Efectivo en ese navegador / vista previa; para
  que afecte a todos los visitantes hay que republicar con el default en `true`.

Elementos afectados (se ocultan/muestran solos según el flag):
- Botón "Hablar por WhatsApp" del formulario de contacto (`.btn-action-wa`).
- Enlace de WhatsApp del chat (`.ac-wa`) y "¿Prefieres WhatsApp?".
- Menciones de WhatsApp en el asistente (chatbot) — el prompt no lo nombra mientras esté OFF.
