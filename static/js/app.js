function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

const app = angular.module("angularjsApp", ["ngRoute"])
app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/app",
        controller: "appCtrl"
    })
    .when("/productos", {
        templateUrl: "/productos",
        controller: "productosCtrl"
    })
    .when("/clientes", {
        templateUrl: "/clientes",
        controller: "clientesCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})
app.run(["$rootScope", "$location", "$timeout", function($rootScope, $location, $timeout) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""

    actualizarFechaHora()

    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $("html").css("overflow-x", "hidden")
        
        const path = current.$$route.originalPath

        if (path.indexOf("splash") == -1) {
            const active = $(".app-menu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }

            $timeout(function () {
                $("html").css("overflow-x", "auto")

                $rootScope.slide = ""
            }, 1000)

            activeMenuOption(`#${path}`)
        }
    })
}])

app.controller("appCtrl", function ($scope, $http) {
    $("#frmInicioSesion").submit(function (event) {
        event.preventDefault()
        $.post("iniciarSesion", $(this).serialize(), function (respuesta) {
            if (respuesta.length) {
                alert("Iniciaste Sesión")
                window.location = "/#/productos"

                return
            }

            alert("Usuario y/o Contraseña Incorrecto(s)")
        })
    })
})
app.controller("productosCtrl", function ($scope, $http) {
    function buscarProductos() {
        $.get("/tbodyProductos", function (trsHTML) {
            $("#tbodyProductos").html(trsHTML)
        })
    }

    buscarProductos()
    
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true

    var pusher = new Pusher("e57a8ad0a9dc2e83d9a2", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("canalProductos")
    channel.bind("eventoProductos", function(data) {
        // alert(JSON.stringify(data))
        buscarProductos()
    })

    $(document).on("submit", "#frmProducto", function (event) {
        event.preventDefault()

        $.post("/producto", {
            id: "",
            nombre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val(),
            existencias: $("#txtExistencias").val(),
        })
    })

    $(document).on("click", ".btn-ingredientes", function (event) {
        const id = $(this).data("id")

        $.get(`/productos/ingredientes/${id}`, function (html) {
            modal(html, "Ingredientes", [
                {html: "Aceptar", class: "btn btn-secondary", fun: function (event) {
                    closeModal()
                }}
            ])
        })
    })
})

app.controller("clientesCtrl", function ($scope, $http) {

    // Función para cargar la tabla de clientes
    function cargarTablaClientes() {
        $.get("/tbodyClientes", function(html) {
            $("#tbodyClientes").html(html);
        });
    }

    // Llamada inicial para cargar clientes
    cargarTablaClientes();

    // Pusher para actualizar tabla en tiempo real
    Pusher.logToConsole = true;
    var pusher = new Pusher("bf79fc5f8fe969b1839e", { cluster: "us2" });
    var channel = pusher.subscribe("canalClientes");
    channel.bind("eventoClientes", function(data) {
        cargarTablaClientes(); // actualiza la tabla automáticamente
    });

    // Guardar cliente
    $(document).on("submit", "#frmCliente", function (event) {
        event.preventDefault();

        $.post("/cliente", {
            id: "",
            nombreCliente: $("#txtNombreCliente").val(),
            telefono: $("#txtTelefono").val(),
            correoElectronico: $("#txtCorreoElectronico").val(),
        }, function(response){
            console.log("Cliente guardado correctamente");
            $("#frmCliente")[0].reset();
            cargarTablaClientes(); 
        }).fail(function(xhr){
            console.error("Error al guardar cliente:", xhr.responseText);
        });
    });

    // Eliminar cliente (delegación de eventos)
    $(document).on("click", "#tbodyClientes .btn-eliminar", function(){
        const id = $(this).data("id");
        if(confirm("¿Deseas eliminar este cliente?")) {
            $.post("/clientes/eliminar", {id: id}, function(response){
                console.log("Cliente eliminado correctamente");
                cargarTablaClientes(); 
            }).fail(function(xhr){
                console.error("Error al eliminar cliente:", xhr.responseText);
            });
        }
    });

});

const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        // enableTime: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
        // time_24hr: false
    }

    activeMenuOption(location.hash)
})
