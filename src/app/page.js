import Image from "next/image";
import Hero from "../../components/Hero";
import Features from "../../components/Features";
import Contact from "../../components/Contact";

export default function Home() {
  return (
    <div>
      <Hero/>
     <Features/>
     <Contact/>
    </div>
  );
}
