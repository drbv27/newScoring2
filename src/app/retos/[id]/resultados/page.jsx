// src/app/retos/[id]/resultados/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { FaFire, FaArrowTrendUp, FaHelmetSafety } from "react-icons/fa6";

export default function ResultadosRetoPage({ params }) {
  const router = useRouter();
  const [reto, setReto] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener el rol del usuario de la cookie al cargar
  useEffect(() => {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth='));
    
    if (authCookie) {
      const authData = JSON.parse(decodeURIComponent(authCookie.split('=')[1]));
      setUserRole(authData.role);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resReto = await axios.get(`/api/retos/${params.id}`);
        setReto(resReto.data);
        
        const resCalificaciones = await axios.get(`/api/calificaciones/resultados?retoId=${params.id}`);
        const calificacionesClasificatoria = resCalificaciones.data.filter(
          calificacion => !calificacion.emparejamiento && 
                         calificacion.intentos && 
                         calificacion.intentos.length > 1
        );
        setResultados(calificacionesClasificatoria);
      } catch (error) {
        console.error('Error al obtener los resultados:', error);
        setError(error.message || 'Ocurrió un error al cargar los resultados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const getRetoIcon = (tipo) => {
    switch (tipo) {
      case 'Exploradores':
        return <FaHelmetSafety size={28} className="text-[#81b71f]" />;
      case 'FireFighting':
        return <FaFire size={28} className="text-[#e94947]" />;
      case 'LineFollowing':
        return <FaArrowTrendUp size={28} className="text-[#1097d5]" />;
      default:
        return null;
    }
  };

  const calcularPuntuacionTotal = (intentos, tipoReto) => {
    if (!intentos || intentos.length === 0) return 0;
    if (tipoReto === 'Exploradores') {
      return intentos.reduce((total, intento) => total + (intento.puntuacion || 0), 0);
    } else {
      const puntuaciones = intentos.map(intento => intento.puntuacion || 0);
      puntuaciones.sort((a, b) => b - a);
      return puntuaciones.slice(0, 5).reduce((total, puntuacion) => total + puntuacion, 0);
    }
  };
  const avanzarFase = async () => {
    if (userRole !== 'admin') return;

    const faseActual = reto.fase;
    const mensaje = faseActual === 'clasificatoria' 
      ? '¿Estás seguro de que quieres avanzar a cuartos de final?' 
      : faseActual === 'cuartos'
      ? '¿Estás seguro de que quieres avanzar a semifinales?'
      : '¿Estás seguro de que quieres avanzar a la fase final?';

    if (window.confirm(mensaje + ' Esta acción no se puede deshacer.')) {
      try {
        const endpoint = reto.fase === 'clasificatoria' 
          ? `/api/retos/${params.id}/avanzarFase`
          : reto.fase === 'cuartos'
          ? `/api/retos/${params.id}/avanzarSemifinal`
          : `/api/retos/${params.id}/avanzarFinal`;

        const response = await axios.post(endpoint);
        alert('Se ha avanzado a la siguiente fase exitosamente.');
        window.location.reload();
      } catch (error) {
        console.error('Error al avanzar de fase:', error);
        alert('Error al avanzar de fase: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const renderBrackets = () => {
    if (!reto.emparejamientos || reto.fase === 'clasificatoria') return null;
  
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">
          {reto.fase === 'cuartos' ? 'Cuartos de Final' :
           reto.fase === 'semifinal' ? 'Semifinales' :
           'Fase Final'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reto.emparejamientos.map((emparejamiento, index) => (
            <div 
              key={index} 
              className={`border rounded-lg shadow p-4 ${
                emparejamiento.tipo === 'final' 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : emparejamiento.tipo === 'tercerPuesto'
                    ? 'border-amber-400 bg-amber-50'
                    : 'bg-white'
              }`}
            >
              <h3 className="text-lg font-bold mb-3 text-center">
                {emparejamiento.tipo === 'final' 
                  ? 'Final' 
                  : emparejamiento.tipo === 'tercerPuesto'
                    ? 'Tercer Puesto'
                    : `Enfrentamiento ${index + 1}`}
              </h3>
              <div className="space-y-4">
                <div className={`p-3 rounded ${
                  emparejamiento.ganador === emparejamiento.equipo1._id
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-gray-50'
                }`}>
                  <span className="font-semibold">{emparejamiento.equipo1.nombre}</span>
                </div>
                
                <div className="text-center text-gray-500 font-medium">VS</div>
                
                <div className={`p-3 rounded ${
                  emparejamiento.ganador === emparejamiento.equipo2._id
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-gray-50'
                }`}>
                  <span className="font-semibold">{emparejamiento.equipo2.nombre}</span>
                </div>
  
                {/* Estado o Botón de Calificar */}
                <div className="mt-4 flex justify-center">
                  {emparejamiento.ganador ? (
                    <div className="bg-green-100 border border-green-400 rounded p-3 w-full text-center">
                      <p className="text-green-700 font-semibold">
                        Ganador: {
                          emparejamiento.ganador === emparejamiento.equipo1._id 
                            ? emparejamiento.equipo1.nombre 
                            : emparejamiento.equipo2.nombre
                        }
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={`/jueces/calificar-enfrentamiento/${reto._id}/${emparejamiento._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors w-full text-center"
                    >
                      Calificar Enfrentamiento
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Cargando resultados...</div>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;
  if (!reto) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Encabezado con información del reto */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold mb-4">{reto.nombre}</h1>
          {getRetoIcon(reto.tipo)}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600">
              <span className="font-semibold">Tipo:</span> {reto.tipo}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Categoría:</span> {reto.categoriaEdad}
            </p>
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold 
              ${reto.fase === 'clasificatoria' ? 'bg-yellow-100 text-yellow-800' :
                reto.fase === 'cuartos' ? 'bg-blue-100 text-blue-800' :
                reto.fase === 'semifinal' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'}`}
            >
              {reto.fase.charAt(0).toUpperCase() + reto.fase.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Clasificación */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Tabla de Clasificación</h2>
        {resultados.length === 0 ? (
          <div className="text-center text-gray-600">
            No hay resultados disponibles para este reto.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Posición</th>
                  <th className="border border-gray-300 p-2">Equipo</th>
                  <th className="border border-gray-300 p-2">Puntuación Total</th>
                  {reto.fase !== 'clasificatoria' && (
                    <th className="border border-gray-300 p-2">Estado</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {resultados
                  .sort((a, b) => calcularPuntuacionTotal(b.intentos, reto.tipo) - 
                                calcularPuntuacionTotal(a.intentos, reto.tipo))
                  .map((resultado, index) => (
                    <tr 
                      key={resultado._id}
                      className={`${index < 8 ? 'bg-green-50' : ''}`}
                    >
                      <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-2">
                        {resultado.equipo.nombre}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calcularPuntuacionTotal(resultado.intentos, reto.tipo)}
                      </td>
                      {reto.fase !== 'clasificatoria' && (
                        <td className="border border-gray-300 p-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-sm 
                            ${index < 8 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {index < 8 ? 'Clasificado' : 'Eliminado'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Brackets y Botones de Avance */}
      {renderBrackets()}

      {/* Botones de Avance (Solo para admin) */}
      {userRole === 'admin' && (
        <div className="mt-6">
          {puedeAvanzar && reto.fase === 'clasificatoria' && (
            <button
              onClick={avanzarFase}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            >
              Avanzar a Cuartos de Final
            </button>
          )}

          {puedeAvanzarSemis && reto.fase === 'cuartos' && (
            <button
              onClick={avanzarFase}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            >
              Avanzar a Semifinales
            </button>
          )}

          {puedeAvanzarFinal && reto.fase === 'semifinal' && (
            <button
              onClick={avanzarFase}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            >
              Avanzar a Fase Final
            </button>
          )}
        </div>
      )}

      {/* Botón de Volver */}
      <div className="mt-6">
        <Link 
          href={`/retos/${reto._id}`} 
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Volver al reto
        </Link>
      </div>
    </div>
  );
}