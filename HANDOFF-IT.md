# Cabo Vírgenes — Puesta en producción (handoff para IT)

> Documento operativo para dejar la web **lista en su dominio real** con todas las
> funciones (IA, formulario de contacto, suscriptores, boletines). No contiene
> secretos: las claves se gestionan en Netlify y en el `.env` local (git-ignored).

---

## 0. Estado actual

| Concepto | Valor |
|---|---|
| Repositorio | GitHub `cancoretamero/cabo-virgenes-web` |
| Deploy | **Automático**: cada *push* a `main` despliega en Netlify |
| Sitio Netlify | `cabo-virgenes-web` · id `37d413ca-5e72-4695-9492-2d4632847625` |
| URL temporal | https://cabo-virgenes-web.netlify.app |
| Backend | Netlify Functions (`netlify/functions/*.mjs`), almacenamiento Netlify Blobs |
| IA (chatbot) | **Operativa** (Claude). Variables ya configuradas en Netlify |

> ⚠️ La CLI de Netlify en la carpeta estaba mal enlazada a *minas-argentinas*; ya se
> corrigió y apunta a `cabo-virgenes-web`. No desplegar Cabo desde otra carpeta.

---

## 1. Dominio y DNS  ← *lo más importante*

Objetivo: servir la web en **cabovirgenes.com** (apex + www) con HTTPS.

**En Netlify** (Site → Domain management → Add a domain): añadir `cabovirgenes.com`.
Netlify emite el certificado SSL (Let's Encrypt) automáticamente.

**En el registrador del dominio** — dos opciones:

- **Opción A (recomendada, más simple): usar Netlify DNS.**
  Cambiar los *nameservers* del dominio por los que indique Netlify
  (tipo `dns1.p0X.nsone.net`…). Netlify gestiona todo (apex, www, SSL).

- **Opción B: mantener el DNS actual y añadir registros:**
  | Tipo | Nombre | Valor |
  |---|---|---|
  | A | `@` (apex) | `75.2.60.5` |
  | CNAME | `www` | `cabo-virgenes-web.netlify.app` |
  *(Si el registrador soporta ALIAS/ANAME en el apex, usar `apex-loadbalancer.netlify.com` en vez del registro A.)*

> ⚠️ **No tocar los registros `MX`** si ya existe correo `@cabovirgenes.com`
> (cambiar A/CNAME no afecta a la recepción de email; los MX sí).

---

## 2. Buzones de correo

La web enlaza estas direcciones con `mailto:`. Deben **existir** (o redirigir a un buzón real):

| Dirección | Uso en la web | Estado |
|---|---|---|
| `info@cabovirgenes.com` | General + comercial (tarjeta "Comercial", chatbot, footer) | **En uso** |
| `prensa@cabovirgenes.com` | Tarjeta "Prensa" | Crear / confirmar |
| `rrhh@cabovirgenes.com` | "Trabajá con nosotros" / empleo | Crear / confirmar |
| `legal@cabovirgenes.com` | Modal legal / privacidad | Crear / confirmar |
| `privacidad@cabovirgenes.com` | Política de privacidad | Crear / confirmar |
| `comercial@cabovirgenes.com` | *(hoy la web usa `info@`)* | Opcional: si se crea, avisar para volver a separarlo |

---

## 3. Resend — envío real de Boletines

El módulo Boletines del admin compone y registra los envíos; para **enviar emails de
verdad** necesita Resend:

1. Crear cuenta en **resend.com** (gratis hasta 3.000 emails/mes).
2. **Verificar el dominio de envío** (`cabovirgenes.com`): Resend da unos registros
   DNS (TXT de SPF/DKIM/DMARC + un CNAME). Añadirlos en el DNS del punto 1.
   *(No afecta a la recepción de correo; son registros de envío.)*
3. Definir la **dirección remitente** (sugerido: `boletin@cabovirgenes.com`).
4. Generar la **API key** (`re_…`) y configurarla en Netlify (punto 4).

---

## 4. Variables de entorno en Netlify

(Site → Settings → Environment variables, en el sitio `cabo-virgenes-web`.)

**Ya configuradas** (no tocar):
- `ANTHROPIC_API_KEY` — clave de Claude (IA). *(Conviene rotarla, ver §5.)*
- `CLAUDE_MODEL` = `claude-haiku-4-5-20251001`
- `CABO_ADMIN_USER` = `admin`
- `CABO_ADMIN_TOKEN` — contraseña maestra del admin *(entregada aparte)*.

**Pendientes** (cuando estén Resend y el dominio):
- `RESEND_API_KEY` = `re_…`
- `RESEND_FROM` = `Cabo Vírgenes <boletin@cabovirgenes.com>`
- `APP_BASE_URL` = `https://cabovirgenes.com`

**Opcionales** (solo si se decide usar Supabase en vez de Netlify Blobs):
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`

> Tras añadir o cambiar variables → **re-desplegar** (Deploys → Trigger deploy).

---

## 5. Seguridad

- **Rotar la API key de Claude** (se compartió en texto plano): crear una nueva en
  console.anthropic.com, actualizar `ANTHROPIC_API_KEY` en Netlify y desactivar la vieja.
- El fichero `.env` **no está en el repositorio** (`.gitignore`). Los secretos de
  producción viven en las variables de entorno de Netlify.
- `/admin/*` lleva cabecera `noindex, nofollow`.

---

## 6. Verificaciones tras publicar en el dominio final

- [ ] `https://cabovirgenes.com` y `https://www.cabovirgenes.com` cargan con candado (SSL).
- [ ] Los `mailto:` abren el cliente con la dirección correcta (info, prensa, rrhh, legal).
- [ ] Formulario de contacto: "Enviar consulta" y "Hablar por WhatsApp" funcionan.
- [ ] Chatbot responde (IA) — esquina inferior derecha.
- [ ] Boletines: enviar una prueba real (tras configurar Resend).

---

## 7. Decisiones pendientes (negocio / diseño, no técnicas)

- **Buque "Santiago I"**: confirmar si se nombra públicamente (hoy figura en la flota → 6 buques).
- **WhatsApp**: hoy figura como "no disponible". Los botones `wa.me/542804495000` se
  mantienen — confirmar si se dejan o se quitan.
- **Fotos de producto** (HOSO/HLSO/EZP): homogeneizar el color (más parecido al HLSO).
  Es retoque fotográfico, no de código — se necesita la imagen corregida.
