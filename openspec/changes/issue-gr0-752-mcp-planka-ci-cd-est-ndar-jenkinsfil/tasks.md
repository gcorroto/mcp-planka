# Tasks

## 1. Implementación

- [x] 1.1 Crear el `Jenkinsfile` de raíz con las dos líneas exactas indicadas en la incidencia (Scenario: Entrada del pipeline).
- [x] 1.2 En `package.json`, eliminar `postpublish`, `release:patch` y `prerelease`; añadir `check` y sustituir `release:minor` y `release:major` por los comandos exactos de la incidencia, conservando los tres scripts `version:*` y el campo `version` (Scenarios: Release minor o major; Scripts de publicación y verificación).
- [x] 1.3 Sustituir únicamente los tres valores de `inspector:demo` por los placeholders literales indicados y corregir `homepage`, `bugs` y `repository` (Scenarios: Marcadores del inspector; Enlaces del paquete).
- [x] 1.4 Añadir al README la sección «Releasing» con el estándar en cuatro líneas, sin detalles internos del pipeline (Scenario: Documentación de releases).

## 2. Verificación local

- [x] 2.1 Revisar el contenido exacto del Jenkinsfile, los scripts y metadatos, los placeholders, la documentación y que `version` y los scripts `version:*` no hayan cambiado; comprobar que ningún script publique ni haga push de tags de versiones (Scenarios: Entrada del pipeline; Release minor o major; Scripts de publicación y verificación; Marcadores del inspector; Enlaces del paquete; Documentación de releases).
- [x] 2.2 Instalar las dependencias necesarias y ejecutar `npm run check`; documentar en el PR cualquier comprobación que no pueda ejecutarse en el sandbox (Scenario: Scripts de publicación y verificación).

## Verificación tras el despliegue

- [ ] Comprobar en Jenkins que un push a `main` incrementa el patch, crea el commit con `[ci skip]` y el tag y publica sin segundo build (Scenario: Patch automático).
- [ ] Comprobar que Jenkins publica una versión minor o major ya incrementada sin volver a incrementarla (Scenario: Release minor o major).
