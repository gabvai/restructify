-- 1. User
INSERT INTO users (email, password_hash, name, role)
VALUES ('test@test.com', '111', 'Test User', 'user');

-- 2. Specialist
INSERT INTO users (email, password_hash, name, role)
VALUES ('spec@test.com', '222', 'Specialistas', 'specialist');

-- 3. Construction (sija)
INSERT INTO constructions (user_id, type, title, description, status)
VALUES (1, 'beam', 'IPE 200 sija', 'Testinė sija', 'pending_review');

-- 4. Beam duomenys
INSERT INTO beams (
    construction_id,
    beam_name,
    beam_type,
    profile_name,
    length_mm,
    weight_kg,
    height_mm,
    width_mm,
    web_thickness_mm,
    flange_thickness_mm,
    steel_grade,
    surface_coating,
    condition,
    defects,
    usage_history,
    drawings,
    quantity,
    location,
    price_eur
) VALUES (
    1,
    'Sija',
    'IPE',
    'IPE 200',
    6000,
    150.5,
    200,
    100,
    5.6,
    8.5,
    'S355',
    'Dažyta',
    'used',
    'Nedidelės rūdys',
    'Naudota sandėlyje',
    'brėžinys.pdf',
    2,
    'Kaunas',
    300
);