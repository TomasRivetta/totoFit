-- Función para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Usuario')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Eliminar trigger si existe
drop trigger if exists on_auth_user_created on auth.users;

-- Crear trigger para nuevos usuarios
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
