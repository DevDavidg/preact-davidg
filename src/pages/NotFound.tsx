import { FunctionComponent } from "preact";
import { Link } from "preact-router/match";

const NotFound: FunctionComponent = () => {
  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-light-primary dark:text-dark-primary mb-4">
          404 - Página no encontrada
        </h1>
        <p class="text-light-muted dark:text-dark-muted mb-8">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          path="/"
          class="px-6 py-3 bg-light-accent dark:bg-dark-accent text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
