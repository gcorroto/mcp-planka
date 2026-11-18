# Specification

## Requirement: Publicación npm desde CI

Como mantenedor, quiero que Jenkins gestione la publicación npm, para mantener un proceso de versiones coherente.

#### Scenario: Entrada del pipeline

- GIVEN el repositorio
- WHEN se inspecciona el `Jenkinsfile` de raíz
- THEN contiene exactamente `@Library('jenkins-voip-reporter@main') _` y `publishNpmLibrary()` en dos líneas.

#### Scenario: Patch automático

- GIVEN un push a `main`
- WHEN Jenkins ejecuta el pipeline de publicación
- THEN incrementa el patch, crea el commit `chore(release): vX.Y.Z [ci skip]` y el tag `vX.Y.Z`, y publica en npm sin provocar otro build por ese commit.

#### Scenario: Release minor o major

- GIVEN una versión minor o major preparada por el mantenedor
- WHEN ejecuta `npm run release:minor` o `npm run release:major`
- THEN el script correspondiente ejecuta `version:minor` o `version:major`, crea el commit `chore(release): vX.Y.0` sin `[ci skip]` y hace `git push`, sin publicar ni crear un tag.
- AND Jenkins publica esa versión sin incrementarla de nuevo.

#### Scenario: Scripts de publicación y verificación

- GIVEN los scripts de `package.json`
- WHEN se inspeccionan
- THEN `postpublish`, `release:patch` y `prerelease` no existen, ningún script ejecuta `npm publish` ni hace push de tags de versiones, y `version:patch`, `version:minor` y `version:major` permanecen sin cambios.
- AND `check` ejecuta `npm run build && npm test` y termina correctamente cuando sus dependencias están disponibles.
- AND el campo `version` no cambia en este cambio.

#### Scenario: Documentación de releases

- GIVEN la sección «Releasing» del README
- WHEN un mantenedor consulta el proceso
- THEN encuentra en cuatro líneas que el patch es automático en CI, que minor y major usan `npm run release:*` y que solo CI publica, sin detalles internos del pipeline.

## Requirement: Configuración de ejemplo y metadatos npm

Como usuario del paquete, quiero ejemplos sin valores con apariencia de credenciales reales y enlaces al repositorio correcto, para configurar el inspector y localizar el proyecto.

#### Scenario: Marcadores del inspector

- GIVEN el script `inspector:demo`
- WHEN se inspecciona
- THEN solo cambian sus tres valores a `PLANKA_ADMIN_ID=<admin-id>`, `PLANKA_AGENT_EMAIL=<agent-email>` y `PLANKA_AGENT_PASSWORD=<agent-password>`; el resto del script permanece igual.

#### Scenario: Enlaces del paquete

- GIVEN los metadatos de `package.json`
- WHEN se consultan `homepage`, `bugs` y `repository`
- THEN apuntan respectivamente a `https://github.com/gcorroto/mcp-planka`, `https://github.com/gcorroto/mcp-planka/issues` y al repositorio Git `git+https://github.com/gcorroto/mcp-planka.git` con tipo `git`.
