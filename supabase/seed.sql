-- masani LMS — seed: default subjects and their skill trackers.
-- Idempotent; safe to re-run against an existing database.

insert into public.subjects (name, slug) values
  ('Mathematics', 'mathematics'),
  ('English',     'english'),
  ('Science',     'science')
on conflict (name) do nothing;

-- Mathematics — 9 skills (per the reporting template)
with m as (select id from public.subjects where slug = 'mathematics')
insert into public.subject_skills (subject_id, name, description, sort_order)
select m.id, v.name, v.description, v.sort_order
from m,
     (values
       ('Number sense',          'understanding numbers, place value',                        1),
       ('Arithmetic accuracy',   'addition, subtraction, multiplication, division',           2),
       ('Problem solving',       'word problems, application',                                3),
       ('Fractions & decimals',  null,                                                        4),
       ('Speed & fluency',       null,                                                        5),
       ('Logical reasoning',     null,                                                        6),
       ('Algebra',               null,                                                        7),
       ('Geometry understanding', null,                                                       8),
       ('Data interpretation',   null,                                                        9)
     ) as v(name, description, sort_order)
on conflict (subject_id, name) do nothing;

-- English — 8 skills
with e as (select id from public.subjects where slug = 'english')
insert into public.subject_skills (subject_id, name, description, sort_order)
select e.id, v.name, v.description, v.sort_order
from e,
     (values
       ('Reading fluency',       'speed + accuracy',                                          1),
       ('Reading comprehension', 'understanding meaning',                                     2),
       ('Vocabulary development', null,                                                       3),
       ('Grammar usage',          null,                                                       4),
       ('Sentence construction',  null,                                                       5),
       ('Spelling accuracy',      null,                                                       6),
       ('Writing clarity',       'ideas plus structure',                                      7),
       ('Oral expression',        null,                                                       8)
     ) as v(name, description, sort_order)
on conflict (subject_id, name) do nothing;

-- Science — 6 skills
with s as (select id from public.subjects where slug = 'science')
insert into public.subject_skills (subject_id, name, description, sort_order)
select s.id, v.name, v.description, v.sort_order
from s,
     (values
       ('Concept understanding',                null, 1),
       ('Application of concepts',              null, 2),
       ('Scientific reasoning',                 null, 3),
       ('Terminology usage',                    null, 4),
       ('Experiment/observation understanding', null, 5),
       ('Problem solving in context',           null, 6)
     ) as v(name, description, sort_order)
on conflict (subject_id, name) do nothing;
