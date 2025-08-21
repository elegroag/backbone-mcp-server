# Backbone Master Profesional

En el libro, construirás una aplicación funcional aplicando los conceptos que aquí se exponen. La aplicación es lo suficientemente simple como para poner en práctica los conceptos básicos al crear aplicaciones frontend escalables con Backbone. En cualquier momento, puede ver el código del proyecto en el repositorio de libros en https://github.com/abiee/mastering-backbone

## Capítulo 1. Arquitectura de una aplicación Backbone

Una de las mejores cosas de Backbone es la libertad de crear aplicaciones con las bibliotecas que elijas, sin pilas. Tenga en cuenta que Backbone no es un marco sino una biblioteca; Debido a esto, crear aplicaciones con Backbone puede ser un desafío ya que no se proporciona ninguna estructura. Usted, como desarrollador, es responsable de la organización del código y de cómo conectar las partes del código a través de la aplicación; es una gran responsabilidad. Las malas decisiones pueden generar aplicaciones con errores y que no se pueden mantener con las que nadie quiere trabajar.

La organización del código en pequeñas aplicaciones Backbone no es gran cosa. Cree un directorio para modelos, colecciones y vistas; poner un enrutador para todas las rutas posibles; y escriba la lógica de negocios directamente en las vistas. Sin embargo, esta forma de desarrollar aplicaciones Backbone no es adecuada para proyectos más grandes. Debería haber una mejor manera de separar las responsabilidades y la organización de archivos para crear aplicaciones mantenibles.

Este capítulo puede ser difícil de entender si no conoces Backbone en absoluto; Para comprender mejor los principios que se exponen aquí, necesitará comprender al menos los conceptos básicos de Backbone. Por lo tanto, si eres principiante en Backbone, te animo a que primero comprendas qué es Backbone y cómo funciona.

El objetivo de este capítulo es explorar las mejores prácticas de organización de proyectos en dos niveles principales: organización lógica y estructura de archivos. En este capítulo, aprenderá lo siguiente:

Delegar las responsabilidades adecuadas a los objetos proporcionados por Backbone
Definir objetos JavaScript simples para manejar la lógica fuera del alcance de los objetos Backbone
Dividir la aplicación en scripts pequeños y fáciles de mantener
Crear una estructura de archivos limpia para sus proyectos

### Arquitectura basada en subaplicaciones

Podemos componer una aplicación troncal con muchas subaplicaciones independientes. Las subaplicaciones deberían funcionar de forma independiente. Puedes pensar en cada una como una pequeña aplicación Backbone, con sus propias dependencias y responsabilidades; no debería depender directamente de otras subaplicaciones.
Las subaplicaciones deben centrarse en un área de dominio específica. Por ejemplo, puedes tener una subaplicación para facturas, otra para el buzón y una más para pagos; Con estas subaplicaciones implementadas, puedes crear una aplicación para administrar pagos por correo electrónico.
Para desacoplar las subaplicaciones entre sí, podemos crear una aplicación de infraestructura responsable de administrar las subaplicaciones, iniciar toda la aplicación y proporcionar a las subaplicaciones funciones y servicios comunes:

Puede utilizar la aplicación de infraestructura para proporcionar a sus subaplicaciones servicios como mensajes de confirmación y diálogo, ventanas emergentes de notificación, cuadros modales, etc. La aplicación de infraestructura no hace nada por sí sola, se comporta como un marco para las subaplicaciones.

Cuando una subaplicación quiere comunicarse con otra subaplicación, la aplicación de infraestructura se puede utilizar como canal de comunicación, esta puede aprovechar el Backbone.Event objeto para enviar y recibir mensajes.
En la siguiente figura, puede ver un escenario en el que las subaplicaciones se comunican a través de la aplicación de infraestructura. Cuando el usuario hace clic en Redactar mensaje en la subaplicación Buzón, la aplicación de infraestructura crea y representa la subaplicación Redactar correo y permite al usuario escribir un correo electrónico.

