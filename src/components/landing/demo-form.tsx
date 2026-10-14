"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * "Agenda una demo": no guarda nada, arma el mensaje y abre WhatsApp
 * (o el correo, si no hay WhatsApp configurado).
 */
export function DemoForm({ whatsappBase, email }: { whatsappBase: string | null; email?: string }) {
  const [name, setName] = useState("");
  const [clinic, setClinic] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string>();

  if (!whatsappBase && !email) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clinic.trim()) return setError("Escribe tu nombre y el de tu clínica.");
    setError(undefined);
    const text = `Hola, soy ${name.trim()} de ${clinic.trim()}${city.trim() ? ` (${city.trim()})` : ""}. Me gustaría ver una demo de Dentora.`;
    const url = whatsappBase
      ? `${whatsappBase}?text=${encodeURIComponent(text)}`
      : `mailto:${email}?subject=${encodeURIComponent("Demo de Dentora")}&body=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const field =
    "h-12 w-full border-b border-white/25 bg-transparent text-white placeholder:text-night-300 focus:border-white focus:outline-none";

  return (
    <form onSubmit={send} noValidate className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      <label className="sr-only" htmlFor="demo-name">
        Tu nombre
      </label>
      <input
        id="demo-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        autoComplete="name"
        className={field}
      />
      <label className="sr-only" htmlFor="demo-clinic">
        Nombre de tu clínica
      </label>
      <input
        id="demo-clinic"
        value={clinic}
        onChange={(e) => setClinic(e.target.value)}
        placeholder="Nombre de tu clínica"
        className={field}
      />
      <label className="sr-only" htmlFor="demo-city">
        Ciudad
      </label>
      <input
        id="demo-city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Ciudad (opcional)"
        className={cn(field, "sm:col-span-2")}
      />
      {error && (
        <p role="alert" className="text-sm text-[#f8a5a7] sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#073b49] hover:bg-brand-50"
        >
          {whatsappBase ? "Pedir demo por WhatsApp" : "Pedir demo por correo"}
        </button>
        <span className="text-sm text-night-300">
          Se abre {whatsappBase ? "WhatsApp" : "tu correo"} con el mensaje listo.
        </span>
      </div>
    </form>
  );
}
