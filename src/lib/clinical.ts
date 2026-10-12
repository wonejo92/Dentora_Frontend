/** Catálogos de la historia clínica: antecedentes, anamnesis y diagnósticos CIE-10. */

export const CONDITIONS: Record<string, string> = {
  DIABETES: "Diabetes",
  HIPERTENSION: "Hipertensión",
  CARDIOPATIA: "Cardiopatía",
  MARCAPASOS: "Marcapasos",
  ASMA: "Asma",
  EPILEPSIA: "Epilepsia",
  HEPATITIS: "Hepatitis",
  VIH: "VIH",
  COAGULACION: "Trastorno de coagulación",
  ANTICOAGULANTES: "Toma anticoagulantes",
  BIFOSFONATOS: "Toma bifosfonatos",
  TIROIDES: "Enfermedad de tiroides",
  RENAL: "Enfermedad renal",
  CANCER: "Cáncer / radioterapia",
  EMBARAZO: "Embarazo",
  LACTANCIA: "Lactancia",
};

export const conditionLabel = (key: string) => CONDITIONS[key] ?? key;

export const COMMON_ALLERGIES = [
  "Penicilina",
  "Amoxicilina",
  "Anestesia local",
  "Ibuprofeno / AINE",
  "Aspirina",
  "Sulfas",
  "Látex",
  "Yodo",
];

export type Question = {
  key: string;
  label: string;
  /** Sin opciones es una pregunta de texto libre. */
  options?: { value: string; label: string }[];
  placeholder?: string;
};

const YES_NO = [
  { value: "NO", label: "No" },
  { value: "SI", label: "Sí" },
];
const YES_NO_SOMETIMES = [...YES_NO, { value: "A_VECES", label: "A veces" }];
const FREQUENCY = [
  { value: "NO", label: "No" },
  { value: "OCASIONAL", label: "Ocasional" },
  { value: "DIARIO", label: "A diario" },
];

export const ANAMNESIS: { title: string; questions: Question[] }[] = [
  {
    title: "Salud general",
    questions: [
      {
        key: "medications",
        label: "Medicamentos que toma",
        placeholder: "Nombre y dosis",
      },
      {
        key: "conditionsNotes",
        label: "Otras enfermedades u hospitalizaciones",
        placeholder: "Detalle",
      },
    ],
  },
  {
    title: "Hábitos",
    questions: [
      { key: "smoking", label: "Fuma", options: YES_NO_SOMETIMES },
      { key: "alcohol", label: "Consume alcohol", options: FREQUENCY },
      {
        key: "caffeine",
        label: "Café, té o bebidas energéticas",
        options: FREQUENCY,
      },
      { key: "drugs", label: "Consume estupefacientes", options: YES_NO },
      {
        key: "bruxism",
        label: "Aprieta o rechina los dientes",
        options: YES_NO_SOMETIMES,
      },
      {
        key: "nailBiting",
        label: "Se muerde las uñas u objetos",
        options: YES_NO,
      },
    ],
  },
  {
    title: "Antecedentes dentales",
    questions: [
      {
        key: "lastVisit",
        label: "Última visita al dentista",
        placeholder: "Ej. hace 1 año",
      },
      {
        key: "brushing",
        label: "Cepillado al día",
        options: [
          { value: "0", label: "Ninguno" },
          { value: "1", label: "1 vez" },
          { value: "2", label: "2 veces" },
          { value: "3", label: "3 o más" },
        ],
      },
      { key: "floss", label: "Usa hilo dental", options: YES_NO_SOMETIMES },
      {
        key: "bleeding",
        label: "Le sangran las encías al cepillarse",
        options: YES_NO_SOMETIMES,
      },
      {
        key: "gumRecession",
        label: "Encías inflamadas o retraídas",
        options: YES_NO,
      },
      {
        key: "sensitivity",
        label: "Sensibilidad",
        options: [
          { value: "NO", label: "No" },
          { value: "FRIO", label: "Al frío" },
          { value: "CALOR", label: "Al calor" },
          { value: "AMBOS", label: "Ambos" },
        ],
      },
      {
        key: "fillings",
        label: "Ha tenido caries o empastes",
        options: YES_NO,
      },
      { key: "extractions", label: "Le han extraído dientes", options: YES_NO },
      {
        key: "surgeries",
        label: "Cirugías orales o maxilofaciales",
        options: YES_NO,
      },
      {
        key: "wisdomTeeth",
        label: "Problemas con las muelas del juicio",
        options: [...YES_NO, { value: "NO_TIENE", label: "No tiene" }],
      },
    ],
  },
  {
    title: "Otros",
    questions: [
      {
        key: "family",
        label: "Antecedentes familiares",
        placeholder: "Diabetes, cardiopatías, cáncer…",
      },
      {
        key: "observations",
        label: "Observaciones",
        placeholder: "Miedo al dentista, preferencias…",
      },
    ],
  },
];