Cuando el usuario termina, debe hacer clic en el botón Enviar en la subaplicación Redactar ; luego el correo electrónico se envía a través de una API RESTful o usando SMTP simple, no importa, lo importante es que, cuando finaliza, dispara un evento en la email:sent aplicación de infraestructura.
La infraestructura la aplicación reenvía el evento a la subaplicación Buzón, para que se pueda actualizar la lista de correos electrónicos que se envían. Otra cosa interesante es que la aplicación de infraestructura puede usar el email:sent evento para mostrar un mensaje emergente exitoso al usuario para informarle que el correo electrónico se envió correctamente:

### Anatomía de subaplicación

Como se mencionó anteriormente, un la subaplicación es como una pequeña aplicación Backbone; Deben ser independientes de otras subaplicaciones y funcionar de forma independiente. Debería poder colocar la subaplicación Redactar correo en una página en blanco sin ninguna otra subaplicación y aún poder enviar correos electrónicos.
Para lograr esto, las subaplicaciones deben contener todos los objetos necesarios que deben ser autocontenidos. Puede ver que el punto de entrada de la subaplicación es Backbone.Router. Cuando el navegador cambia la URL y una ruta coincide con una subaplicación determinada, el enrutador crea un controlador de subaplicación y le delega el manejo de la ruta.

El controlador de subaplicación coordina los modelos/colecciones y cómo se muestran. El controlador puede indicarle a la infraestructura de la aplicación que muestre un mensaje de carga mientras se recuperan los datos y, cuando finaliza, el controlador puede crear las vistas necesarias con los modelos y colecciones que se recuperaron recientemente para mostrarlos en el DOM.

En resumen, una subaplicación se comporta exactamente como una pequeña aplicación Backbone, con la principal diferencia que utiliza la infraestructura de la Aplicación para delegar tareas comunes y un canal de comunicación entre las subaplicaciones.
En las siguientes secciones, examinaremos cómo se conectan estas partes y le mostraré el código para que funcione.Aplicación de contactos. La siguientesubaplicación:

### Responsabilidades de los objetos Backbone

Uno de los mayores problemas con la documentación de Backbone no debe tener ni idea de cómo utilizar sus objetos. Ustedes, como desarrolladores, deben determinar las responsabilidades de cada objeto en la aplicación; Si tiene algo de experiencia trabajando con Backbone, sabrá lo difícil que sería crear una aplicación Backbone.
En esta sección, describiré los mejores usos de los objetos Backbone. A partir de este punto, tendrá una idea más clara sobre el alcance de las responsabilidades en Backbone y esto liderará el diseño de nuestra arquitectura de aplicaciones. Tenga en cuenta que Backbone es una biblioteca que sólo contiene los objetos básicos; por lo tanto, necesitará traer sus propios objetos y estructura para crear aplicaciones Backbone escalables, comprobables y robustas.

### Views

Las responsabilidades de las vistas son manejar el modelo de objetos de documento ( DOM ) .y escuchar eventos de bajo nivel (eventos jQuery/DOM) y transfórmelos en de dominio. Las vistas de la Backbone trabajan en estrecha colaboración con motores de plantillas para crear marcas que representen la información contenida en modelos y colecciones.

Las vistas abstraen las interacciones del usuario, transformando sus acciones en estructuras de datos de valor comercial para la aplicación. Por ejemplo, cuando se activa un evento de clic desde un botón Guardar en el DOM, la vista debe transformar el evento en algo similar a un save:contact evento usando Backbone Events con los datos escritos en el formulario. Luego, un objeto de dominio específico puede aplicar cierta lógica empresarial a los datos y mostrar un resultado.

Es una regla que se debe evitar la lógica empresarial en las vistas; sin embargo, se permiten validaciones de formularios básicos, como aceptar solo números. Aún se deben realizar validaciones complejas en el modelo o el controlador.

### Models

Modelos de Backbone Son como puertas de enlace de bases de datos en el lado del servidor, su uso principal es buscar y guardar datos hacia y desde un servidor RESTful y luego proporcionar una API al resto de la aplicación para manejar la información. Pueden ejecutar lógica empresarial de propósito general, como validación y transformación de datos, manejar otras conexiones de servidor y cargar una imagen para un modelo.
Los modelos no sé nada sobre vistas; sin embargo, pueden implementar funciones que sean útiles para las vistas. Por ejemplo, puede tener una vista que muestre el total de una factura y el modelo de factura puede implementar un método que haga el cálculo, dejando la vista sin conocimiento del cálculo.

