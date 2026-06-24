-- ============================================================================
-- SelfLab — reference seed data (global rows: user_id = null)
-- Idempotent-ish: guarded by name uniqueness checks.
-- ============================================================================

insert into public.exercises (user_id, name, muscle_group, equipment, category, is_compound, met)
select * from (values
  (null::uuid, 'Barbell Back Squat', 'Legs', 'Barbell', 'strength', true, 5.0),
  (null::uuid, 'Barbell Bench Press', 'Chest', 'Barbell', 'strength', true, 5.0),
  (null::uuid, 'Deadlift', 'Back', 'Barbell', 'strength', true, 6.0),
  (null::uuid, 'Overhead Press', 'Shoulders', 'Barbell', 'strength', true, 5.0),
  (null::uuid, 'Barbell Row', 'Back', 'Barbell', 'strength', true, 5.0),
  (null::uuid, 'Pull-up', 'Back', 'Bodyweight', 'strength', true, 5.0),
  (null::uuid, 'Chin-up', 'Back', 'Bodyweight', 'strength', true, 5.0),
  (null::uuid, 'Push-up', 'Chest', 'Bodyweight', 'strength', true, 4.0),
  (null::uuid, 'Dumbbell Bench Press', 'Chest', 'Dumbbell', 'strength', true, 5.0),
  (null::uuid, 'Incline Dumbbell Press', 'Chest', 'Dumbbell', 'strength', true, 5.0),
  (null::uuid, 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'strength', true, 5.0),
  (null::uuid, 'Lateral Raise', 'Shoulders', 'Dumbbell', 'strength', false, 3.5),
  (null::uuid, 'Bicep Curl', 'Arms', 'Dumbbell', 'strength', false, 3.5),
  (null::uuid, 'Hammer Curl', 'Arms', 'Dumbbell', 'strength', false, 3.5),
  (null::uuid, 'Tricep Pushdown', 'Arms', 'Cable', 'strength', false, 3.5),
  (null::uuid, 'Tricep Dip', 'Arms', 'Bodyweight', 'strength', true, 4.0),
  (null::uuid, 'Lat Pulldown', 'Back', 'Cable', 'strength', true, 4.5),
  (null::uuid, 'Seated Cable Row', 'Back', 'Cable', 'strength', true, 4.5),
  (null::uuid, 'Leg Press', 'Legs', 'Machine', 'strength', true, 5.0),
  (null::uuid, 'Romanian Deadlift', 'Legs', 'Barbell', 'strength', true, 5.5),
  (null::uuid, 'Walking Lunge', 'Legs', 'Dumbbell', 'strength', true, 4.5),
  (null::uuid, 'Leg Curl', 'Legs', 'Machine', 'strength', false, 4.0),
  (null::uuid, 'Leg Extension', 'Legs', 'Machine', 'strength', false, 4.0),
  (null::uuid, 'Calf Raise', 'Legs', 'Machine', 'strength', false, 3.5),
  (null::uuid, 'Hip Thrust', 'Glutes', 'Barbell', 'strength', true, 5.0),
  (null::uuid, 'Plank', 'Core', 'Bodyweight', 'core', false, 3.0),
  (null::uuid, 'Hanging Leg Raise', 'Core', 'Bodyweight', 'core', false, 4.0),
  (null::uuid, 'Cable Crunch', 'Core', 'Cable', 'core', false, 3.5),
  (null::uuid, 'Russian Twist', 'Core', 'Bodyweight', 'core', false, 4.0),
  (null::uuid, 'Mountain Climber', 'Core', 'Bodyweight', 'cardio', true, 8.0),
  (null::uuid, 'Burpee', 'Full Body', 'Bodyweight', 'cardio', true, 9.0),
  (null::uuid, 'Jump Rope', 'Full Body', 'Rope', 'cardio', true, 11.0),
  (null::uuid, 'Kettlebell Swing', 'Full Body', 'Kettlebell', 'strength', true, 9.0),
  (null::uuid, 'Rowing Machine', 'Full Body', 'Machine', 'cardio', true, 8.5),
  (null::uuid, 'Treadmill Run', 'Legs', 'Machine', 'cardio', true, 9.8),
  (null::uuid, 'Cycling', 'Legs', 'Machine', 'cardio', true, 7.5),
  (null::uuid, 'Face Pull', 'Shoulders', 'Cable', 'strength', false, 3.5),
  (null::uuid, 'Cat-Cow Stretch', 'Mobility', 'Bodyweight', 'mobility', false, 2.5),
  (null::uuid, 'World''s Greatest Stretch', 'Mobility', 'Bodyweight', 'mobility', false, 3.0)
) as v(user_id, name, muscle_group, equipment, category, is_compound, met)
where not exists (select 1 from public.exercises e where e.user_id is null and e.name = v.name);

