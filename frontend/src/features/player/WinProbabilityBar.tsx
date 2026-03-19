interface WinProbabilityBarProps {
  blueWinProb: number;
}

export const WinProbabilityBar = ({ blueWinProb }: WinProbabilityBarProps) => {
  // Calculamos la probabilidad del equipo rojo
  const redWinProb = 100 - blueWinProb;

  return (
    <div className="flex flex-col items-center w-[400px]">
      {/* Título del componente */}
      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 shadow-black drop-shadow-md">
        Probabilidad de Victoria
      </span>

      {/* Contenedor principal de la barra */}
      <div className="relative w-full h-8 bg-[#0d1117] border-2 border-[#30363d] flex overflow-hidden shadow-lg shadow-black/80">
        {/* Barra Azul (T1) */}
        <div
          className="h-full bg-blue-600 transition-[width] duration-1000 ease-in-out flex items-center pl-3"
          style={{ width: `${blueWinProb}%` }} // El ancho dinámico dictado por Go
        >
          <span className="text-white font-black text-sm drop-shadow-md">
            {blueWinProb.toFixed(1)}%
          </span>
        </div>

        {/* Barra Roja (BLG) */}
        <div
          className="h-full bg-red-600 transition-[width] duration-1000 ease-in-out flex items-center justify-end pr-3"
          style={{ width: `${redWinProb}%` }} // El espacio restante
        >
          <span className="text-white font-black text-sm drop-shadow-md">
            {redWinProb.toFixed(1)}%
          </span>
        </div>

        {/* Línea divisoria central estética */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/30 -translate-x-1/2 z-10"></div>
      </div>

      {/* Etiquetas de los equipos */}
      <div className="flex justify-between w-full mt-1 px-1">
        <span className="text-sm font-bold text-blue-400">T1</span>
        <span className="text-sm font-bold text-red-400">BLG</span>
      </div>
    </div>
  );
};
