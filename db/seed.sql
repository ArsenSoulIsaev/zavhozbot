insert into objects (name, is_active, is_closed)
values
  ('База', true, false),
  ('Алферова 8-18', false, false)
on conflict (name) do nothing;

insert into users (name, role, secret_word_hash, is_verified)
values
  ('Арсен', 'arsen', '$2b$10$abcdefghijklmnopqrstuv', true),
  ('Володя', 'employee', '$2b$10$abcdefghijklmnopqrstuv', false),
  ('Виталик', 'prorab', '$2b$10$abcdefghijklmnopqrstuv', false)
on conflict (name) do nothing;

insert into tools (
  title,
  aliases,
  family,
  type,
  current_object_id,
  responsible_user_id,
  status
)
values
  ('Перфоратор Makita', '{"перф","перфоратор"}', 'электро', 'перфораторы', 1, null, 'available'),
  ('Болгарка Bosch', '{"болгарка","ушм"}', 'электро', 'шлифмашины', 1, null, 'available'),
  ('Шуруповёрт DeWalt', '{"шурик","шуруповерт","шуруповёрт"}', 'электро', 'шуруповёрты', 2, null, 'available')
on conflict do nothing;
