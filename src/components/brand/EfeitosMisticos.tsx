import React from 'react';

/**
 * Camada de efeitos do Bruxo São Cipriano Oráculos: brasas que sobem e névoa vermelha.
 * Fica atrás de todo o conteúdo e não recebe cliques. Respeita "reduzir movimento".
 */
const BRASAS = Array.from({ length: 26 }, (_, i) => {
  // valores fixos (sem Math.random) para a tela renderizar igual no servidor e no navegador
  const left = (i * 37 + 11) % 100;
  const tamanho = 2 + ((i * 7) % 5);
  const duracao = 9 + ((i * 13) % 11);
  const atraso = -((i * 17) % 20);
  const deriva = ((i % 2 === 0 ? 1 : -1) * (20 + ((i * 11) % 60)));
  return { left, tamanho, duracao, atraso, deriva };
});

export const EfeitosMisticos: React.FC = () => (
  <div className="camada-efeitos" aria-hidden="true" data-testid="efeitos-misticos">
    <div className="nevoa" />
    <div className="nevoa segunda" />
    {BRASAS.map((b, i) => (
      <span
        key={i}
        className="brasa"
        style={{
          left: `${b.left}%`,
          ['--t' as string]: `${b.tamanho}px`,
          ['--d' as string]: `${b.duracao}s`,
          ['--a' as string]: `${b.atraso}s`,
          ['--x' as string]: `${b.deriva}px`,
        } as React.CSSProperties}
      />
    ))}
  </div>
);

export default EfeitosMisticos;
