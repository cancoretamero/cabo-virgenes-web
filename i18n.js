// ============================================================
// i18n + AI Translation Pipeline
// 1) Dictionary manual (rápido, exacto) para textos comunes ES → EN/FR/PT/ZH
// 2) AI fallback con @xenova/transformers (Apache 2.0) para los no mapeados
// Recorre TODO el contenido visible: títulos, párrafos, CTAs, modales, etc.
// ============================================================

// ----- Selectores de elementos traducibles -----
const SELECTORS = [
  'h1','h2','h3','h4','h5',
  '.eyebrow','.hero-copy','.lead','.muted',
  '.btn > span:not(.btn-arrow):not(.play-ring)','.play-btn .play-label',
  '.more-link',
  '.kpi-label','.kpi-title','.kpi-card > p',
  '.kpi-strip span',
  '.v-tag','.v-body p',
  '.format-card h3','.format-sub','.format-desc',
  '.tech-card h4','.tech-card dl dt','.tech-card dl dd',
  '.tech-card ul li','.tech-card .cls span',
  '.ship-type','.ship-card p','.ship-foot',
  '.plant-tag','.plant-list li',
  '.quality-card p',
  '.sustain-card p',
  '.contact-left p','.addresses strong','.addresses span',
  '.contact-form label > span','.contact-form button > span:not(.btn-arrow)',
  '.info-item h4','.info-item p',
  '.footer h5','.footer a','.footer span','.footer p',
  '.drawer nav a','.drawer-foot span',
  '.rail-label',
  '.info-shell p','.info-shell ul.modal-stats span',
  '.navpill a',
  '.team-filter .tf','.member__role','.member__bio','.member__more',
  '.tm-role','.tm-meta span','.tm-meta strong',
  '.ship-desc','.spec-tx span','.spec-tx strong','.spec-highlight p',
  '.lang-ai-hint span','.copy-btn','.mail-pill span:not(.copy-btn)',
];