### Collections

Tu puedes pensar en Colecciones Backbone como contenedor de un conjunto de Modelos Backbone, por ejemplo, una Colección de Contacts modelos. Con un modelo, sólo puede recuperar un único documento a la vez; sin embargo, Colecciones Nos permite recuperar listas de modelos.
Una gran diferencia con los Modelos es que las Colecciones deben usarse como de solo lectura, obtienen los datos pero no deben escribirse en el servidor; Además, no es habitual ver aquí lógica empresarial.

Otro uso de Collection es abstraer las respuestas de las API RESTful, ya que cada servidor tiene diferentes formas de manejar una lista de recursos. Por ejemplo, mientras algunos servidores aceptan un skip parámetro para la paginación, otros tienen un page parámetro para el mismo propósito. Otro caso es el de las respuestas, un servidor puede responder con una matriz simple, mientras que otros prefieren enviar un objeto con una clave data, list u otra clave, donde se coloca la matriz de objetos. No existe una forma estándar. Las colecciones pueden solucionar estos problemas, haciendo que las solicitudes del servidor sean transparentes para el resto de la aplicación.

### Routers

Los routers tienen un sencillo responsabilidad: escuchar los cambios de URL en el navegador y transformarlos en una llamada a un controlador. Un enrutador sabe a qué controlador llamar para una URL determinada. Además, deben decodificar los parámetros de la URL y pasarlos a los controladores. La aplicación de infraestructura inicia la aplicación; sin embargo, los enrutadores deciden qué subaplicación se ejecutará. De esta forma, los routers son una especie de punto de entrada.

### Objetos no proporcionados por Backbone

Es posible desarrollar aplicaciones Backbone utilizando únicamente los objetos Backbone que se describen en la sección anterior; sin embargo, para una aplicación de tamaño mediano a grande, no es suficiente. Necesitamos introducir un nuevo tipo de objeto con responsabilidades delimitadas que utilice y coordine los objetos básicos de Backbone.

Fachada de subaplicación
Este objeto es la interfaz pública de las subaplicaciones. Cualquier interacción con las subaplicaciones debe realizarse a través de sus métodos. Se desaconsejan las llamadas realizadas directamente a objetos internos de la subaplicación. Normalmente, los métodos de este controlador se llaman desde el router; sin embargo, se les puede llamar desde cualquier lugar.

La principal responsabilidad de este objeto es simplificar los aspectos internos de la subaplicación. Su trabajo principal es recuperar datos del servidor a través de modelos o colecciones y, si ocurre algún error durante el proceso, se encarga de mostrar un mensaje de error al usuario.
Una vez que los datos se cargan en un modelo o colección, crea un controlador de subaplicación que conoce las vistas que deben representarse y hace que los controladores se ocupen de sus eventos.

### Controlador de subaplicación

Un controlador actúa como un controlador de tránsito aéreo para vistas, modelos y colecciones. Cuando se le proporciona un objeto de datos Backbone, creará una instancia y representará las vistas apropiadas y luego las coordinará. En diseños complejos, no es tarea fácil coordinar las vistas con los modelos y colecciones.

Aquí se debe implementar la lógica empresarial para los casos de uso. El controlador de subaplicación implementa un Patrón mediador , que permite que otros objetos básicos, como vistas y modelos, mantengan un acoplamiento simple y flexible.

Debido a razones de acoplamiento débil, una vista no debe llamar directamente a métodos o eventos de otras vistas. En lugar de esto, una vista desencadena eventos y el controlador maneja el evento y organiza el comportamiento de las vistas si es necesario. Observe cómo las vistas están aisladas, manejan sólo su porción de DOM y activan eventos cuando es necesario para comunicar algo.

### Aplicación de contactos

En este libro desarrollaremos una sencilla aplicación de contactos para demostrar cómo desarrollar aplicaciones Backbone siguiendo los principios explicados a lo largo de este libro. La aplicación debería poder enumerar todos los contactos disponibles en RESTful API y proporcionar los mecanismos para mostrarlos y editarlos.