insert into public.foods (user_id, name, serving_label, serving_grams, kcal, protein_g, carb_g, fat_g)
select * from (values
  (null::uuid, 'Chicken Breast (cooked)', '100 g', 100, 165, 31, 0, 3.6),
  (null::uuid, 'Whole Egg', '1 large (50 g)', 50, 78, 6.3, 0.6, 5.3),
  (null::uuid, 'Egg White', '1 large (33 g)', 33, 17, 3.6, 0.2, 0.1),
  (null::uuid, 'White Rice (cooked)', '100 g', 100, 130, 2.7, 28, 0.3),
  (null::uuid, 'Brown Rice (cooked)', '100 g', 100, 123, 2.7, 26, 1.0),
  (null::uuid, 'Rolled Oats (dry)', '40 g', 40, 152, 5.3, 27, 2.6),
  (null::uuid, 'Banana', '1 medium (118 g)', 118, 105, 1.3, 27, 0.4),
  (null::uuid, 'Apple', '1 medium (182 g)', 182, 95, 0.5, 25, 0.3),
  (null::uuid, 'Greek Yogurt (non-fat)', '170 g', 170, 100, 17, 6, 0.7),
  (null::uuid, 'Whey Protein Scoop', '1 scoop (30 g)', 30, 120, 24, 3, 1.5),
  (null::uuid, 'Almonds', '28 g', 28, 164, 6, 6, 14),
  (null::uuid, 'Peanut Butter', '1 tbsp (16 g)', 16, 94, 4, 3, 8),
  (null::uuid, 'Salmon (cooked)', '100 g', 100, 208, 20, 0, 13),
  (null::uuid, 'Tuna (canned in water)', '100 g', 100, 116, 26, 0, 1),
  (null::uuid, 'Sweet Potato (cooked)', '100 g', 100, 86, 1.6, 20, 0.1),
  (null::uuid, 'Broccoli', '100 g', 100, 34, 2.8, 7, 0.4),
  (null::uuid, 'Olive Oil', '1 tbsp (14 g)', 14, 119, 0, 0, 14),
  (null::uuid, 'Whole Wheat Bread', '1 slice (40 g)', 40, 92, 4, 17, 1.2),
  (null::uuid, 'Lentils (cooked)', '100 g', 100, 116, 9, 20, 0.4),
  (null::uuid, 'Paneer', '100 g', 100, 265, 18, 1.2, 21),
  (null::uuid, 'Roti / Chapati', '1 (40 g)', 40, 120, 3, 18, 3.7),
  (null::uuid, 'Dal (cooked)', '150 g', 150, 150, 9, 20, 4),
  (null::uuid, 'Milk (full fat)', '250 ml', 250, 152, 8, 12, 8),
  (null::uuid, 'Cottage Cheese (low fat)', '100 g', 100, 72, 12, 3, 1),
  (null::uuid, 'Avocado', '1/2 (100 g)', 100, 160, 2, 9, 15),
  (null::uuid, 'Black Coffee', '1 cup', 240, 2, 0.3, 0, 0),
  (null::uuid, 'Protein Bar', '1 bar (60 g)', 60, 220, 20, 22, 7)
) as v(user_id, name, serving_label, serving_grams, kcal, protein_g, carb_g, fat_g)
where not exists (select 1 from public.foods f where f.user_id is null and f.name = v.name);
