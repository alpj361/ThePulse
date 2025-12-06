"use client";

import { ArrowForward } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';

// Importar GIFs
import sondeosGif from '../../assets/gifs/Sondeos.gif';
import projectsGif from '../../assets/gifs/Projects.gif';
import trendsGif from '../../assets/gifs/Trends.gif';

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
}

export interface Gallery4Props {
  title?: string;
  description?: string;
  items?: Gallery4Item[];
}

const data = [
  {
    id: "sondeos",
    title: "Sondeos Inteligentes",
    description:
      "Descubre cómo los sondeos inteligentes transforman el análisis de datos, permitiendo análisis detallado",
    href: "/canvas",
    image: sondeosGif,
  },
  {
    id: "projects",
    title: "Gestión de Proyectos",
    description:
      "Explora la metodología de capas para organizar investigaciones, documentar hallazgos y estructurar el trabajo de manera inteligente y sistemática.",
    href: "/projects",
    image: projectsGif,
  },
  {
    id: "trends",
    title: "Monitoreo de Tendencias",
    description:
      "Observa cómo el monitoreo en tiempo real, chateando con X (antes Twitter), detecta tendencias emergentes, analiza sentimientos y proporciona insights valiosos para la toma de decisiones.",
    href: "/dashboard",
    image: trendsGif,
  },
];

const Gallery4 = ({
  title = "Ejemplos de Uso",
  description = "Descubre cómo Pulse Journal transforma el análisis de datos y la gestión de información. Estos ejemplos muestran las funcionalidades en acción con casos de uso reales.",
  items = data,
}: Gallery4Props) => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-24">
          {items.map((item, index) => (
            <div key={item.id} className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Contenido de texto */}
              <div className="flex-1 space-y-6">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Funcionalidad #{index + 1}
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <button
                  onClick={() => navigate(item.href)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Explorar funcionalidad
                  <ArrowForward className="ml-2 w-5 h-5" />
                </button>
              </div>

              {/* GIF */}
              <div className="flex-1">
                <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform hover:scale-105 transition-transform duration-300">
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                  {/* Overlay sutil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-50/20 rounded-2xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 italic">
            Explora el futuro del análisis periodístico con Pulse Journal
          </p>
        </div>
      </div>
    </section>
  );
};

export { Gallery4 }; 