La aplicación se inicia cuando la infraestructura de la aplicación se carga en el navegador y start() se llama al método. Arrancará todos los componentes comunes y luego creará una instancia de todos los enrutadores disponibles en las subaplicaciones:

```js
// app.js
const App = {
  Models: {},
  Collections: {},
  Routers: {},
  start() {
    // Initialize all available routes
    _.each(_.values(this.Routers), function (Router) {
      new Router();
    });
    // Create a global router to enable sub-applications to
    // redirect to other urls
    App.router = new DefaultRouter();
    Backbone.history.start();
  },
};
```

El punto de entrada de la subaplicación viene dada por sus rutas, que idealmente comparten el mismo espacio de nombres. Por ejemplo, en la subaplicación de contactos, todas las rutas comienzan con el contacts/prefijo:

Contacts: Esto enumera todos los contactos disponibles
contacts/new: Esto muestra un formulario para crear un nuevo contacto.
contacts/view/:id: Esto muestra una factura dada su identificación.
contacts/edit/:id: Esto muestra un formulario para editar un contacto.

Subaplicaciones debe registrar sus routes en el App.Routers objeto global para poder ser inicializado. Para la subaplicación Contactos, ContactsRouter hace el trabajo:

```js
// apps/contacts/router.js
'use strict';

App.Routers = App.Routers || {};
class ContactsRouter extends Backbone.Router {
  constructor(options) {
    super(options);
    this.routes = {
    'contacts': 'showContactList',
    'contacts/page/:page': 'showContactList',
    'contacts/new': 'createContact',
    'contacts/view/:id': 'showContact',
    'contacts/edit/:id': 'editContact'
    };
    this.bindRoutes();
  }

  showContactList(page) {
    // Page should be a postive number grater than 0
    page = page || 1;
    page = page > 0 ? page : 1;
    var app = this.startApp();
    app.showContactList(page);
  }

  createContact() {
    var app = this.startApp();
    app.showNewContactForm();
  }

  showContact(contactId) {
    var app = this.startApp();
    app.showContactById(contactId);
  }

  editContact(contactId) {
    var app = this.startApp();
    app.showContactEditorById(contactId);
  }

  startApp() {
    return App.startSubApplication(ContactsApp);
  }
}
// Register the router to be initialized by the infrastructure
// Application
App.Routers.ContactsRouter = ContactsRouter;
```

Cuando el usuario señala su navegador a una de estas rutas, se activa un controlador de ruta. La función del controlador analiza la URL y delega la solicitud a la fachada de la subaplicación:

El startSubApplication() método en el App objeto inicia una nueva subaplicación y cierra cualquier otra subaplicación que se esté ejecutando en un momento dado, esto es útil para liberar recursos en el navegador del usuario:

```js
const App = {
  // ...
  // Only a subapplication can be running at once, destroy any
  // current running subapplication and start the asked one
  startSubApplication(SubApplication) {
    // Do not run the same subapplication twice
    if (this.currentSubapp && this.currentSubapp instanceof SubApplication) {
      return this.currentSubapp;
    }
    // Destroy any previous subapplication if we can
    if (this.currentSubapp && this.currentSubapp.destroy) {
      this.currentSubapp.destroy();
    }
    // Run subapplication
    this.currentSubapp = new SubApplication({
      region: App.mainRegion,
    });
    return this.currentSubapp;
  },
};
```

### Consejo

Descargando el código de ejemplo
Puede descargar los archivos de código de ejemplo desde su cuenta en http://www.packtpub.com para todos los libros de Packt Publishing que haya comprado. Si compró este libro en otro lugar, puede visitar http://www.packtpub.com/support y registrarse para recibir los archivos directamente por correo electrónico.

El App.mainRegion atributo es una instancia de un Region objeto que apunta a un elemento DOM en la página; Las regiones son útiles para representar vistas en una región contenida del DOM. Aprenderemos más sobre este objeto en el Capítulo 2 , Gestión de vistas .

Cuando el Se inicia la subaplicación, se llama a un método de fachada para manejar la solicitud del usuario. La responsabilidad de la fachada es obtener los datos necesarios de la API RESTful y pasarlos a un controlador:

