import Image from "next/image";
import Classes from "./Hero.module.css"
export default function Hero() {
  return (
    <section className={Classes.hero}>
      <div className={Classes.herocontent}>
        <h1>
          <em>
            All Your Work, Organized
            <br />
            in <span className={Classes.greentext}>One Place</span>
          </em>
        </h1>
        <p>
          Track projects, manage clients, follow tutorials, and stay on top of your inbox — without switching tabs or losing focus.
        </p>
        <a href="/dashboard" className={Classes.opendashboard}>
          open dashboard
        </a>
      </div>

      <div className={Classes.heroimage}>
        <Image
          src="/hero 1.png"
          alt="Hero Image"
          width={500}
          height={600}
          priority
        />
      </div>
    </section>
  );
}
