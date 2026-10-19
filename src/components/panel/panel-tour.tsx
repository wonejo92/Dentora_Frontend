"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";
import { markTourSeen } from "@/app/actions/onboarding";

/** Evento para abrir el tour desde cualquier botón ("Ver tour del panel"). */
export const START_TOUR_EVENT = "dentora:start-tour";

/** Pasos del recorrido: cada uno apunta a un elemento con `data-tour`. */
function steps(firstName: string): DriveStep[] {
  return [
    {
      popover: {
        title: `Hola, ${firstName}`,
        description: "Te mostramos en un minuto dónde está cada cosa del panel.",
      },
    },
    {
      element: '[data-tour="nav"]',
      popover: {
        title: "Menú",
        description: "Agenda, pacientes, doctores, caja y más. Puedes contraerlo con ⌘B o Ctrl+B.",
        side: "right",
      },
    },
    {
      element: '[data-tour="search"]',
      popover: { title: "Buscar paciente", description: "Escribe el nombre o la cédula para abrir su ficha." },
    },
    {
      element: '[data-tour="new-appointment"]',
      popover: {
        title: "Nueva cita",
        description: "Agenda una cita en cuatro pasos: paciente, tratamiento, doctor y horario.",
      },
    },
    {
      element: '[data-tour="bell"]',
      popover: {
        title: "Reservas por confirmar",
        description: "Las reservas que llegan desde tu página aparecen aquí hasta que las confirmes.",
      },
    },
    {
      element: '[data-tour="onboarding"]',
      popover: {
        title: "Primeros pasos",
        description: "Sigue esta lista para dejar tu clínica lista para recibir reservas.",
      },
    },
    {
      element: '[data-tour="user"]',
      popover: {
        title: "Tu cuenta",
        description: "Cambia el tema, entra a los ajustes, vuelve a ver este recorrido o cierra sesión.",
        side: "right",
      },
    },
  ];
}

/** Solo los pasos cuyo elemento está en pantalla (en el celular el menú lateral no se ve). */
const visibleSteps = (all: DriveStep[]) =>
  all.filter((s) => {
    if (!s.element) return true;
    const el = document.querySelector(s.element as string) as HTMLElement | null;
    return !!el && el.getClientRects().length > 0;
  });

/**
 * Tour del panel con driver.js. Se abre solo la primera vez que el usuario
 * entra (y se recuerda en la base, no en el navegador); después, desde "Ver tour".
 */
export function PanelTour({ autoStart, firstName }: { autoStart: boolean; firstName: string }) {
  useEffect(() => {
    let seenSaved = !autoStart;
    const start = () => {
      const tour = driver({
        steps: visibleSteps(steps(firstName)),
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Listo",
        popoverClass: "dentora-tour",
        overlayOpacity: 0.45,
        stagePadding: 6,
        stageRadius: 16,
        onDestroyed: () => {
          // Terminarlo o cerrarlo cuenta como visto.
          if (!seenSaved) {
            seenSaved = true;
            void markTourSeen();
          }
        },
      });
      tour.drive();
    };

    window.addEventListener(START_TOUR_EVENT, start);
    // Un instante después de cargar, para que el panel ya esté dibujado.
    const timer = autoStart ? window.setTimeout(start, 600) : undefined;
    return () => {
      window.removeEventListener(START_TOUR_EVENT, start);
      window.clearTimeout(timer);
    };
  }, [autoStart, firstName]);

  return null;
}