```js
// apps/contacts/app.js
'use strict';
class ContactsApp {
  constructor(options) {
    this.region = options.region;
  }
  showContactList() {
    App.trigger('loading:start');
    App.trigger('app:contacts:started');

    new ContactCollection().fetch({
      success: (collection) => {
        // Show the contact list subapplication if
        // the list can be fetched
        this.showList(collection);
        App.trigger('loading:stop');
      },
      fail: (collection, response) => {
        // Show error message if something goes wrong
        App.trigger('loading:stop');
        App.trigger('server:error', response);
      },
    });
  }

  showNewContactForm() {
    App.trigger('app:contacts:new:started');
    this.showEditor(new Contact());
  }

  showContactEditorById(contactId) {
    App.trigger('loading:start');
    App.trigger('app:contacts:started');

    new Contact({ id: contactId }).fetch({
      success: (model) => {
        this.showEditor(model);
        App.trigger('loading:stop');
      },
      fail: (collection, response) => {
        App.trigger('loading:stop');
        App.trigger('server:error', response);
      },
    });
  }

  showContactById(contactId) {
    App.trigger('loading:start');
    App.trigger('app:contacts:started');

    new Contact({ id: contactId }).fetch({
      success: (model) => {
        this.showViewer(model);
        App.trigger('loading:stop');
      },
      fail: (collection, response) => {
        App.trigger('loading:stop');
        App.trigger('server:error', response);
      },
    });
  }

  showList(contacts) {
    var contactList = this.startController(ContactList);
    contactList.showList(contacts);
  }

  showEditor(contact) {
    var contactEditor = this.startController(ContactEditor);
    contactEditor.showEditor(contact);
  }

  showViewer(contact) {
    var contactViewer = this.startController(ContactViewer);
    contactViewer.showContact(contact);
  }

  startController(Controller) {
    if (
      this.currentController &&
      this.currentController instanceof Controller
    ) {
      return this.currentController;
    }

    if (this.currentController && this.currentController.destroy) {
      this.currentController.destroy();
    }

    this.currentController = new Controller({
      region: this.region,
    });
    return this.currentController;
  }
}
```

La fachada El objeto recibe un objeto de región como argumento para indicar a la subaplicación dónde debe representarse.
Los Region objetos se verán en detalle en el Capítulo 2 , Gestión de vistas .
Cuando la fachada está obteniendo datos del servidor RESTful, loading:start se emite un evento en el App objeto para permitirnos mostrar la vista de carga en progreso para el usuario. Cuando finaliza la carga, crea y utiliza un controlador que sabe cómo manejar el modelo o la colección recuperada.

La lógica de negocios comienza cuando se invoca el controlador, generará todas las vistas necesarias para la solicitud y se las mostrará al usuario, luego escuchará las interacciones del usuario en las vistas:

Para el ContactList controlador, aquíes un código muy simple:

```js
// apps/contacts/contactLst.js
class ContactList {
  constructor(options) {
    // Region where the application will be placed
    this.region = options.region;

    // Allow subapplication to listen and trigger events,
    // useful for subapplication wide events
    _.extend(this, Backbone.Events);
  }

  showList(contacts) {
    // Create the views
    var layout = new ContactListLayout();
    var actionBar = new ContactListActionBar();
    var contactList = new ContactListView({ collection: contacts });

    // Show the views
    this.region.show(layout);
    layout.getRegion('actions').show(actionBar);
    layout.getRegion('list').show(contactList);

    this.listenTo(contactList, 'item:contact:delete', this.deleteContact);
  }

  createContact() {
    App.router.navigate('contacts/new', true);
  }

  deleteContact(view, contact) {
    let message = 'The contact will be deleted';
    App.askConfirmation(message, (isConfirm) => {
      if (isConfirm) {
        contact.destroy({
          success() {
            App.notifySuccess('Contact was deleted');
          },
          error() {
            App.notifyError('Ooops... Something went wrong');
          },
        });
      }
    });
  }
  // Close any active view and remove event listeners
  // to prevent zombie functions
  destroy() {
    this.region.remove();
    this.stopListening();
  }
}
```

La función que maneja la solicitud es muy simple y sigue el mismo patrón para todos los demás controladores, como sigue:

