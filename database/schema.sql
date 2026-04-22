CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'specialist', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE constructions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('beam')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'sold')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE beams (
    id SERIAL PRIMARY KEY,
    construction_id INTEGER NOT NULL UNIQUE REFERENCES constructions(id) ON DELETE CASCADE,
    beam_name TEXT,
    beam_type TEXT,
    profile_name TEXT NOT NULL,
    length_mm NUMERIC(10,2) NOT NULL CHECK (length_mm > 0),
    weight_kg NUMERIC(10,2) CHECK (weight_kg >= 0),
    height_mm NUMERIC(10,2) CHECK (height_mm >= 0),
    width_mm NUMERIC(10,2) CHECK (width_mm >= 0),
    web_thickness_mm NUMERIC(10,2) CHECK (web_thickness_mm >= 0),
    flange_thickness_mm NUMERIC(10,2) CHECK (flange_thickness_mm >= 0),
    steel_grade TEXT,
    surface_coating TEXT,
    condition TEXT CHECK (condition IN ('new', 'used')),
    defects TEXT,
    usage_history TEXT,
    drawings TEXT,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    location TEXT,
    price_eur NUMERIC(12,2) CHECK (price_eur >= 0)
);