/** Texto de una respuesta para mostrarla en el resumen. */
export function answerLabel(question: Question, value: string | undefined) {
  if (!value) return null;
  return question.options?.find((o) => o.value === value)?.label ?? value;
}

/** Diagnósticos odontológicos frecuentes de la CIE-10 (OMS). */
export const CIE10: { code: string; label: string }[] = [
  { code: "K00.0", label: "Anodoncia" },
  { code: "K00.6", label: "Alteraciones en la erupción dentaria" },
  { code: "K01.1", label: "Diente impactado" },
  { code: "K02.0", label: "Caries limitada al esmalte" },
  { code: "K02.1", label: "Caries de la dentina" },
  { code: "K02.2", label: "Caries del cemento" },
  { code: "K02.3", label: "Caries dentaria detenida" },
  { code: "K02.9", label: "Caries dental, no especificada" },
  { code: "K03.0", label: "Atrición excesiva de los dientes" },
  { code: "K03.1", label: "Abrasión de los dientes" },
  { code: "K03.2", label: "Erosión de los dientes" },
  { code: "K03.6", label: "Depósitos en los dientes (cálculo, placa)" },
  { code: "K03.7", label: "Cambios de color posteriores a la erupción" },
  { code: "K04.0", label: "Pulpitis" },
  { code: "K04.1", label: "Necrosis de la pulpa" },
  { code: "K04.4", label: "Periodontitis apical aguda de origen pulpar" },
  { code: "K04.5", label: "Periodontitis apical crónica" },
  { code: "K04.6", label: "Absceso periapical con fístula" },
  { code: "K04.7", label: "Absceso periapical sin fístula" },
  { code: "K05.0", label: "Gingivitis aguda" },
  { code: "K05.1", label: "Gingivitis crónica" },
  { code: "K05.2", label: "Periodontitis aguda" },
  { code: "K05.3", label: "Periodontitis crónica" },
  { code: "K06.0", label: "Retracción gingival" },
  { code: "K06.1", label: "Hiperplasia gingival" },
  {
    code: "K07.2",
    label: "Anomalías de la relación entre los arcos dentarios",
  },
  { code: "K07.3", label: "Anomalías de la posición del diente" },
  { code: "K07.6", label: "Trastornos de la articulación temporomandibular" },
  {
    code: "K08.1",
    label: "Pérdida de dientes por accidente, extracción o enfermedad periodontal",
  },
  { code: "K08.3", label: "Raíz dental retenida" },
  { code: "K08.8", label: "Otras afecciones de los dientes (dolor dental)" },
  { code: "K10.3", label: "Alveolitis del maxilar" },
  { code: "K12.0", label: "Estomatitis aftosa recurrente" },
  { code: "K13.0", label: "Enfermedades de los labios" },
  { code: "K14.0", label: "Glositis" },
  { code: "S02.5", label: "Fractura de los dientes" },
  { code: "S03.2", label: "Luxación de diente" },
  { code: "Z01.2", label: "Examen odontológico" },
  { code: "Z46.3", label: "Prueba y ajuste de prótesis dental" },
];

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca por código ("k02") o por palabras del nombre ("caries dentina"). */
export function searchCie10(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return CIE10;
  return CIE10.filter((d) => {
    const text = normalize(`${d.code} ${d.label}`);
    return words.every((w) => text.includes(w));
  });
}