Crea todas las vistas necesarias con el modelo o colección que se pasa.
Representa las vistas en una región del DOM.
Escucha eventos en las vistas.

Si no lo haces del todo Entienda lo que significa región y diseño, no se preocupe, cubriré la implementación de estos objetos en detalle en el Capítulo 2 , Gestión de vistas . Aquí lo importante es el algoritmo descrito anteriormente:

Como puede ver en laCuando esto sucede, contact:delete se activa un evento, el controlador escucha el evento y usa el deleteContact() método para manejar el evento:

```js
deleteContact(view, contact) {
  let message = 'The contact will be deleted';
  App.askConfirmation(message, (isConfirm) => {
    if (isConfirm) {
      contact.destroy({
        success() {
          App.notifySuccess('Contact was deleted');
        },
        error() {
          App.notifyError('Ooops... Something went wrong');
        }
      });
    }
  });
}
```

El manejador es bastante fácil de entender, utiliza el askConfirmation()método de la aplicación de infraestructura para solicitar la confirmación del usuario. Si el usuario confirma la eliminación, el contacto se destruye. La aplicación de infraestructura proporciona dos métodos para mostrar notificaciones al usuario: notifySuccess()y notifyError().
Lo bueno de estos métodos de aplicación es que los controladores no necesitan conocer los detalles sobre los mecanismos de confirmación y notificación. Desde el punto de vista del controlador, simplemente funciona.
El método que solicita la confirmación puede ser una simple confirm()llamada, de la siguiente manera:

```js
// app.js

const App = {
  // ...
  askConfirmation(message, callback) {
    var isConfirm = confirm(message);
    callback(isConfirm);
  }
};

Sin embargo, en las aplicaciones web modernas, utilizar la confirm()función simple no es la mejor manera de solicitar confirmación. En su lugar, podemos mostrar un cuadro de diálogo Bootstrap o usar una biblioteca disponible para eso. Para simplificar, usaremos la agradable SweetAlert biblioteca JavaScript; sin embargo, puedes usar lo que quieras:

// app.js
const App = {
  // ...
  askConfirmation(message, callback) {
    var options = {
      title: 'Are you sure?',
      type: 'warning',
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes, do it!',
      confirmButtonColor: '#5cb85c',
      cancelButtonText: 'No'
    };

    // Show the message
    swal(options, function(isConfirm) {
      callback(isConfirm);
    });
  }
};
```

Podemos implementar los métodos de notificación de forma similar. Usaremos la noty biblioteca JavaScript; sin embargo, puedes usar lo que quieras:

```js
// app.js
const App = {
  // ...
  notifySuccess(message) {
    new noty({
      text: message,
      layout: 'topRight',
      theme: 'relax',
      type: 'success',
      timeout: 3000, // close automatically
    });
  },

  notifyError(message) {
    new noty({
      text: message,
      layout: 'topRight',
      theme: 'relax',
      type: 'error',
      timeout: 3000, // close automatically
    });
  },
};
```

Así es como se puede implementar una aplicación Backbone robusta y mantenible; vaya al repositorio de GitHub de este libro para ver el código completo de la aplicación. Las vistas no se tratan en el capítulo, ya que las veremos en detalle en el Capítulo 2 , Gestión de vistas .

### Organización de archivos

Cuando trabaja con marcos MVC, la organización de archivo es trivial. Sin embargo, Backbone no es un marco MVC, por lo tanto, la regla es traer su propia estructura de archivos. Puede organizar el código en estas rutas:

apps/: este directorio es donde viven los módulos o subaplicaciones. Todas las subaplicaciones deben estar en esta ruta.
Components/: estos son los componentes comunes que varias subaplicaciones requieren o utilizan en el diseño común como componente de ruta de navegación
core/: En esta ruta, podemos colocar todas las funciones principales, como utilidades, ayudantes, adaptadores, etc.
vendor/: En el proveedor, puede colocar todas las bibliotecas de terceros; aquí puedes poner Backbone y sus dependencias.
app.js: Este es el punto de entrada de la aplicación que se carga desde index.html
Las subaplicaciones pueden tener una estructura de archivos, ya que son una pequeña aplicación troncal.
models/: Esto define los modelos y colecciones.
app.js: Esta es la fachada de la aplicación que se llama desde el enrutador
router.js: Este es el enrutador de la aplicación instanciada por la aplicación raíz en el proceso de arranque.
contactList.js, contactEditor.js, contactViewer.js: Estos son los controladores de la aplicación.

