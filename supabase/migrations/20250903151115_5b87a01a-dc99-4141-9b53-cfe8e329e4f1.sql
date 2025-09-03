-- Delete the incorrect assignment of Fausto to the wrong Lucía user
DELETE FROM employee_assignments 
WHERE employee_id = '32296943-feb4-45f8-9082-761813a0b7ac' 
AND refugi_lead_id = '2eb884c2-42bb-4a6e-aead-10700313ed7e';

-- Create the correct assignment of Fausto to the current Lucía user
INSERT INTO employee_assignments (employee_id, refugi_lead_id) 
VALUES ('32296943-feb4-45f8-9082-761813a0b7ac', '80f48236-79e8-4aff-90af-40a01acd9380');