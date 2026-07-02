-- Add async modules 10 and 11 (recordings from previous courses)
insert into modules (order_number, title_he, description_he, is_published)
values
  (10, 'טיפול בפוביה', 'מפגש א-סינכרוני — צפייה בהקלטה מקורס קודם: גישות CBT לטיפול בפוביות ספציפיות.', false),
  (11, 'טיפול בחרדת מבחנים', 'מפגש א-סינכרוני — צפייה בהקלטה מקורס קודם: גישות CBT לטיפול בחרדת מבחנים.', false)
on conflict (order_number) do nothing;