Para una contacts aplicación, la organización del código puede ser como se muestra a continuación:

```text
.
├─ app.js                # Punto de entrada de la aplicación raíz
├─ index.html            # HTML principal
├─ vendor/               # Bibliotecas de terceros (Backbone, jQuery, Underscore, etc.)
│  ├─ backbone.js
│  ├─ jquery.js
│  └─ underscore.js
├─ core/                 # Funciones núcleo: utilidades, adaptadores, regiones
│  ├─ regions/
│  │  └─ region.js
│  ├─ adapters/
│  │  └─ restAdapter.js
│  └─ utils/
│     └─ templateLoader.js
├─ Components/          # Componentes compartidos (navbar, diálogos, notificaciones)
│  ├─ dialogs/
│  │  ├─ confirm.js
│  │  └─ notify.js
│  └─ navigation/
│     └─ navbar.js
└─ apps/                # Subaplicaciones
   └─ contacts/
      ├─ app.js         # Fachada de la subaplicación
      ├─ router.js      # Enrutador de la subaplicación
      ├─ models/        # Modelos y colecciones
      │  ├─ contact.js
      │  └─ contacts.js
      ├─ controllers/   # Controladores de caso de uso
      │  ├─ contactList.js
      │  ├─ contactEditor.js
      │  └─ contactViewer.js
      └─ views/         # Vistas y layouts
         ├─ ContactListLayout.js
         ├─ ContactListActionBar.js
         ├─ ContactListView.js
         ├─ ContactEditorView.js
         └─ ContactViewerView.js
```

### Resumen

Empezamos describiendo, de forma general, cómo funciona una aplicación Backbone. Describe dos partes principales: una aplicación raíz y subaplicaciones. La aplicación raíz proporciona una infraestructura común a otras aplicaciones más pequeñas y enfocadas que llamamos subaplicaciones.

Las subaplicaciones deben estar acopladas libremente con otras subaplicaciones y deben ser dueñas de sus recursos, como vistas, controladores, enrutadores, etc. Una subaplicación gestiona una pequeña parte del sistema con un valor de negocio bien enfocado y la comunicación entre las subaplicaciones y la aplicación de infraestructura se realiza a través de un bus controlado por eventos con Backbone.Events.

El usuario interactúa con la aplicación mediante vistas que representa una subaplicación. Un controlador de subaplicación organiza la interacción entre vistas, modelos y colecciones y posee la lógica empresarial para el caso de uso.

Finalmente, una organización del sistema de archivos explica los sitios adecuados para colocar sus archivos y mantener su proyecto limpio y organizado. Esta organización no sigue un patrón MVC; sin embargo, es poderoso y simple. Encapsula todo el código necesario para un módulo en una única ruta (rutas de subaplicación) en lugar de colocar todo el código en varias rutas.

De esta manera la estructura de las aplicaciones Backbone ha demostrado ser robusta, prueba de ello es que varias aplicaciones de código abierto como TodoMVC siguen (más o menos) los principios aquí expuestos. Facilita la capacidad de prueba del código debido a la separación de responsabilidades para que cada objeto pueda probarse por separado.

Las aplicaciones Backbone grandes a menudo se crean sobre Backbone Marionette, ya que reduce el código repetitivo; sin embargo, Marionette utiliza sus propias convenciones para funcionar. Si está de acuerdo con que use sus propias convenciones, estará feliz de usar Marionette encima de Backbone.

Sin embargo, si le encanta la libertad de hacer las cosas a su manera, es posible que prefiera Backbone simple y cree sus propias utilidades y clases.

En el próximo capítulo, le mostraré cómo administrar y organizar vistas y simplificar los diseños complejos, identificando los usos comunes de las vistas. Construirás vistas de propósito general que serán útiles para todos tus proyectos y te olvidarás de la implementación del render()método.
