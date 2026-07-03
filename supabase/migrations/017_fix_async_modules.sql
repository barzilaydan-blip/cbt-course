-- Fix: undo wrong is_async marking on existing modules 10 and 11
update modules set is_async = false where order_number in (10, 11);

-- Add the actual new async modules at the end (13 and 14)
insert into modules (order_number, title_he, description_he, is_async, is_published)
values
  (13, 'טיפול בפוביה', 'מפגש א-סינכרוני — צפייה בהקלטה מקורס קודם: גישות CBT לטיפול בפוביות ספציפיות.', true, true),
  (14, 'טיפול בחרדת מבחנים', 'מפגש א-סינכרוני — צפייה בהקלטה מקורס קודם: גישות CBT לטיפול בחרדת מבחנים.', true, true)
on conflict (order_number) do nothing;
