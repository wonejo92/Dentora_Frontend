import { LockIcon, MailIcon, WhatsappIcon } from "@/components/panel/icons";
import { buttonClass } from "@/components/ui/button";
import { plans } from "@/lib/admin";
import { whatsappLink } from "@/lib/format";
import { featureInfo } from "@/lib/plan-limits";
import type { PlanFeature } from "@/lib/types";

/** Lugar de un módulo que el plan de la clínica no incluye: qué hace y cómo activarlo. */
export function PlanUpgrade({ feature, plan }: { feature: PlanFeature; plan: keyof typeof plans }) {
  const info = featureInfo[feature];
  const whatsapp = whatsappLink(process.env.CONTACT_WHATSAPP ?? null);
  const email = process.env.CONTACT_EMAIL;
  const message = `Hola, quiero pasar mi clínica al plan ${info.plan} de Dentora para usar ${info.title.toLowerCase()}.`;

  return (
    <section className="mx-auto max-w-xl rounded-3xl bg-surface p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <LockIcon />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight">{info.title}</h1>
      <p className="mt-2 text-sm text-muted">{info.text}</p>
      <p className="mt-4 text-sm">
        Está disponible desde el plan <span className="font-semibold">{info.plan}</span>. Tu clínica tiene el plan{" "}
        {plans[plan].label}.
      </p>
      {(whatsapp || email) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {whatsapp && (
            <a
              href={`${whatsapp}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary")}
            >
              <WhatsappIcon /> Cambiar de plan
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent(`Plan ${info.plan}`)}&body=${encodeURIComponent(message)}`}
              className={buttonClass("secondary")}
            >
              <MailIcon /> Escribir por correo
            </a>
          )}
        </div>
      )}
    </section>
  );
}