// ----- Dictionary manual (ES → EN/FR/PT/ZH) -----
const dict = {
  en: {
    // Nav + general
    'Empresa':'Company','Productos':'Products','Sostenibilidad':'Sustainability',
    'Calidad':'Quality','Plantas':'Plants','Flota':'Fleet','Contacto':'Contact',
    'Equipo':'Team','NUESTRO EQUIPO':'OUR TEAM','Todos':'All','Dirección':'Management','Operaciones':'Operations','Comercial':'Sales','Ver perfil':'View profile','Enfoque':'Focus','Base':'Base','Alcance':'Reach','Certifica':'Certifies',
    'DESLIZA PARA EXPLORAR':'SCROLL TO EXPLORE','VOLVER AL INICIO':'BACK TO TOP',
    'Reproducir video corporativo':'Play corporate video',
    'Más sobre nosotros':'More about us','Más sobre Cabo Vírgenes':'More about Cabo Vírgenes',
    'Traducción IA con Transformers.js':'AI translation with Transformers.js',

    // Hero
    'ORIGEN. CALIDAD. CONFIANZA.':'ORIGIN. QUALITY. TRUST.',
    'Del Atlántico Sur al mundo.':'From the South Atlantic to the world.',
    'Pesca, procesamiento y exportación de productos del mar, con operaciones en Argentina y España. Cadena verticalmente integrada y trazabilidad total.':
      'Fishing, processing and export of seafood, with operations in Argentina and Spain. Vertically integrated supply chain and full traceability.',
    'Contactar al equipo':'Contact the team','Conocer la empresa':'Discover the company',

    // KPI hero
    'países':'countries','PAÍSES':'COUNTRIES',
    'América, Europa, Asia y África. Exportamos en 5 continentes.':
      'Americas, Europe, Asia and Africa. We export across 5 continents.',
    'Argentina y España':'Argentina & Spain',
    'Base productiva en Patagonia, plataforma logística en Palencia.':
      'Productive base in Patagonia, logistics hub in Palencia.',
    'Cadena integrada':'Integrated chain',
    'Captura, procesamiento, almacenamiento y comercialización propios.':
      'Owned catching, processing, storage and commercialization.',
    'Productos premium':'Premium products',
    'Langostino austral salvaje (Pleoticus muelleri) en múltiples formatos.':
      'Wild Patagonian shrimp (Pleoticus muelleri) in multiple formats.',

    // Empresa
    'QUIÉNES SOMOS':'WHO WE ARE','Estructura binacional, visión global.':'Binational structure, global vision.',
    'FUNDACIÓN':'FOUNDED','PAÍSES DESTINO':'DESTINATION COUNTRIES','BUQUES PROPIOS':'OWN VESSELS','CONTINENTES':'CONTINENTS',
    'fundación':'founded','países destino':'destination countries','buques propios':'own vessels','continentes':'continents',
    'FLOTA':'FLEET','PRODUCTO':'PRODUCT','PRESENCIA GLOBAL':'GLOBAL PRESENCE','TRAZABILIDAD':'TRACEABILITY','SOSTENIBILIDAD':'SUSTAINABILITY',
    'Pesca responsable':'Responsible fishing',
    'Buques propios bajo estrictas normas de conservación del Mar Argentino.':
      'Own vessels under strict conservation rules of the Argentine Sea.',
    'Langostino austral salvaje':'Wild Patagonian shrimp',
    'Pleoticus muelleri capturado en el Atlántico sudoccidental (FAO 41).':
      'Pleoticus muelleri caught in the southwest Atlantic (FAO 41).',
    '40+ países en 5 continentes':'40+ countries across 5 continents',
    'Estructura binacional Argentina–España con presencia en mercados premium.':
      'Argentina–Spain binational structure with presence in premium markets.',
    'De la captura al puerto: control end-to-end con trazabilidad total.':
      'From catch to port: end-to-end control with full traceability.',
    'Compromiso con el mar':'Commitment to the sea',
    'Vedas, cuotas y mejora continua. Pesquería gestionada y certificada.':
      'Closed seasons, quotas and continuous improvement. Managed and certified fishery.',
    'SOBRE CABO VÍRGENES':'ABOUT CABO VÍRGENES',
    'Estructura binacional, visión global':'Binational structure, global vision',

    // Productos
    'Langostino austral salvaje.':'Wild Patagonian shrimp.',
    'HOSO':'HOSO','HLSO':'HLSO','EZP':'EZP','P&D':'P&D','PDTO':'PDTO',
    'Cabeza con caparazón':'Head-on, shell-on','Caparazón sin cabeza':'Headless, shell-on',
    'Easy peel':'Easy peel','Pelado y desvenado':'Peeled and deveined','Pelado, desvenado, cocido':'Peeled, deveined, cooked',
    'Producto con cabeza y cola enteras, máxima frescura y presentación.':
      'Product with head and tail intact, maximum freshness and presentation.',
    'Sin cabeza, con caparazón completo. Versatilidad culinaria.':
      'Headless, with full shell. Culinary versatility.',
    'Caparazón pre-cortado para pelado rápido en cocina profesional.':
      'Pre-cut shell for fast peeling in professional kitchens.',
    'Listo para cocinar, sin caparazón y sin intestino. Calidad sashimi.':
      'Ready to cook, shell-off and deveined. Sashimi grade.',
    'Cocido y congelado, listo para consumir. IQF individual.':
      'Cooked and frozen, ready to eat. Individual IQF.',
    'Clasificación':'Classification','Calibres por piezas/kg':'Sizes by pieces/kg',
    'Trazabilidad':'Traceability','Origen y captura':'Origin and catch',

    // Flota
    '5 buques operando el Mar Argentino.':'5 vessels operating the Argentine Sea.',
    'Tres fresqueros para procesamiento ágil en planta + dos buques congeladores factoría que procesan a bordo.':
      'Three fresh-fish vessels for agile processing onshore + two freezer factory ships processing aboard.',
    'FRESQUERO':'FRESH-FISH','FACTORÍA':'FACTORY',
    'Espartano':'Espartano','Cristo Redentor':'Cristo Redentor','Iglú I':'Iglú I',
    'Mar Esmeralda':'Mar Esmeralda','Kaleu Kaleu':'Kaleu Kaleu',
    'Puerto Rawson':'Puerto Rawson','A bordo · Atlántico Sur':'On board · South Atlantic',
    'Permiso de pesca en aguas nacionales y provinciales. Capacidad de captura superior a 3.000 toneladas anuales. Opera desde Puerto Rawson.':
      'Fishing permit in national and provincial waters. Catch capacity over 3,000 tonnes per year. Operates from Puerto Rawson.',
    'Opera en aguas nacionales. Procesamiento ágil en planta gracias al ciclo corto de captura-desembarque.':
      'Operates in national waters. Agile onshore processing thanks to short catch-landing cycle.',
    'Opera en aguas nacionales. Mantiene la cadena de frío desde la captura hasta el desembarque.':
      'Operates in national waters. Maintains cold chain from catch to landing.',
    'Tangonero factoría. Congelación diaria de 23 t, bodega de 170 t. Remodelado con una inversión superior a USD 2 M.':
      'Trawler factory. Daily freezing 23 t, hold 170 t. Refurbished with over USD 2M investment.',
    'Tangonero factoría. Congelación diaria de 13 t, bodega de 98 t. Captura, procesa y congela a bordo.':
      'Trawler factory. Daily freezing 13 t, hold 98 t. Catches, processes and freezes aboard.',

    // Plantas
    'Dos continentes, un mismo estándar.':'Two continents, one shared standard.',
    'PUERTO RAWSON':'PUERTO RAWSON','PALENCIA':'PALENCIA','España':'Spain','Argentina':'Argentina',
    'Capacidad: 80 t/día':'Capacity: 80 t/day','Capacidad: 60 t/día':'Capacity: 60 t/day',
    'Cámaras de frío de –25°C':'Cold rooms at –25°C','Cámaras de –25°C':'Cold rooms at –25°C',
    'Laboratorio propio HACCP':'In-house HACCP laboratory',
    'Procesamiento del langostino fresquero':'Fresh shrimp processing',
    'Valor agregado y empaquetado para Europa':'Value-add and packaging for Europe',
    'Centro logístico europeo':'European logistics hub',
    'Punto de distribución a 5 continentes':'Distribution hub to 5 continents',

    // Calidad
    'La calidad empieza en el mar.':'Quality begins at sea.',
    'HACCP':'HACCP','BRCGS':'BRCGS','IFS':'IFS',
    'Análisis de peligros y puntos críticos de control.':'Hazard Analysis and Critical Control Points.',
    'Global Standard for Food Safety.':'Global Standard for Food Safety.',
    'International Featured Standards.':'International Featured Standards.',
    'Trazabilidad total desde captura.':'Full traceability from catch.',

    // Sostenibilidad
    'Responsabilidad de origen.':'Responsibility from origin.',
    'Cuotas y vedas':'Quotas and closures','Eficiencia energética':'Energy efficiency',
    'Reducción de plásticos':'Plastic reduction','Certificación MSC':'MSC certification',
    'Gestión bajo el Consejo Federal Pesquero argentino.':'Managed under the Argentine Federal Fisheries Council.',
    'Inversión continua en flota más eficiente.':'Ongoing investment in a more efficient fleet.',
    'Programas de reducción y reciclaje de envases.':'Programs for packaging reduction and recycling.',
    'En proceso de certificación para captura sostenible.':'In process of certification for sustainable catch.',

    // Contacto
    'Hablemos.':'Let\'s talk.',
    'Sede operativa':'Operational HQ','Plataforma España':'Spain platform',
    'info@cabovirgenes.com':'info@cabovirgenes.com','Copiar':'Copy',
    'NOMBRE':'NAME','EMPRESA':'COMPANY','EMAIL':'EMAIL','MENSAJE':'MESSAGE','Enviar consulta':'Send enquiry',

    // Info bar
    'Email':'Email','Argentina · Patagonia':'Argentina · Patagonia',
    'España · Palencia':'Spain · Palencia','Atención global':'Global support',

    // Footer
    'Pesca, procesamiento y exportación.':'Fishing, processing and export.',
    'Navegación':'Navigation','Operación':'Operations','Legal':'Legal',
    'Política de privacidad':'Privacy policy','Términos':'Terms','Cookies':'Cookies',
    '© Cabo Vírgenes 2026 — Todos los derechos reservados.':
      '© Cabo Vírgenes 2026 — All rights reserved.',

    // Drawer extra
    'Inicio':'Home',
    'info@cabovirgenes.com · +54 280 4495000':'info@cabovirgenes.com · +54 280 4495000',

    // Modal contenidos
    '5 buques propios operando en el Mar Argentino bajo cuotas de captura y vedas reproductivas que protegen la especie.':
      '5 owned vessels operating the Argentine Sea under catch quotas and reproductive closures that protect the species.',
    'Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operan desde Puerto Rawson con ciclo corto captura-desembarque.':
      'Fresh-fish vessels: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operate from Puerto Rawson with short catch-landing cycle.',
    'Congeladores factoría: Mar Esmeralda (53 m) y Kaleu Kaleu (56 m) procesan y congelan a bordo, garantizando frescura desde el origen.':
      'Factory freezers: Mar Esmeralda (53 m) and Kaleu Kaleu (56 m) process and freeze aboard, guaranteeing freshness from origin.',
    'Pleoticus muelleri capturado en aguas frías del Atlántico Sudoccidental (FAO 41). Producto salvaje, sin acuicultura, sin antibióticos.':
      'Pleoticus muelleri caught in the cold waters of the southwest Atlantic (FAO 41). Wild product, no aquaculture, no antibiotics.',
    'Formatos: HOSO, HLSO, EZP, P&D y PDTO. Clasificación: L1, L2, L3, C1, C2, CR según piezas/kg.':
      'Formats: HOSO, HLSO, EZP, P&D and PDTO. Classification: L1, L2, L3, C1, C2, CR by pieces/kg.',
    '40+ países, 5 continentes':'40+ countries, 5 continents',
    'Estructura binacional Argentina–España con base productiva en Patagonia y plataforma logística europea en Palencia.':
      'Argentina–Spain binational structure with productive base in Patagonia and European logistics hub in Palencia.',
    'Exportamos a América, Europa, Asia y África, atendiendo mercados premium con foodservice, retail e industria de procesamiento.':
      'We export to the Americas, Europe, Asia and Africa, serving premium markets across foodservice, retail and processing industry.',
    'Control end-to-end desde la captura hasta el cliente final: barco propio → planta propia → logística propia → exportación directa.':
      'End-to-end control from catch to final customer: own vessel → own plant → own logistics → direct export.',
    'Cada lote es identificado y trazable: zona FAO, embarcación, fecha y planta de procesamiento — cumpliendo EU, FDA, SENASA y certificaciones de mercado.':
      'Each batch is identified and traceable: FAO zone, vessel, date and processing plant — meeting EU, FDA, SENASA and market certifications.',
    'Pesquería gestionada bajo el Consejo Federal Pesquero argentino: cuotas anuales, vedas reproductivas y zonas de protección.':
      'Fishery managed under the Argentine Federal Fisheries Council: annual quotas, reproductive closures and protected zones.',
    'Inversión en eficiencia energética de la flota, reducción de plásticos y mejora continua para certificación MSC.':
      'Investment in fleet energy efficiency, plastic reduction and continuous improvement toward MSC certification.',
    'Estructura binacional, visión global.':'Binational structure, global vision.',
    'Fundada en 2008, Cabo Vírgenes es una empresa pesquera especializada en captura, procesamiento, comercialización y exportación de productos del mar.':
      'Founded in 2008, Cabo Vírgenes is a fishing company specialized in catching, processing, commercializing and exporting seafood.',
    'En enero de 2025 se incorporó a AISA Group, consolidando su posicionamiento en la industria pesquera internacional.':
      'In January 2025 it joined AISA Group, consolidating its positioning in the international fishing industry.',
    'Operación binacional con base productiva en la Patagonia argentina (Puerto Rawson) y plataforma logística y de valor agregado en España (Palencia).':
      'Binational operation with productive base in Argentine Patagonia (Puerto Rawson) and logistics and value-add platform in Spain (Palencia).',
    'Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur — uno de los productos del mar más cotizados a nivel global.':
      'Specialty: Pleoticus muelleri, the wild Patagonian shrimp of the South Atlantic — one of the most prized seafood products globally.',

    // Sección empresa (texto largo)
    'Cabo Vírgenes fue fundada en 2008 y ha consolidado una estructura operativa binacional con base productiva en la Patagonia argentina y plataforma logística y de valor agregado en España.':
      'Cabo Vírgenes was founded in 2008 and has consolidated a binational operating structure with a productive base in Argentine Patagonia and a logistics and value-add platform in Spain.',
    'En enero de 2025 la compañía se incorporó a AISA Group, fortaleciendo su posicionamiento dentro de la industria pesquera internacional.':
      'In January 2025 the company joined AISA Group, strengthening its position within the international fishing industry.',
    'Base operativa en Puerto Rawson (Chubut, Argentina) y presencia en Palencia (España). Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur.':
      'Operating base in Puerto Rawson (Chubut, Argentina) and presence in Palencia (Spain). Specialty: Pleoticus muelleri, the wild Patagonian shrimp of the South Atlantic.',
  },
  fr: {
    // Nav + general
    'Empresa':'Entreprise','Productos':'Produits','Sostenibilidad':'Durabilité',
    'Calidad':'Qualité','Plantas':'Usines','Flota':'Flotte','Contacto':'Contact',
    'Equipo':'Équipe','NUESTRO EQUIPO':'NOTRE ÉQUIPE','Todos':'Tous','Dirección':'Direction','Operaciones':'Opérations','Comercial':'Commercial','Ver perfil':'Voir le profil','Enfoque':'Objectif','Base':'Base','Alcance':'Portée','Certifica':'Certifie',
    'DESLIZA PARA EXPLORAR':'FAITES DÉFILER','VOLVER AL INICIO':'RETOUR EN HAUT',
    'Reproducir video corporativo':'Lire la vidéo corporative',
    'Más sobre nosotros':'En savoir plus','Más sobre Cabo Vírgenes':'En savoir plus sur Cabo Vírgenes',
    'Traducción IA con Transformers.js':'Traduction IA avec Transformers.js',
    // Hero
    'ORIGEN. CALIDAD. CONFIANZA.':'ORIGINE. QUALITÉ. CONFIANCE.',
    'Del Atlántico Sur al mundo.':'De l\'Atlantique Sud au monde.',
    'Pesca, procesamiento y exportación de productos del mar, con operaciones en Argentina y España. Cadena verticalmente integrada y trazabilidad total.':
      'Pêche, transformation et exportation de produits de la mer, avec des opérations en Argentine et en Espagne. Chaîne verticalement intégrée et traçabilité totale.',
    'Contactar al equipo':'Contacter l\'équipe','Conocer la empresa':'Découvrir l\'entreprise',
    // KPI hero
    'países':'pays','PAÍSES':'PAYS',
    'América, Europa, Asia y África. Exportamos en 5 continentes.':
      'Amériques, Europe, Asie et Afrique. Nous exportons sur 5 continents.',
    'Argentina y España':'Argentine et Espagne',
    'Base productiva en Patagonia, plataforma logística en Palencia.':
      'Base productive en Patagonie, plateforme logistique à Palencia.',
    'Cadena integrada':'Chaîne intégrée',
    'Captura, procesamiento, almacenamiento y comercialización propios.':
      'Capture, transformation, stockage et commercialisation propres.',
    'Productos premium':'Produits premium',
    'Langostino austral salvaje (Pleoticus muelleri) en múltiples formatos.':
      'Crevette australe sauvage (Pleoticus muelleri) en plusieurs formats.',
    // Empresa
    'QUIÉNES SOMOS':'QUI SOMMES-NOUS','Estructura binacional, visión global.':'Structure binationale, vision globale.',
    'FUNDACIÓN':'FONDATION','PAÍSES DESTINO':'PAYS DE DESTINATION','BUQUES PROPIOS':'NAVIRES PROPRES','CONTINENTES':'CONTINENTS',
    'fundación':'fondation','países destino':'pays de destination','buques propios':'navires propres','continentes':'continents',
    'FLOTA':'FLOTTE','PRODUCTO':'PRODUIT','PRESENCIA GLOBAL':'PRÉSENCE MONDIALE','TRAZABILIDAD':'TRAÇABILITÉ','SOSTENIBILIDAD':'DURABILITÉ',
    'Pesca responsable':'Pêche responsable',
    'Buques propios bajo estrictas normas de conservación del Mar Argentino.':
      'Navires propres sous des normes strictes de conservation de la mer Argentine.',
    'Langostino austral salvaje':'Crevette australe sauvage',
    'Pleoticus muelleri capturado en el Atlántico sudoccidental (FAO 41).':
      'Pleoticus muelleri capturé dans l\'Atlantique sud-ouest (FAO 41).',
    '40+ países en 5 continentes':'40+ pays sur 5 continents',
    'Estructura binacional Argentina–España con presencia en mercados premium.':
      'Structure binationale Argentine–Espagne avec présence sur les marchés premium.',
    'De la captura al puerto: control end-to-end con trazabilidad total.':
      'De la capture au port : contrôle de bout en bout avec traçabilité totale.',
    'Compromiso con el mar':'Engagement avec la mer',
    'Vedas, cuotas y mejora continua. Pesquería gestionada y certificada.':
      'Fermetures, quotas et amélioration continue. Pêcherie gérée et certifiée.',
    'SOBRE CABO VÍRGENES':'À PROPOS DE CABO VÍRGENES','Estructura binacional, visión global':'Structure binationale, vision globale',
    // Productos
    'Langostino austral salvaje.':'Crevette australe sauvage.',
    'Cabeza con caparazón':'Tête et carapace','Caparazón sin cabeza':'Carapace sans tête',
    'Easy peel':'Easy peel','Pelado y desvenado':'Décortiqué et déveiné','Pelado, desvenado, cocido':'Décortiqué, déveiné, cuit',
    'Producto con cabeza y cola enteras, máxima frescura y presentación.':
      'Produit avec tête et queue entières, fraîcheur et présentation maximales.',
    'Sin cabeza, con caparazón completo. Versatilidad culinaria.':
      'Sans tête, carapace complète. Polyvalence culinaire.',
    'Caparazón pre-cortado para pelado rápido en cocina profesional.':
      'Carapace pré-coupée pour un décorticage rapide en cuisine professionnelle.',
    'Listo para cocinar, sin caparazón y sin intestino. Calidad sashimi.':
      'Prêt à cuire, sans carapace ni intestin. Qualité sashimi.',
    'Cocido y congelado, listo para consumir. IQF individual.':
      'Cuit et congelé, prêt à consommer. IQF individuel.',
    'Clasificación':'Classification','Calibres por piezas/kg':'Calibres par pièces/kg',
    'Trazabilidad':'Traçabilité','Origen y captura':'Origine et capture',
    // Flota
    '5 buques operando el Mar Argentino.':'5 navires opérant en Mer Argentine.',
    'Tres fresqueros para procesamiento ágil en planta + dos buques congeladores factoría que procesan a bordo.':
      'Trois navires frais pour traitement agile à terre + deux congélateurs-usines qui transforment à bord.',
    'FRESQUERO':'NAVIRE FRAIS','FACTORÍA':'USINE',
    'Puerto Rawson':'Puerto Rawson','A bordo · Atlántico Sur':'À bord · Atlantique Sud',
    'Permiso de pesca en aguas nacionales y provinciales. Capacidad de captura superior a 3.000 toneladas anuales. Opera desde Puerto Rawson.':
      'Permis de pêche en eaux nationales et provinciales. Capacité de capture supérieure à 3 000 tonnes annuelles. Opère depuis Puerto Rawson.',
    'Opera en aguas nacionales. Procesamiento ágil en planta gracias al ciclo corto de captura-desembarque.':
      'Opère en eaux nationales. Traitement agile à terre grâce au cycle court capture-débarquement.',
    'Opera en aguas nacionales. Mantiene la cadena de frío desde la captura hasta el desembarque.':
      'Opère en eaux nationales. Maintient la chaîne du froid de la capture au débarquement.',
    'Tangonero factoría. Congelación diaria de 23 t, bodega de 170 t. Remodelado con una inversión superior a USD 2 M.':
      'Crevettier-usine. Congélation quotidienne de 23 t, cale de 170 t. Rénové avec un investissement supérieur à 2 M USD.',
    'Tangonero factoría. Congelación diaria de 13 t, bodega de 98 t. Captura, procesa y congela a bordo.':
      'Crevettier-usine. Congélation quotidienne de 13 t, cale de 98 t. Capture, traite et congèle à bord.',
    // Plantas
    'Dos continentes, un mismo estándar.':'Deux continents, un même standard.',
    'PUERTO RAWSON':'PUERTO RAWSON','PALENCIA':'PALENCIA','España':'Espagne','Argentina':'Argentine',
    'Capacidad: 80 t/día':'Capacité : 80 t/jour','Capacidad: 60 t/día':'Capacité : 60 t/jour',
    'Cámaras de frío de –25°C':'Chambres froides à –25°C','Cámaras de –25°C':'Chambres à –25°C',
    'Laboratorio propio HACCP':'Laboratoire HACCP propre',
    'Procesamiento del langostino fresquero':'Traitement de la crevette fraîche',
    'Valor agregado y empaquetado para Europa':'Valeur ajoutée et emballage pour l\'Europe',
    'Centro logístico europeo':'Centre logistique européen',
    'Punto de distribución a 5 continentes':'Point de distribution vers 5 continents',
    // Calidad
    'La calidad empieza en el mar.':'La qualité commence en mer.',
    'Análisis de peligros y puntos críticos de control.':'Analyse des dangers et points critiques de contrôle.',
    'Global Standard for Food Safety.':'Global Standard for Food Safety.',
    'International Featured Standards.':'International Featured Standards.',
    'Trazabilidad total desde captura.':'Traçabilité totale depuis la capture.',
    // Sostenibilidad
    'Responsabilidad de origen.':'Responsabilité d\'origine.',
    'Cuotas y vedas':'Quotas et fermetures','Eficiencia energética':'Efficacité énergétique',
    'Reducción de plásticos':'Réduction des plastiques','Certificación MSC':'Certification MSC',
    'Gestión bajo el Consejo Federal Pesquero argentino.':'Gestion sous le Conseil Fédéral de la Pêche argentin.',
    'Inversión continua en flota más eficiente.':'Investissement continu dans une flotte plus efficace.',
    'Programas de reducción y reciclaje de envases.':'Programmes de réduction et recyclage des emballages.',
    'En proceso de certificación para captura sostenible.':'En cours de certification pour une capture durable.',
    // Contacto
    'Hablemos.':'Parlons-en.',
    'Sede operativa':'Siège opérationnel','Plataforma España':'Plateforme Espagne',
    'Copiar':'Copier',
    'NOMBRE':'NOM','EMPRESA':'ENTREPRISE','EMAIL':'EMAIL','MENSAJE':'MESSAGE','Enviar consulta':'Envoyer la demande',
    // Info bar
    'Email':'Email','Argentina · Patagonia':'Argentine · Patagonie',
    'España · Palencia':'Espagne · Palencia','Atención global':'Support global',
    // Footer
    'Pesca, procesamiento y exportación.':'Pêche, transformation et exportation.',
    'Navegación':'Navigation','Operación':'Opérations','Legal':'Légal',
    'Política de privacidad':'Politique de confidentialité','Términos':'Conditions','Cookies':'Cookies',
    '© Cabo Vírgenes 2026 — Todos los derechos reservados.':
      '© Cabo Vírgenes 2026 — Tous droits réservés.',
    'Inicio':'Accueil',
    // Modal contenidos
    '5 buques propios operando en el Mar Argentino bajo cuotas de captura y vedas reproductivas que protegen la especie.':
      '5 navires propres opérant en Mer Argentine sous quotas de capture et fermetures reproductives qui protègent l\'espèce.',
    'Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operan desde Puerto Rawson con ciclo corto captura-desembarque.':
      'Navires frais : Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — opèrent depuis Puerto Rawson avec un cycle court capture-débarquement.',
    'Congeladores factoría: Mar Esmeralda (53 m) y Kaleu Kaleu (56 m) procesan y congelan a bordo, garantizando frescura desde el origen.':
      'Congélateurs-usines : Mar Esmeralda (53 m) et Kaleu Kaleu (56 m) traitent et congèlent à bord, garantissant la fraîcheur dès l\'origine.',
    'Pleoticus muelleri capturado en aguas frías del Atlántico Sudoccidental (FAO 41). Producto salvaje, sin acuicultura, sin antibióticos.':
      'Pleoticus muelleri capturé dans les eaux froides de l\'Atlantique sud-ouest (FAO 41). Produit sauvage, sans aquaculture, sans antibiotiques.',
    'Formatos: HOSO, HLSO, EZP, P&D y PDTO. Clasificación: L1, L2, L3, C1, C2, CR según piezas/kg.':
      'Formats : HOSO, HLSO, EZP, P&D et PDTO. Classification : L1, L2, L3, C1, C2, CR selon pièces/kg.',
    '40+ países, 5 continentes':'40+ pays, 5 continents',
    'Estructura binacional Argentina–España con base productiva en Patagonia y plataforma logística europea en Palencia.':
      'Structure binationale Argentine–Espagne avec base productive en Patagonie et plateforme logistique européenne à Palencia.',
    'Exportamos a América, Europa, Asia y África, atendiendo mercados premium con foodservice, retail e industria de procesamiento.':
      'Nous exportons vers les Amériques, l\'Europe, l\'Asie et l\'Afrique, en servant les marchés premium en restauration, distribution et industrie de transformation.',
    'Control end-to-end desde la captura hasta el cliente final: barco propio → planta propia → logística propia → exportación directa.':
      'Contrôle de bout en bout de la capture au client final : navire propre → usine propre → logistique propre → exportation directe.',
    'Cada lote es identificado y trazable: zona FAO, embarcación, fecha y planta de procesamiento — cumpliendo EU, FDA, SENASA y certificaciones de mercado.':
      'Chaque lot est identifié et traçable : zone FAO, navire, date et usine de transformation — conforme aux normes UE, FDA, SENASA et certifications de marché.',
    'Pesquería gestionada bajo el Consejo Federal Pesquero argentino: cuotas anuales, vedas reproductivas y zonas de protección.':
      'Pêcherie gérée sous le Conseil Fédéral de la Pêche argentin : quotas annuels, fermetures reproductives et zones protégées.',
    'Inversión en eficiencia energética de la flota, reducción de plásticos y mejora continua para certificación MSC.':
      'Investissement dans l\'efficacité énergétique de la flotte, réduction des plastiques et amélioration continue pour la certification MSC.',
    'Estructura binacional, visión global':'Structure binationale, vision globale',
    'Fundada en 2008, Cabo Vírgenes es una empresa pesquera especializada en captura, procesamiento, comercialización y exportación de productos del mar.':
      'Fondée en 2008, Cabo Vírgenes est une entreprise de pêche spécialisée dans la capture, la transformation, la commercialisation et l\'exportation de produits de la mer.',
    'En enero de 2025 se incorporó a AISA Group, consolidando su posicionamiento en la industria pesquera internacional.':
      'En janvier 2025, elle a rejoint AISA Group, consolidant sa position dans l\'industrie de la pêche internationale.',
    'Operación binacional con base productiva en la Patagonia argentina (Puerto Rawson) y plataforma logística y de valor agregado en España (Palencia).':
      'Opération binationale avec base productive en Patagonie argentine (Puerto Rawson) et plateforme logistique et de valeur ajoutée en Espagne (Palencia).',
    'Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur — uno de los productos del mar más cotizados a nivel global.':
      'Spécialité : Pleoticus muelleri, la crevette australe sauvage de l\'Atlantique Sud — l\'un des produits de la mer les plus prisés au monde.',
    'Cabo Vírgenes fue fundada en 2008 y ha consolidado una estructura operativa binacional con base productiva en la Patagonia argentina y plataforma logística y de valor agregado en España.':
      'Cabo Vírgenes a été fondée en 2008 et a consolidé une structure opérationnelle binationale avec base productive en Patagonie argentine et plateforme logistique et de valeur ajoutée en Espagne.',
    'En enero de 2025 la compañía se incorporó a AISA Group, fortaleciendo su posicionamiento dentro de la industria pesquera internacional.':
      'En janvier 2025, la société a rejoint AISA Group, renforçant sa position au sein de l\'industrie de la pêche internationale.',
    'Base operativa en Puerto Rawson (Chubut, Argentina) y presencia en Palencia (España). Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur.':
      'Base opérationnelle à Puerto Rawson (Chubut, Argentine) et présence à Palencia (Espagne). Spécialité : Pleoticus muelleri, la crevette australe sauvage de l\'Atlantique Sud.',
  },
  pt: {
    // Nav + general
    'Empresa':'Empresa','Productos':'Produtos','Sostenibilidad':'Sustentabilidade',
    'Calidad':'Qualidade','Plantas':'Plantas','Flota':'Frota','Contacto':'Contato',
    'Equipo':'Equipe','NUESTRO EQUIPO':'NOSSA EQUIPE','Todos':'Todos','Dirección':'Direção','Operaciones':'Operações','Comercial':'Comercial','Ver perfil':'Ver perfil','Enfoque':'Foco','Base':'Base','Alcance':'Alcance','Certifica':'Certifica',
    'DESLIZA PARA EXPLORAR':'DESLIZE PARA EXPLORAR','VOLVER AL INICIO':'VOLTAR AO TOPO',
    'Reproducir video corporativo':'Reproduzir vídeo corporativo',
    'Más sobre nosotros':'Mais sobre nós','Más sobre Cabo Vírgenes':'Mais sobre Cabo Vírgenes',
    'Traducción IA con Transformers.js':'Tradução IA com Transformers.js',
    // Hero
    'ORIGEN. CALIDAD. CONFIANZA.':'ORIGEM. QUALIDADE. CONFIANÇA.',
    'Del Atlántico Sur al mundo.':'Do Atlântico Sul ao mundo.',
    'Pesca, procesamiento y exportación de productos del mar, con operaciones en Argentina y España. Cadena verticalmente integrada y trazabilidad total.':
      'Pesca, processamento e exportação de produtos do mar, com operações na Argentina e Espanha. Cadeia verticalmente integrada e rastreabilidade total.',
    'Contactar al equipo':'Falar com a equipe','Conocer la empresa':'Conhecer a empresa',
    // KPI
    'países':'países','PAÍSES':'PAÍSES',
    'América, Europa, Asia y África. Exportamos en 5 continentes.':
      'Américas, Europa, Ásia e África. Exportamos em 5 continentes.',
    'Argentina y España':'Argentina e Espanha',
    'Base productiva en Patagonia, plataforma logística en Palencia.':
      'Base produtiva na Patagônia, plataforma logística em Palencia.',
    'Cadena integrada':'Cadeia integrada',
    'Captura, procesamiento, almacenamiento y comercialización propios.':
      'Captura, processamento, armazenamento e comercialização próprios.',
    'Productos premium':'Produtos premium',
    'Langostino austral salvaje (Pleoticus muelleri) en múltiples formatos.':
      'Camarão austral selvagem (Pleoticus muelleri) em múltiplos formatos.',
    // Empresa
    'QUIÉNES SOMOS':'QUEM SOMOS','Estructura binacional, visión global.':'Estrutura binacional, visão global.',
    'FUNDACIÓN':'FUNDAÇÃO','PAÍSES DESTINO':'PAÍSES DESTINO','BUQUES PROPIOS':'NAVIOS PRÓPRIOS','CONTINENTES':'CONTINENTES',
    'FLOTA':'FROTA','PRODUCTO':'PRODUTO','PRESENCIA GLOBAL':'PRESENÇA GLOBAL','TRAZABILIDAD':'RASTREABILIDADE','SOSTENIBILIDAD':'SUSTENTABILIDADE',
    'Pesca responsable':'Pesca responsável',
    'Buques propios bajo estrictas normas de conservación del Mar Argentino.':
      'Navios próprios sob estritas normas de conservação do Mar Argentino.',
    'Langostino austral salvaje':'Camarão austral selvagem',
    'Pleoticus muelleri capturado en el Atlántico sudoccidental (FAO 41).':
      'Pleoticus muelleri capturado no Atlântico sudoeste (FAO 41).',
    '40+ países en 5 continentes':'40+ países em 5 continentes',
    'Estructura binacional Argentina–España con presencia en mercados premium.':
      'Estrutura binacional Argentina–Espanha com presença em mercados premium.',
    'De la captura al puerto: control end-to-end con trazabilidad total.':
      'Da captura ao porto: controle end-to-end com rastreabilidade total.',
    'Compromiso con el mar':'Compromisso com o mar',
    'Vedas, cuotas y mejora continua. Pesquería gestionada y certificada.':
      'Defesos, cotas e melhoria contínua. Pesca gerida e certificada.',
    'SOBRE CABO VÍRGENES':'SOBRE CABO VÍRGENES','Estructura binacional, visión global':'Estrutura binacional, visão global',
    // Productos
    'Langostino austral salvaje.':'Camarão austral selvagem.',
    'Cabeza con caparazón':'Cabeça e casca','Caparazón sin cabeza':'Casca sem cabeça',
    'Easy peel':'Easy peel','Pelado y desvenado':'Descascado e desveiado','Pelado, desvenado, cocido':'Descascado, desveiado, cozido',
    'Producto con cabeza y cola enteras, máxima frescura y presentación.':
      'Produto com cabeça e cauda inteiras, frescor e apresentação máximos.',
    'Sin cabeza, con caparazón completo. Versatilidad culinaria.':
      'Sem cabeça, com casca completa. Versatilidade culinária.',
    'Caparazón pre-cortado para pelado rápido en cocina profesional.':
      'Casca pré-cortada para descascamento rápido em cozinha profissional.',
    'Listo para cocinar, sin caparazón y sin intestino. Calidad sashimi.':
      'Pronto para cozinhar, sem casca e sem intestino. Qualidade sashimi.',
    'Cocido y congelado, listo para consumir. IQF individual.':
      'Cozido e congelado, pronto para consumo. IQF individual.',
    'Clasificación':'Classificação','Calibres por piezas/kg':'Calibres por peças/kg',
    'Trazabilidad':'Rastreabilidade','Origen y captura':'Origem e captura',
    // Flota
    '5 buques operando el Mar Argentino.':'5 navios operando no Mar Argentino.',
    'Tres fresqueros para procesamiento ágil en planta + dos buques congeladores factoría que procesan a bordo.':
      'Três navios frescos para processamento ágil em planta + dois congeladores fábrica que processam a bordo.',
    'FRESQUERO':'NAVIO FRESCO','FACTORÍA':'FÁBRICA',
    'A bordo · Atlántico Sur':'A bordo · Atlântico Sul',
    'Permiso de pesca en aguas nacionales y provinciales. Capacidad de captura superior a 3.000 toneladas anuales. Opera desde Puerto Rawson.':
      'Licença de pesca em águas nacionais e provinciais. Capacidade de captura superior a 3.000 toneladas anuais. Opera desde Puerto Rawson.',
    'Opera en aguas nacionales. Procesamiento ágil en planta gracias al ciclo corto de captura-desembarque.':
      'Opera em águas nacionais. Processamento ágil em planta graças ao ciclo curto captura-desembarque.',
    'Opera en aguas nacionales. Mantiene la cadena de frío desde la captura hasta el desembarque.':
      'Opera em águas nacionais. Mantém a cadeia de frio da captura ao desembarque.',
    'Tangonero factoría. Congelación diaria de 23 t, bodega de 170 t. Remodelado con una inversión superior a USD 2 M.':
      'Camaroneiro fábrica. Congelamento diário de 23 t, porão de 170 t. Reformado com investimento superior a USD 2 M.',
    'Tangonero factoría. Congelación diaria de 13 t, bodega de 98 t. Captura, procesa y congela a bordo.':
      'Camaroneiro fábrica. Congelamento diário de 13 t, porão de 98 t. Captura, processa e congela a bordo.',
    // Plantas
    'Dos continentes, un mismo estándar.':'Dois continentes, um mesmo padrão.',
    'España':'Espanha','Argentina':'Argentina',
    'Capacidad: 80 t/día':'Capacidade: 80 t/dia','Capacidad: 60 t/día':'Capacidade: 60 t/dia',
    'Cámaras de frío de –25°C':'Câmaras frias de –25°C','Cámaras de –25°C':'Câmaras de –25°C',
    'Laboratorio propio HACCP':'Laboratório HACCP próprio',
    'Procesamiento del langostino fresquero':'Processamento do camarão fresco',
    'Valor agregado y empaquetado para Europa':'Valor agregado e embalagem para Europa',
    'Centro logístico europeo':'Centro logístico europeu',
    'Punto de distribución a 5 continentes':'Ponto de distribuição para 5 continentes',
    // Calidad
    'La calidad empieza en el mar.':'A qualidade começa no mar.',
    'Análisis de peligros y puntos críticos de control.':'Análise de perigos e pontos críticos de controle.',
    'Trazabilidad total desde captura.':'Rastreabilidade total desde a captura.',
    // Sostenibilidad
    'Responsabilidad de origen.':'Responsabilidade de origem.',
    'Cuotas y vedas':'Cotas e defesos','Eficiencia energética':'Eficiência energética',
    'Reducción de plásticos':'Redução de plásticos','Certificación MSC':'Certificação MSC',
    'Gestión bajo el Consejo Federal Pesquero argentino.':'Gestão sob o Conselho Federal Pesqueiro argentino.',
    'Inversión continua en flota más eficiente.':'Investimento contínuo em frota mais eficiente.',
    'Programas de reducción y reciclaje de envases.':'Programas de redução e reciclagem de embalagens.',
    'En proceso de certificación para captura sostenible.':'Em processo de certificação para captura sustentável.',
    // Contacto
    'Hablemos.':'Vamos conversar.',
    'Sede operativa':'Sede operacional','Plataforma España':'Plataforma Espanha',
    'Copiar':'Copiar',
    'NOMBRE':'NOME','EMPRESA':'EMPRESA','EMAIL':'EMAIL','MENSAJE':'MENSAGEM','Enviar consulta':'Enviar consulta',
    'Email':'Email','Argentina · Patagonia':'Argentina · Patagônia',
    'España · Palencia':'Espanha · Palencia','Atención global':'Atendimento global',
    'Pesca, procesamiento y exportación.':'Pesca, processamento e exportação.',
    'Navegación':'Navegação','Operación':'Operação','Legal':'Legal',
    'Política de privacidad':'Política de privacidade','Términos':'Termos','Cookies':'Cookies',
    '© Cabo Vírgenes 2026 — Todos los derechos reservados.':
      '© Cabo Vírgenes 2026 — Todos os direitos reservados.',
    'Inicio':'Início',
    // Modal contenidos
    '5 buques propios operando en el Mar Argentino bajo cuotas de captura y vedas reproductivas que protegen la especie.':
      '5 navios próprios operando no Mar Argentino sob cotas de captura e defesos reprodutivos que protegem a espécie.',
    'Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operan desde Puerto Rawson con ciclo corto captura-desembarque.':
      'Navios frescos: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operam desde Puerto Rawson com ciclo curto captura-desembarque.',
    'Congeladores factoría: Mar Esmeralda (53 m) y Kaleu Kaleu (56 m) procesan y congelan a bordo, garantizando frescura desde el origen.':
      'Congeladores fábrica: Mar Esmeralda (53 m) e Kaleu Kaleu (56 m) processam e congelam a bordo, garantindo frescor desde a origem.',
    'Pleoticus muelleri capturado en aguas frías del Atlántico Sudoccidental (FAO 41). Producto salvaje, sin acuicultura, sin antibióticos.':
      'Pleoticus muelleri capturado nas águas frias do Atlântico Sudoeste (FAO 41). Produto selvagem, sem aquicultura, sem antibióticos.',
    'Formatos: HOSO, HLSO, EZP, P&D y PDTO. Clasificación: L1, L2, L3, C1, C2, CR según piezas/kg.':
      'Formatos: HOSO, HLSO, EZP, P&D e PDTO. Classificação: L1, L2, L3, C1, C2, CR por peças/kg.',
    '40+ países, 5 continentes':'40+ países, 5 continentes',
    'Estructura binacional Argentina–España con base productiva en Patagonia y plataforma logística europea en Palencia.':
      'Estrutura binacional Argentina–Espanha com base produtiva na Patagônia e plataforma logística europeia em Palencia.',
    'Exportamos a América, Europa, Asia y África, atendiendo mercados premium con foodservice, retail e industria de procesamiento.':
      'Exportamos para Américas, Europa, Ásia e África, atendendo mercados premium com foodservice, varejo e indústria de processamento.',
    'Control end-to-end desde la captura hasta el cliente final: barco propio → planta propia → logística propia → exportación directa.':
      'Controle end-to-end da captura até o cliente final: navio próprio → planta própria → logística própria → exportação direta.',
    'Cada lote es identificado y trazable: zona FAO, embarcación, fecha y planta de procesamiento — cumpliendo EU, FDA, SENASA y certificaciones de mercado.':
      'Cada lote é identificado e rastreável: zona FAO, embarcação, data e planta de processamento — cumprindo UE, FDA, SENASA e certificações de mercado.',
    'Pesquería gestionada bajo el Consejo Federal Pesquero argentino: cuotas anuales, vedas reproductivas y zonas de protección.':
      'Pesca gerida sob o Conselho Federal Pesqueiro argentino: cotas anuais, defesos reprodutivos e zonas de proteção.',
    'Inversión en eficiencia energética de la flota, reducción de plásticos y mejora continua para certificación MSC.':
      'Investimento em eficiência energética da frota, redução de plásticos e melhoria contínua para certificação MSC.',
    'Fundada en 2008, Cabo Vírgenes es una empresa pesquera especializada en captura, procesamiento, comercialización y exportación de productos del mar.':
      'Fundada em 2008, Cabo Vírgenes é uma empresa pesqueira especializada em captura, processamento, comercialização e exportação de produtos do mar.',
    'En enero de 2025 se incorporó a AISA Group, consolidando su posicionamiento en la industria pesquera internacional.':
      'Em janeiro de 2025 incorporou-se ao AISA Group, consolidando sua posição na indústria pesqueira internacional.',
    'Operación binacional con base productiva en la Patagonia argentina (Puerto Rawson) y plataforma logística y de valor agregado en España (Palencia).':
      'Operação binacional com base produtiva na Patagônia argentina (Puerto Rawson) e plataforma logística e de valor agregado na Espanha (Palencia).',
    'Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur — uno de los productos del mar más cotizados a nivel global.':
      'Especialidade: Pleoticus muelleri, o camarão austral selvagem do Atlântico Sul — um dos produtos do mar mais cotados globalmente.',
    'Cabo Vírgenes fue fundada en 2008 y ha consolidado una estructura operativa binacional con base productiva en la Patagonia argentina y plataforma logística y de valor agregado en España.':
      'Cabo Vírgenes foi fundada em 2008 e consolidou uma estrutura operacional binacional com base produtiva na Patagônia argentina e plataforma logística e de valor agregado na Espanha.',
    'En enero de 2025 la compañía se incorporó a AISA Group, fortaleciendo su posicionamiento dentro de la industria pesquera internacional.':
      'Em janeiro de 2025 a empresa incorporou-se ao AISA Group, fortalecendo sua posição dentro da indústria pesqueira internacional.',
    'Base operativa en Puerto Rawson (Chubut, Argentina) y presencia en Palencia (España). Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur.':
      'Base operacional em Puerto Rawson (Chubut, Argentina) e presença em Palencia (Espanha). Especialidade: Pleoticus muelleri, o camarão austral selvagem do Atlântico Sul.',
  },
  zh: {
    // Nav + general
    'Empresa':'公司','Productos':'产品','Sostenibilidad':'可持续性',
    'Calidad':'质量','Plantas':'工厂','Flota':'船队','Contacto':'联系',
    'Equipo':'团队','NUESTRO EQUIPO':'我们的团队','Todos':'全部','Dirección':'管理层','Operaciones':'运营','Comercial':'商务','Ver perfil':'查看简介','Enfoque':'专注','Base':'基地','Alcance':'覆盖','Certifica':'认证',
    'DESLIZA PARA EXPLORAR':'向下浏览','VOLVER AL INICIO':'回到顶部',
    'Reproducir video corporativo':'播放企业视频',
    'Más sobre nosotros':'了解更多','Más sobre Cabo Vírgenes':'更多关于 Cabo Vírgenes',
    'Traducción IA con Transformers.js':'由 Transformers.js 提供 AI 翻译',
    // Hero
    'ORIGEN. CALIDAD. CONFIANZA.':'原产地 · 品质 · 信赖',
    'Del Atlántico Sur al mundo.':'从南大西洋走向世界。',
    'Pesca, procesamiento y exportación de productos del mar, con operaciones en Argentina y España. Cadena verticalmente integrada y trazabilidad total.':
      '海产品的捕捞、加工和出口业务,业务遍及阿根廷和西班牙。垂直整合供应链和全程可追溯。',
    'Contactar al equipo':'联系团队','Conocer la empresa':'了解公司',
    // KPI
    'países':'国家','PAÍSES':'国家',
    'América, Europa, Asia y África. Exportamos en 5 continentes.':
      '美洲、欧洲、亚洲和非洲。出口至五大洲。',
    'Argentina y España':'阿根廷与西班牙',
    'Base productiva en Patagonia, plataforma logística en Palencia.':
      '巴塔哥尼亚生产基地,帕伦西亚物流平台。',
    'Cadena integrada':'整合供应链',
    'Captura, procesamiento, almacenamiento y comercialización propios.':
      '自有捕捞、加工、仓储和销售业务。',
    'Productos premium':'高端产品',
    'Langostino austral salvaje (Pleoticus muelleri) en múltiples formatos.':
      '野生南极虾 (Pleoticus muelleri) 多种规格。',
    // Empresa
    'QUIÉNES SOMOS':'关于我们','Estructura binacional, visión global.':'双国结构,全球视野。',
    'FUNDACIÓN':'成立','PAÍSES DESTINO':'目的地国家','BUQUES PROPIOS':'自有船只','CONTINENTES':'大洲',
    'FLOTA':'船队','PRODUCTO':'产品','PRESENCIA GLOBAL':'全球布局','TRAZABILIDAD':'可追溯性','SOSTENIBILIDAD':'可持续性',
    'Pesca responsable':'负责任的捕捞',
    'Buques propios bajo estrictas normas de conservación del Mar Argentino.':
      '自有船只遵守阿根廷海域严格的保护规定。',
    'Langostino austral salvaje':'野生南极虾',
    'Pleoticus muelleri capturado en el Atlántico sudoccidental (FAO 41).':
      '于西南大西洋 (FAO 41) 捕捞的 Pleoticus muelleri。',
    '40+ países en 5 continentes':'40+ 国家,五大洲',
    'Estructura binacional Argentina–España con presencia en mercados premium.':
      '阿根廷–西班牙双国结构,布局高端市场。',
    'De la captura al puerto: control end-to-end con trazabilidad total.':
      '从捕捞到港口:端到端控制,全程可追溯。',
    'Compromiso con el mar':'对海洋的承诺',
    'Vedas, cuotas y mejora continua. Pesquería gestionada y certificada.':
      '禁渔期、配额和持续改进。受管理且经认证的渔业。',
    'SOBRE CABO VÍRGENES':'关于 CABO VÍRGENES','Estructura binacional, visión global':'双国结构,全球视野',
    // Productos
    'Langostino austral salvaje.':'野生南极虾。',
    'Cabeza con caparazón':'带头带壳','Caparazón sin cabeza':'带壳去头',
    'Easy peel':'易剥型','Pelado y desvenado':'去壳去肠','Pelado, desvenado, cocido':'去壳去肠熟制',
    'Producto con cabeza y cola enteras, máxima frescura y presentación.':
      '带头带尾整虾,极致新鲜与卖相。',
    'Sin cabeza, con caparazón completo. Versatilidad culinaria.':
      '去头带壳,烹饪用途广泛。',
    'Caparazón pre-cortado para pelado rápido en cocina profesional.':
      '虾壳预切,便于专业厨房快速剥壳。',
    'Listo para cocinar, sin caparazón y sin intestino. Calidad sashimi.':
      '即烹去壳去肠,刺身级品质。',
    'Cocido y congelado, listo para consumir. IQF individual.':
      '熟冻,开袋即食。单冻 IQF。',
    'Clasificación':'分级','Calibres por piezas/kg':'按只/公斤分级',
    'Trazabilidad':'可追溯性','Origen y captura':'原产与捕捞',
    // Flota
    '5 buques operando el Mar Argentino.':'5 艘船作业于阿根廷海域。',
    'Tres fresqueros para procesamiento ágil en planta + dos buques congeladores factoría que procesan a bordo.':
      '3 艘鲜捕船供陆上快速加工 + 2 艘船上加工冷冻工厂船。',
    'FRESQUERO':'鲜捕船','FACTORÍA':'工厂船',
    'A bordo · Atlántico Sur':'船上 · 南大西洋',
    'Permiso de pesca en aguas nacionales y provinciales. Capacidad de captura superior a 3.000 toneladas anuales. Opera desde Puerto Rawson.':
      '国家和省级水域捕捞许可。年捕捞能力超过 3,000 吨。从 Puerto Rawson 港口运营。',
    'Opera en aguas nacionales. Procesamiento ágil en planta gracias al ciclo corto de captura-desembarque.':
      '国家水域作业。短捕捞–卸货周期实现陆上敏捷加工。',
    'Opera en aguas nacionales. Mantiene la cadena de frío desde la captura hasta el desembarque.':
      '国家水域作业。从捕捞到卸货全程保持冷链。',
    'Tangonero factoría. Congelación diaria de 23 t, bodega de 170 t. Remodelado con una inversión superior a USD 2 M.':
      '工厂虾船。日冻 23 吨,舱容 170 吨。投资超 200 万美元翻新。',
    'Tangonero factoría. Congelación diaria de 13 t, bodega de 98 t. Captura, procesa y congela a bordo.':
      '工厂虾船。日冻 13 吨,舱容 98 吨。船上捕捞、加工、冷冻。',
    // Plantas
    'Dos continentes, un mismo estándar.':'两大洲,同一标准。',
    'España':'西班牙','Argentina':'阿根廷',
    'Capacidad: 80 t/día':'产能:80 吨/天','Capacidad: 60 t/día':'产能:60 吨/天',
    'Cámaras de frío de –25°C':'–25°C 冷藏库','Cámaras de –25°C':'–25°C 冷库',
    'Laboratorio propio HACCP':'自有 HACCP 实验室',
    'Procesamiento del langostino fresquero':'鲜虾加工',
    'Valor agregado y empaquetado para Europa':'面向欧洲的增值与包装',
    'Centro logístico europeo':'欧洲物流中心',
    'Punto de distribución a 5 continentes':'分销至五大洲',
    // Calidad
    'La calidad empieza en el mar.':'品质始于海洋。',
    'Análisis de peligros y puntos críticos de control.':'危害分析与关键控制点。',
    'Trazabilidad total desde captura.':'自捕捞起全程可追溯。',
    // Sostenibilidad
    'Responsabilidad de origen.':'源头责任。',
    'Cuotas y vedas':'配额与禁渔','Eficiencia energética':'能效',
    'Reducción de plásticos':'减塑','Certificación MSC':'MSC 认证',
    'Gestión bajo el Consejo Federal Pesquero argentino.':'由阿根廷联邦渔业委员会管理。',
    'Inversión continua en flota más eficiente.':'持续投资更高效的船队。',
    'Programas de reducción y reciclaje de envases.':'包装减量与回收项目。',
    'En proceso de certificación para captura sostenible.':'可持续捕捞认证进行中。',
    // Contacto
    'Hablemos.':'让我们对话。',
    'Sede operativa':'运营总部','Plataforma España':'西班牙平台',
    'Copiar':'复制',
    'NOMBRE':'姓名','EMPRESA':'公司','EMAIL':'邮箱','MENSAJE':'留言','Enviar consulta':'发送询问',
    'Email':'邮箱','Argentina · Patagonia':'阿根廷 · 巴塔哥尼亚',
    'España · Palencia':'西班牙 · 帕伦西亚','Atención global':'全球客服',
    'Pesca, procesamiento y exportación.':'捕捞、加工与出口。',
    'Navegación':'导航','Operación':'运营','Legal':'法律',
    'Política de privacidad':'隐私政策','Términos':'条款','Cookies':'Cookies',
    '© Cabo Vírgenes 2026 — Todos los derechos reservados.':
      '© Cabo Vírgenes 2026 — 保留所有权利。',
    'Inicio':'首页',
    // Modal contenidos
    '5 buques propios operando en el Mar Argentino bajo cuotas de captura y vedas reproductivas que protegen la especie.':
      '5 艘自有船只在阿根廷海域作业,遵守捕捞配额和繁殖期禁渔,保护物种。',
    'Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m) — operan desde Puerto Rawson con ciclo corto captura-desembarque.':
      '鲜捕船:Espartano (21 米)、Cristo Redentor (31 米)、Iglú I (32 米) — 从 Puerto Rawson 港口作业,捕捞–卸货周期短。',
    'Congeladores factoría: Mar Esmeralda (53 m) y Kaleu Kaleu (56 m) procesan y congelan a bordo, garantizando frescura desde el origen.':
      '工厂冷冻船:Mar Esmeralda (53 米) 与 Kaleu Kaleu (56 米) 船上加工冷冻,确保源头新鲜。',
    'Pleoticus muelleri capturado en aguas frías del Atlántico Sudoccidental (FAO 41). Producto salvaje, sin acuicultura, sin antibióticos.':
      '于西南大西洋 (FAO 41) 冷水域捕捞的 Pleoticus muelleri。野生产品,非养殖,无抗生素。',
    'Formatos: HOSO, HLSO, EZP, P&D y PDTO. Clasificación: L1, L2, L3, C1, C2, CR según piezas/kg.':
      '规格:HOSO、HLSO、EZP、P&D 和 PDTO。按只/公斤分级:L1、L2、L3、C1、C2、CR。',
    '40+ países, 5 continentes':'40+ 国家,五大洲',
    'Estructura binacional Argentina–España con base productiva en Patagonia y plataforma logística europea en Palencia.':
      '阿根廷–西班牙双国结构,巴塔哥尼亚生产基地,帕伦西亚欧洲物流平台。',
    'Exportamos a América, Europa, Asia y África, atendiendo mercados premium con foodservice, retail e industria de procesamiento.':
      '出口至美洲、欧洲、亚洲与非洲,服务餐饮、零售与加工业的高端市场。',
    'Control end-to-end desde la captura hasta el cliente final: barco propio → planta propia → logística propia → exportación directa.':
      '从捕捞到终端客户端到端控制:自有船 → 自有工厂 → 自有物流 → 直接出口。',
    'Cada lote es identificado y trazable: zona FAO, embarcación, fecha y planta de procesamiento — cumpliendo EU, FDA, SENASA y certificaciones de mercado.':
      '每个批次均可标识与追溯:FAO 区域、船只、日期与加工厂 — 符合欧盟、FDA、SENASA 及市场认证。',
    'Pesquería gestionada bajo el Consejo Federal Pesquero argentino: cuotas anuales, vedas reproductivas y zonas de protección.':
      '在阿根廷联邦渔业委员会管理下:年度配额、繁殖期禁渔与保护区。',
    'Inversión en eficiencia energética de la flota, reducción de plásticos y mejora continua para certificación MSC.':
      '投资船队能效、减塑及向 MSC 认证持续改进。',
    'Fundada en 2008, Cabo Vírgenes es una empresa pesquera especializada en captura, procesamiento, comercialización y exportación de productos del mar.':
      'Cabo Vírgenes 创立于 2008 年,是一家专注于海产品捕捞、加工、商业化与出口的渔业公司。',
    'En enero de 2025 se incorporó a AISA Group, consolidando su posicionamiento en la industria pesquera internacional.':
      '2025 年 1 月加入 AISA Group,巩固其在国际渔业中的地位。',
    'Operación binacional con base productiva en la Patagonia argentina (Puerto Rawson) y plataforma logística y de valor agregado en España (Palencia).':
      '双国运营:阿根廷巴塔哥尼亚 (Puerto Rawson) 生产基地与西班牙 (Palencia) 物流增值平台。',
    'Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur — uno de los productos del mar más cotizados a nivel global.':
      '专长:Pleoticus muelleri,南大西洋野生南极虾 — 全球最受推崇的海产品之一。',
    'Cabo Vírgenes fue fundada en 2008 y ha consolidado una estructura operativa binacional con base productiva en la Patagonia argentina y plataforma logística y de valor agregado en España.':
      'Cabo Vírgenes 创立于 2008 年,已建立双国运营架构,阿根廷巴塔哥尼亚为生产基地,西班牙为物流与增值平台。',
    'En enero de 2025 la compañía se incorporó a AISA Group, fortaleciendo su posicionamiento dentro de la industria pesquera internacional.':
      '公司于 2025 年 1 月加入 AISA Group,巩固其在国际渔业中的地位。',
    'Base operativa en Puerto Rawson (Chubut, Argentina) y presencia en Palencia (España). Especialidad: Pleoticus muelleri, el langostino austral salvaje del Atlántico Sur.':
      '运营基地位于 Puerto Rawson (阿根廷丘布特省),并在 Palencia (西班牙) 设有据点。专长:Pleoticus muelleri,南大西洋野生南极虾。',
  },
  es: {}, // ES = original, no map needed
};

