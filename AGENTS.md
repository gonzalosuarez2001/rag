# Agents

## Propósito del sistema

Este sistema implementa un **RAG universitario** que responde consultas de alumnos utilizando información proveniente de dos fuentes principales:

1. **Documentos universitarios vectorizados**
   - Contienen reglas de negocio y normativa institucional.
   - Ejemplos:
     - Regularidad
     - Planes de carrera
     - Correlatividades
     - Procedimientos administrativos
     - Reglamentos académicos

2. **Base de datos institucional**
   - Información específica del alumno que realiza la consulta.
   - Estos datos se obtienen mediante **tools** que ejecutan funciones del backend con **consultas predefinidas**.

---

## Uso de Tools

Las tools permiten obtener información personalizada del alumno.

- Las tools **siempre utilizan el `id` del alumno autenticado**.
- Las consultas a la base de datos **solo pueden realizarse mediante las tools disponibles**.