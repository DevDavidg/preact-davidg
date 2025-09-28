import { FunctionComponent } from "preact";
import Hero from "../components/Hero";
import Projects from "../components/Projects";
import AboutMe from "../components/AboutMe";
import Contact from "../components/Contact";

const Home: FunctionComponent = () => {
  return (
    <div class="min-h-screen">
      <Hero />
      <Projects />
      <AboutMe />
      <Contact />
    </div>
  );
};

export default Home;
