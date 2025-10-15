'use client';

import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { Container, ISourceOptions } from '@tsparticles/engine';
// tsParticles Repository: https://github.com/matteobruni/tsparticles
// tsParticles Website: https://particles.js.org/
import { loadFull } from 'tsparticles'; // if you are going to use `loadFull`,

export const SparklesCore = (props:{
    id: string;
    background?: string;
    minSize?: number;
    maxSize?: number;
    particleDensity?: number;
    className?: string;
    particleColor?: string;
}) => {
  const [init, setInit] = useState(false);

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine)
      // instance.addShape("heart", (context, particle, radius) => {
      //   context.moveTo(0, radius);
      //   context.quadraticCurveTo(radius, 0, 0, -radius);
      //   context.quadraticCurveTo(-radius, 0, 0, radius);
      // });
      // and just specify which bundle to load
      //await loadAll(engine);
      //await loadFull(engine); // SCOMMENTARE QUESTA LINEA
      await loadFull(engine);
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

  const options: ISourceOptions = {
    background: {
      color: {
        value: props.background || 'transparent',
      },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: 'push',
        },
        onHover: {
          enable: false,
          mode: 'repulse',
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: props.particleColor || '#ffffff',
      },
      links: {
        color: '#ffffff',
        distance: 150,
        enable: false,
        opacity: 0.5,
        width: 1,
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: {
          default: 'out',
        },
        random: true,
        speed: 0.1,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: props.particleDensity || 80,
      },
      opacity: {
        value: 0.5,
        animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.1,
        }
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: { min: props.minSize || 1, max: props.maxSize || 3 },
        animation: {
            enable: true,
            speed: 2,
            minimumValue: props.minSize || 1,
        }
      },
    },
    detectRetina: true,
  };

  if (init) {
    return (
        <Particles
        id={props.id}
        init={particlesLoaded}
        options={options}
        className={props.className}
      />
    );
  }

  return <></>;
};
