'use client';

import { motion } from 'framer-motion';

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    d: `M-${684 - i * 9 * position} -${189 + i * 6}C-${
      684 - i * 9 * position
    } -${189 + i * 6} -${561.6 - i * 9 * position} ${216 - i * 6} ${
      273.6 - i * 9 * position
    } ${343 - i * 6}C${1108.8 - i * 9 * position} ${470 - i * 6} ${
      1231.2 - i * 9 * position
    } ${875 - i * 6} ${1231.2 - i * 9 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-white"
        viewBox="0 0 1400 700"
        preserveAspectRatio="none"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + (path.id % 10),
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({ title = 'Background Paths' }: { title?: string }) {
  const words = title.split(' ');

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="mr-3 inline-block last:mr-0">
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={`${wordIndex}-${letterIndex}`}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: wordIndex * 0.1 + letterIndex * 0.03,
                  type: 'spring',
                  stiffness: 150,
                  damping: 25,
                }}
                className="inline-block bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
              >
                {letter}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.h1>
    </>
  );
}