// ----- Identificador de UNIDADES traducibles -----
// Una "unidad" = elemento con sólo texto + inline tags simples (br/strong/em/span).
// Se traduce el textContent completo como bloque (preserva contexto = mejor traducción)
const PURE_SYMBOLS = /^[0-9°·%+×/\-\s.,()'":;!?ºª&·×÷±–—•…]+$/;
const INLINE_TAGS = new Set(['BR','STRONG','EM','B','I','SPAN','SUP','SUB','U','MARK','SMALL','CODE']);
const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','SVG','OPTION']);
const SKIP_SELECTORS = '#worldMap,.leaflet-container,.fab-stack,.cert-marquee,.skip-translate,.cv-marker-hq,.cv-marker-mkt,.solar-viz,.cf-lines,.cf-ring,.lang-flag,.cf-emoji,.bc-illus';

function isUntranslatable(text){
  if (!text || text.trim().length < 2) return true;
  const t = text.trim();
  if (PURE_SYMBOLS.test(t)) return true;
  if (/^https?:\/\//.test(t)) return true;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(t)) return true;
  if (/^\+?[\d\s().-]{6,}$/.test(t)) return true;
  return false;
}

// Decode entidades HTML (&amp; → &)
const _decoder = document.createElement('textarea');
function decodeEntities(s){ _decoder.innerHTML = s; return _decoder.value; }

// Captura unidades traducibles. Cada unidad = { el, originalText, originalHTML, parentTag }
// Para elementos con sólo inline children, capturamos el elemento padre y traducimos su textContent.
const units = [];
function collectUnits(){
  units.length = 0;
  const root = document.querySelector('main') || document.body;
  const seen = new Set();

  function isUnit(el){
    if (!el || SKIP_TAGS.has(el.tagName)) return false;
    if (el.closest(SKIP_SELECTORS)) return false;
    // Sin hijos elemento → es text leaf
    if (el.children.length === 0) return el.textContent.trim().length > 0;
    // Tiene hijos: pero TODOS son inline simples (BR/STRONG/EM/SPAN sin nested complex)
    for (const c of el.children) {
      if (!INLINE_TAGS.has(c.tagName)) return false;
      // hijo inline con hijos complejos → recursivo
      for (const cc of c.children) {
        if (!INLINE_TAGS.has(cc.tagName)) return false;
      }
    }
    return el.textContent.trim().length > 0;
  }

  function walk(el){
    if (!el || SKIP_TAGS.has(el.tagName)) return;
    if (el.closest && el.closest(SKIP_SELECTORS)) return;
    if (seen.has(el)) return;

    if (isUnit(el)) {
      const text = el.textContent;
      if (!isUntranslatable(text)) {
        units.push({ el, originalText: text, originalHTML: el.innerHTML });
        seen.add(el);
      }
      return; // no recurrir más en una unidad
    }
    for (const child of el.children) walk(child);
  }
  walk(root);
}
function snapshotTextNodes(){ collectUnits(); }
function snapshot(){ collectUnits(); }
const textNodes = units; // alias retrocompatible

// ----- AI translation: RunPod custom API (Argos Translate, GPU, batch) -----
// Cache en localStorage para evitar re-llamar la API en re-visitas.
const AI_CACHE_KEY = 'cv-ai-cache-v2';
const AI_ENDPOINT = 'https://rendering-totally-production-looksmart.trycloudflare.com/translate';
let aiCache;
try { aiCache = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || '{}'); }
catch(_){ aiCache = {}; }
function saveCache(){
  try { localStorage.setItem(AI_CACHE_KEY, JSON.stringify(aiCache)); } catch(_){}
}

// MyMemory de fallback si el RunPod no responde
async function aiTranslateMyMemory(text, lang){
  const map = { en:'es|en', fr:'es|fr', pt:'es|pt-pt', zh:'es|zh-CN', de:'es|de', it:'es|it' };
  const pair = map[lang]; if (!pair) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}&de=info@cabovirgenes.com`;
    const r = await fetch(url); if (!r.ok) return text;
    const data = await r.json();
    const out = data?.responseData?.translatedText;
    if (!out || /MYMEMORY WARNING|INVALID/i.test(out)) return text;
    return out;
  } catch(e){ return text; }
}

// Translate single text — primero RunPod, luego MyMemory fallback
async function aiTranslate(text, lang){
  if (lang === 'es') return text;
  const key = lang + '||' + text;
  if (aiCache[key]) return aiCache[key];
  // Intentar batch RunPod primero
  try {
    const r = await fetch(AI_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ texts:[text], target_lang: lang, source_lang:'es' }),
    });
    if (r.ok) {
      const data = await r.json();
      const out = data?.translations?.[0];
      if (out && out !== text) {
        aiCache[key] = out; saveCache();
        return out;
      }
    }
  } catch(e){ /* fallthrough a MyMemory */ }
  // Fallback MyMemory
  const out = await aiTranslateMyMemory(text, lang);
  if (out && out !== text) { aiCache[key] = out; saveCache(); }
  return out;
}

// Batch translate — más eficiente: 1 sola llamada al RunPod por N textos
async function aiTranslateBatch(texts, lang){
  if (lang === 'es' || !texts.length) return texts;
  // Usa cache para los ya conocidos
  const out = new Array(texts.length);
  const todo = []; const todoIdx = [];
  texts.forEach((t, i) => {
    const key = lang + '||' + t;
    if (aiCache[key]) out[i] = aiCache[key];
    else { todo.push(t); todoIdx.push(i); }
  });
  if (!todo.length) return out;
  try {
    const r = await fetch(AI_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ texts: todo, target_lang: lang, source_lang:'es' }),
    });
    if (r.ok) {
      const data = await r.json();
      const trs = data?.translations || [];
      trs.forEach((tr, j) => {
        const idx = todoIdx[j];
        if (tr && tr !== todo[j]) {
          aiCache[lang + '||' + todo[j]] = tr;
          out[idx] = tr;
        } else {
          out[idx] = todo[j];
        }
      });
      saveCache();
      return out;
    }
  } catch(e){ /* fallthrough */ }
  // Fallback uno por uno con MyMemory
  for (let j = 0; j < todo.length; j++) {
    const tr = await aiTranslateMyMemory(todo[j], lang);
    out[todoIdx[j]] = tr;
    if (tr && tr !== todo[j]) aiCache[lang + '||' + todo[j]] = tr;
  }
  saveCache();
  return out;
}

// ----- Set language -----
function setLoadingState(active){
  document.documentElement.classList.toggle('translating', active);
}
async function setLanguage(lang){
  if (units.length === 0) collectUnits();
  document.documentElement.lang = lang;
  try { localStorage.setItem('cv-lang', lang); } catch(_){}

  // 1) Restaurar HTML original
  if (lang === 'es') {
    units.forEach(({ el, originalHTML }) => {
      if (el && el.isConnected) el.innerHTML = originalHTML;
    });
    window.dispatchEvent(new CustomEvent('langchange', { detail:{ lang } }));
    return;
  }

  // 2) Apply dictionary primero (instantáneo)
  const map = dict[lang] || {};
  const toAI = [];
  units.forEach((u) => {
    const { el, originalText, originalHTML } = u;
    if (!el || !el.isConnected) return;
    const text = originalText.trim().replace(/\s+/g,' ');
    if (!text) return;
    const decoded = decodeEntities(text);
    const trans = map[text] || map[decoded];
    if (trans) {
      el.textContent = trans;
    } else {
      // Aún en ES, mandamos a AI
      el.innerHTML = originalHTML;
      toAI.push({ el, text: decoded });
    }
  });

  window.dispatchEvent(new CustomEvent('langchange', { detail:{ lang } }));

  // AI batch — 1 sola llamada al RunPod con todos los textos
  if (toAI.length) {
    setLoadingState(true);
    // Procesa en super-batches de 30 textos por request (evita payload gigante)
    const SUPER_BATCH = 30;
    for (let i = 0; i < toAI.length; i += SUPER_BATCH) {
      if (document.documentElement.lang !== lang) break;
      const slice = toAI.slice(i, i + SUPER_BATCH);
      const texts = slice.map(s => s.text);
      const trs = await aiTranslateBatch(texts, lang);
      if (document.documentElement.lang !== lang) break;
      slice.forEach((s, j) => {
        const tr = trs[j];
        if (!tr || tr === s.text || !s.el.isConnected) return;
        s.el.textContent = tr;
      });
    }
    setLoadingState(false);
  }
  window.dispatchEvent(new CustomEvent('langchange', { detail:{ lang } }));
}

// ----- API pública -----
window.cvI18n = {
  setLanguage,
  translateAI: (text, lang) => aiTranslate(text, lang),
};

// ----- Init: snapshot tras carga completa + persistencia -----
function initI18n(){
  // Espera 200ms para que componentes dinámicos (Lucide icons, etc) terminen
  setTimeout(() => {
    snapshotTextNodes();
    const stored = (()=>{ try { return localStorage.getItem('cv-lang'); } catch(_){ return null; } })();
    if (stored && stored !== 'es') setLanguage(stored);
  }, 250);
}
if (document.readyState === 'complete') initI18n();
else window.addEventListener('load', initI18n);
