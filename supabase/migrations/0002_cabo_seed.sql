-- =====================================================================
-- CABO VÍRGENES — Seed de arranque (idempotente; on conflict do nothing).
-- Refleja el contenido por defecto del sitio para que /api/public devuelva
-- contenido real desde el día 0. No pisa ediciones posteriores del admin.
-- =====================================================================

-- Ajustes del sitio (singleton)
insert into cv_settings (key, value) values
  ('site', '{"newsEnabled": false, "jobsEnabled": false, "whatsappEnabled": false, "email": "info@cabovirgenes.com", "phone": "+54 280 4495000"}'::jsonb)
on conflict (key) do nothing;

-- Equipo (6 directivos reales)
insert into cv_team (member_key, name, role, area, photo, bio, sort_order) values
  ('basavilbaso','Juan Pablo Basavilbaso','Gerente General','Estrategia · Operación','/team-1.jpg','Contador Público con más de 20 años en la industria pesquera argentina. Conduce la estrategia y la operación de Cabo Vírgenes.',1),
  ('regueiro','Matías Regueiro','Gerente de Operaciones','Flota · Plantas','/team-2.jpg','Responsable de la operación pesquera e industrial: flota, plantas y cadena de frío, de la captura al producto terminado.',2),
  ('abizeid','Diego Abizeid','Gerente de Administración y Finanzas','Finanzas · Control','/team-3.jpg','Conduce la administración, las finanzas y el control de gestión que sostienen la inversión en flota y plantas.',3),
  ('tamagnini','Romina Tamagnini','Gerente de Recursos Humanos','Personas · Cultura','/team-4.jpg','Lidera la gestión de personas: talento, seguridad y cultura de trabajo en Argentina y España.',4),
  ('ortiz','Gastón Ortiz','Gerente Comercial','Comercial · Exportación','/team-5.jpg','Dirige la estrategia comercial y la exportación del langostino austral a más de 40 países.',5),
  ('iglesias','Antonio Iglesias','Gerente España','Valor agregado · Logística','/team-6.jpg','Responsable de la plataforma de España (Palencia): valor agregado, logística y distribución.',6)
on conflict (member_key) do nothing;

-- Noticias de muestra
insert into cv_news (slug, title, excerpt, category, news_date, status, image, sort_order) values
  ('cabo-virgenes-aisa-group','Cabo Vírgenes se incorpora a AISA Group','La pesquera refuerza su posicionamiento internacional al integrarse al holding AISA Group, consolidando su estructura binacional Argentina–España.','Corporativo','2025-01-15','published','/esp-1.jpg',1),
  ('temporada-langostino-austral','Arranca la temporada de langostino austral','La flota inicia operaciones en el Atlántico Sudoccidental (FAO 41) con buenas previsiones de captura para la nueva campaña.','Flota','2026-03-03','published','/esmeralda-2.jpg',2),
  ('avances-certificacion-msc','Avances hacia la certificación MSC','Cabo Vírgenes continúa el proceso de certificación de pesquería sostenible y refuerza su programa ambiental junto a RASA.','Sostenibilidad','2026-05-20','draft','/rasa-salicornias.jpg',3)
on conflict (slug) do nothing;

-- Layout de la página de noticias (singleton)
insert into cv_pages (slug, layout) values ('noticias', '{"hero":"","items":[]}'::jsonb)
on conflict (slug) do nothing;
