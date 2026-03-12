# Si un usuario no esta en el grupo de docker debe usar `sudo docker`
docker := if `groups $USER` =~ "docker" { "docker" } else { "sudo docker" }
# Nombre del servicio
servicio := 'rag-api'
container := 'rag-api'

# Al ejecutar `just` sin comandos muestra el listado de comandos disponibles
_default:
    @just --list --unsorted

#: Iniciar el backend
deploy:
    {{docker}} compose up -d

#: Detener el backend
down:
    {{docker}} compose down

#: Mostrar logs de la base de datos
logs:
	{{docker}} logs --follow {{servicio}}

#: Ejecuta bash dentro del container
bash:
	{{docker}} exec -it {{servicio}} sh
