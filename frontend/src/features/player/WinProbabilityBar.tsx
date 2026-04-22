interface WinProbabilityBarProps {
  blueWinProb: number;
}

export const WinProbabilityBar = ({ blueWinProb }: WinProbabilityBarProps) => {
  const redWinProb = 100 - blueWinProb;
  const isBlueWinning = blueWinProb > 50;
  const isRedWinning = redWinProb > 50;

  return (
    // Reducimos el ancho y lo hacemos más compacto
    <div className="flex flex-col items-center w-[350px]">
      <span className="text-[9px] text-gray-300/80 font-bold uppercase tracking-[0.4em] mb-1.5 drop-shadow-md">
        Win Probability
      </span>

      {/* Hacemos la barra mucho más delgada (h-3 en lugar de h-7) con estilo cristal */}
      <div 
        className={`relative w-full h-3 bg-black/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 ${
          isBlueWinning ? 'shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 
          isRedWinning ? 'shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'shadow-lg'
        }`}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 bg-blue-600 transition-[width] duration-1000 ease-out"
          style={{ width: `${blueWinProb}%` }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 bg-red-600 transition-[width] duration-1000 ease-out"
          style={{ width: `${redWinProb}%` }}
        />
        
        {/* Marca central */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/50 -translate-x-1/2 z-10" />
      </div>

      {/* Porcentajes pequeños debajo de la barra */}
      <div className="flex justify-between w-full mt-1.5 px-1">
        <span className="text-[10px] font-black text-blue-400 drop-shadow-md">{blueWinProb.toFixed(1)}%</span>
        <span className="text-[10px] font-black text-red-400 drop-shadow-md">{redWinProb.toFixed(1)}%</span>
      </div>
    </div>
  );
};