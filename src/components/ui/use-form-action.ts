"use client";

import { useActionState, useTransition } from "react";

/**
 * Como `useActionState`, pero NO limpia el formulario al enviarlo.
 * Con `<form action={…}>` React 19 resetea los campos tras cada envío, incluso si
 * el servidor devuelve un error (p. ej. "La cédula no es válida") y el usuario
 * tendría que volver a escribir todo. Aquí se envía con onSubmit y los datos se
 * conservan; el formulario solo se cierra cuando la acción termina bien.
 */
export function useFormAction<State extends object>(
  action: (prev: Awaited<State>, formData: FormData) => Promise<State>,
  initialState: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initialState);
  const [, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return { state, pending, onSubmit };
}
