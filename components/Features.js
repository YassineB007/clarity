import React from "react";
import Classes from "./Features.module.css"
export default function Features() {
  const featureData = [
    {
      title: "manage your work",
      description: "Track deadlines, progress, and deliverables\n easily.",
      bg: "/work.jpg",
    },
    {
      title: "manage your clients",
      description: "Manage client info, history, and\n contacts in one place.",
      bg: "/clients.jpg",
    },
    {
      title: "manage your finances",
      description: "Generate, view, and export\n invoices — keep your finances\n organized.",
      bg: "/finance.jpg",
    },
    {
      title: "manage your education",
      description: "Your education hub: watch videos,\n take notes, and track progress.",
      bg: "/education.jpg",
    },
  ];

  return (
    <section className={Classes.features}>
      <h2>
        everything you need to work
        <br />
        more efficiently
      </h2>
      <p className={Classes.featuressubtitle}>
        One hub to manage your work, learning, and communication — all in one place.
      </p>

      <div className={Classes.featuresgrid}>
        {featureData.map((feature, index) => (
          <div
            key={index}
            className={Classes.featurecard}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${feature.bg}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className={Classes.featurecardcontent}>
              <h3>{feature.title}</h3>
              <p>
                {feature.description.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
