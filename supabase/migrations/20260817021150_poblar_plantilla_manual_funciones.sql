-- Migración aplicada a producción el 17/08/2026.
-- Archivo documental retroactivo — el SQL original no quedó en el repo.
-- Inserta las 15 áreas y 50 cargos de la plantilla global de manual de funciones.
-- Todos los UUIDs son fijos para mantener referencia estable entre entornos.

-- Áreas de la plantilla
INSERT INTO public.manual_plantilla_areas (id, nombre, orden) VALUES
  ('392ecf3f-8157-42ff-870a-361d202cef33', 'Administrativa',            0),
  ('1cf001c0-e9f1-4e05-9806-067e0dc3ce39', 'Calidad y Mejora Continua', 1),
  ('ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Comercial',                 2),
  ('516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Comercial Promocionales',   3),
  ('b4189b6c-fb13-4d46-8817-8e29c6b5c1e7', 'Compras / Importaciones',   4),
  ('d6732833-11c5-47d5-b8e2-af48c9fc40da', 'Contabilidad',              5),
  ('f682e51d-e3af-42d1-aef9-0e61d4d18ee4', 'Crédito y Cobranzas',       6),
  ('2aa7dab2-03b7-4f2d-b5f1-593e670f12c8', 'Finanzas',                  7),
  ('fadd1a87-b9d4-4f81-b400-2f4360815cf4', 'Gerencia General',          8),
  ('46372ad8-b2d6-4f85-ab07-f1f2beb39dff', 'Legal y Compliance',        9),
  ('deaed548-fb1b-48a4-94bb-228702033b41', 'Logística',                10),
  ('b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Mercadeo',                 11),
  ('e7d199f5-5d0a-43ed-a1bf-9a7b651dfbfe', 'Personalización',          12),
  ('019a02a9-697d-4ffb-ac14-83679449552e', 'Planificación Estratégica', 13),
  ('65114a92-f9a6-453b-953e-901539a2831d', 'Servicio al Cliente',       14)
ON CONFLICT (id) DO NOTHING;

