import { redirect } from "next/navigation";

// La landing de Dentora llega en una fase posterior; por ahora "/" lleva al panel.
export default function Home() {
  redirect("/panel");
}
