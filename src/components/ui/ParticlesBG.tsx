import Particles from "react-tsparticles";

export default function ParticlesBG() {
  return (
    <Particles
      className="absolute inset-0 -z-10"
      options={{
        particles: {
          number: { value: 60 },
          size: { value: 2 },
          move: { speed: 0.4 },
          opacity: { value: 0.3 },
          color: { value: "#ffffff" },
        },
      }}
    />
  );
}