-- Cargos de la plantilla
INSERT INTO public.manual_plantilla_cargos (id, plantilla_area_id, cargo) VALUES
  -- Administrativa (392ecf3f)
  ('0484bda0-e5dc-455f-a0e8-1318008821c2', '392ecf3f-8157-42ff-870a-361d202cef33', 'Coordinador de Mantenimiento de Equipos e Instalaciones'),
  ('95eeda3b-e919-44e9-9db3-4ef9f7a239d4', '392ecf3f-8157-42ff-870a-361d202cef33', 'Coordinador de RRHH'),
  ('e616d8c7-44de-4bb7-a4b0-c76579654417', '392ecf3f-8157-42ff-870a-361d202cef33', 'Encargado de Limpieza / Servicios Generales'),
  ('40735179-f1c8-40b4-a2dd-5a5ccc58a982', '392ecf3f-8157-42ff-870a-361d202cef33', 'Gerente Administrativo'),
  -- Calidad y Mejora Continua (1cf001c0)
  ('f3ec7db0-f48f-426a-ae7c-c8e33bdbe125', '1cf001c0-e9f1-4e05-9806-067e0dc3ce39', 'Coordinador de Calidad'),
  -- Comercial (ec853c8d)
  ('493c428c-5aa4-4bfe-afcf-f5c90b6bef5e', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Cajera'),
  ('fed27d0b-f5b2-4c61-a9e4-ebca9660fc4f', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Ejecutivo de Ventas · Canal Mayorista'),
  ('8fdca839-d395-4bbc-b5d6-67e001f24aef', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Encargado de Tienda'),
  ('178f528b-f0cd-4c30-a900-40b8dec5f9ed', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Gerente Comercial · Motociclismo'),
  ('b060527d-3e6d-4520-8f0d-2154292c6ad3', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Jefe de Tiendas'),
  ('8caa8805-b938-4ec2-bc44-9b290075900a', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'KAM Corporativo · Motociclismo'),
  ('6ab9fb8e-488e-4265-809d-c10bfa95c015', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Supervisor de Ventas · Motociclismo'),
  ('99ad5e71-0ab6-4240-b705-ebacb1ccb478', 'ec853c8d-50b8-4897-a6a8-4fc4007ddf9a', 'Vendedor de Tienda · Motociclismo'),
  -- Comercial Promocionales (516cf60d)
  ('1d98ab5b-8f33-41d6-bbc9-fe7376181ba8', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Asistente de Gerencia Comercial'),
  ('32aa9d8f-239e-47c4-bbcf-c447e03d5e17', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Ejecutivo de Cuenta · Promocionales'),
  ('56bdab01-d6ea-4781-87ad-33ff5c0a6e3f', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Gerente Comercial · Promocionales'),
  ('96d8ed4d-94a7-4ecd-8a62-083eb169114b', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'KAM de Promocionales'),
  ('fe92bfeb-d2d9-4038-9c63-cac3cfa5cef1', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Supervisor de Ventas · Promocionales'),
  ('dcec1ce7-3053-4ac6-8dee-f5e9ab56e966', '516cf60d-3a7c-4c88-ad9d-c7a85f674b23', 'Vendedor de Promocionales'),
  -- Compras / Importaciones (b4189b6c)
  ('c5396211-5089-4bff-a8c3-b9b0dc509d93', 'b4189b6c-fb13-4d46-8817-8e29c6b5c1e7', 'Asistente de Importaciones'),
  ('ec97fca6-f490-4159-93fc-d842bc48df55', 'b4189b6c-fb13-4d46-8817-8e29c6b5c1e7', 'Gerente de Compras'),
  ('7f685816-642c-4748-8a76-720484506822', 'b4189b6c-fb13-4d46-8817-8e29c6b5c1e7', 'Jefe de Importaciones'),
  ('1eb80625-1dc7-4ff7-9ddb-7d000bca0010', 'b4189b6c-fb13-4d46-8817-8e29c6b5c1e7', 'Negociador Internacional'),
  -- Contabilidad (d6732833)
  ('a12161be-a7f6-487e-969f-2097de836c9c', 'd6732833-11c5-47d5-b8e2-af48c9fc40da', 'Asistente Administrativa'),
  ('53942535-204c-483c-b0cc-ca82bc9329b3', 'd6732833-11c5-47d5-b8e2-af48c9fc40da', 'Asistente Contable'),
  ('ce1b0deb-d889-4593-a283-c33c808a0d3b', 'd6732833-11c5-47d5-b8e2-af48c9fc40da', 'Contador General'),
  -- Crédito y Cobranzas (f682e51d)
  ('274a117d-1673-4bde-872d-073fb88d63f9', 'f682e51d-e3af-42d1-aef9-0e61d4d18ee4', 'Analista de Crédito y Cobranzas'),
  ('c5af68ab-6324-4d09-8cb9-028b48d7b07c', 'f682e51d-e3af-42d1-aef9-0e61d4d18ee4', 'Jefe de Crédito y Cobranzas'),
  -- Finanzas (2aa7dab2)
  ('5fad2dfc-6260-4e5b-a0ea-7e2473f168a9', '2aa7dab2-03b7-4f2d-b5f1-593e670f12c8', 'Analista de Tesorería'),
  ('5e02868b-84f0-44fb-9e2e-b4ead5917bda', '2aa7dab2-03b7-4f2d-b5f1-593e670f12c8', 'Analista Financiero'),
  ('2753caff-0fec-44e3-bb89-cf8d5378485d', '2aa7dab2-03b7-4f2d-b5f1-593e670f12c8', 'Gerente Financiero / CFO'),
  -- Gerencia General (fadd1a87)
  ('e053570a-57a5-4060-994b-369d22b1ee31', 'fadd1a87-b9d4-4f81-b400-2f4360815cf4', 'Gerente General'),
  -- Legal y Compliance (46372ad8)
  ('b4395ec0-5e93-4442-936c-8397f9060789', '46372ad8-b2d6-4f85-ab07-f1f2beb39dff', 'Asesor Legal Corporativo'),
  -- Logística (deaed548)
  ('ac7ea41d-f70b-4a46-ac65-c2ca7c0aacbe', 'deaed548-fb1b-48a4-94bb-228702033b41', 'Bodeguero'),
  ('85add8ec-8177-4fe4-95b2-f1e086a319da', 'deaed548-fb1b-48a4-94bb-228702033b41', 'Coordinador de Garantías y Posventa'),
  ('361b155f-bc04-4b0d-bb59-2527db58f9bd', 'deaed548-fb1b-48a4-94bb-228702033b41', 'Jefe de Bodega'),
  ('3ecb3e3c-56ec-4acf-8f32-b9fa869b7674', 'deaed548-fb1b-48a4-94bb-228702033b41', 'Jefe de Logística'),
  ('9182ee68-40ca-4b66-8aa3-48d37d8062bc', 'deaed548-fb1b-48a4-94bb-228702033b41', 'Transportista'),
  -- Mercadeo (b693bf73)
  ('4b6d9d94-a889-4ee6-a2aa-86ac2ee8be74', 'b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Community Manager'),
  ('ce2b7629-b89c-4323-bc63-222fb0c6d489', 'b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Coordinador de Activaciones y Eventos'),
  ('6f02db1b-cdac-4516-bd5b-2afa8e49ae66', 'b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Director de Mercadeo'),
  ('d955f8dd-f3ab-4249-9092-5f5133ecb354', 'b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Diseñador Gráfico'),
  ('43e7b076-7577-45c1-b2e1-bbe795ba4c1c', 'b693bf73-9bee-4d9a-bff8-1a4ea730f6c7', 'Productor Audiovisual'),
  -- Personalización (e7d199f5)
  ('3a601c5e-f2a6-43ba-9a46-cc5ea860dc22', 'e7d199f5-5d0a-43ed-a1bf-9a7b651dfbfe', 'Operario de Personalización'),
  ('1d49268c-11e4-4ea4-9ec2-1cad393ae4fa', 'e7d199f5-5d0a-43ed-a1bf-9a7b651dfbfe', 'Supervisor de Personalización'),
  -- Planificación Estratégica (019a02a9)
  ('5384b36b-28c7-456f-900b-4ea3ad36ab7b', '019a02a9-697d-4ffb-ac14-83679449552e', 'Analista de Control de Gestión y Datos'),
  ('9bfd729e-2cfe-495d-ba3b-7edac67cf42f', '019a02a9-697d-4ffb-ac14-83679449552e', 'Analista de Nuevos Negocios'),
  ('328fc2fb-9115-4b3c-a1b5-bb8bf2dd21d4', '019a02a9-697d-4ffb-ac14-83679449552e', 'Coordinador de TI - Sistemas'),
  ('03269199-e66e-4f17-aefa-181691124d8f', '019a02a9-697d-4ffb-ac14-83679449552e', 'Gerente de Planificación Estratégica'),
  -- Servicio al Cliente (65114a92)
  ('d92fe72d-3ad0-4ef5-a267-07c68b47963d', '65114a92-f9a6-453b-953e-901539a2831d', 'Coordinador de Servicio al Cliente')
ON CONFLICT (id) DO NOTHING;
