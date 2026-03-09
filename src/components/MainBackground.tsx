import ParticleCanvas from "./ParticleCanvas";

const MainBackground = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div className="hero-noise" />
      <ParticleCanvas />
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10">
        <div
          className="absolute inset-0 bg-dots"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    </div>
  );
};

export default MainBackground;
