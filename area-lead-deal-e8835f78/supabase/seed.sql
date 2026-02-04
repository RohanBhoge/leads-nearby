-- Clear existing data to avoid duplicates on re-seeding
TRUNCATE TABLE sub_categories CASCADE;
TRUNCATE TABLE categories CASCADE;

-- 1. Home Repairs & Maintenance
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Home Repairs & Maintenance');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Electricians'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Plumbers'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Carpenters'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Painters'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Pest Control');

-- 2. Electronic & Home Appliances
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Electronic & Home Appliances');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'AC Services'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Kitchen Appliances'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Washing Machine'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'TV & Entertainment'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Water Purifiers');

-- 3. Academic & College Services
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Academic & College Services');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Project & Thesis Support'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'DTP & Printing'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Home Tutors'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Technical Skill Training'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Stationery & Supplies');

-- 4. Events & Celebrations
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Events & Celebrations');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Event Hosts & Anchors'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Photography & Video'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Catering Services'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Decorators'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Sound & DJ');

-- 5. Logistics & Daily Labor
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Logistics & Daily Labor');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Packers & Movers'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Loading & Unloading'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Delivery Partners'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Daily Wage Laborers'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Drivers');

-- 6. Personal Care & Wellness
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Personal Care & Wellness');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Salon at Home'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Massage & Spa'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Fitness Trainers'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Physiotherapy'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Nursing Care');

-- 7. Cleaning & Sanitization
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Cleaning & Sanitization');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Full Home Cleaning'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Sofa & Carpet'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Kitchen & Bathroom'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Water Tank Cleaning'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Car Cleaning');

-- 8. Professional & Legal Services
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Professional & Legal Services');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Rent Agreements'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Maha e-Seva'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Notary & Affidavit'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Tax & Accounting'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Insurance Agents');

-- 9. IT & Digital Solutions
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'IT & Digital Solutions');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'Laptop & PC Repair'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'WiFi & Networking'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'Web & App Support'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'Mobile Repair'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'CCTV Installation');

-- 10. Urgent & Emergency Help
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Urgent & Emergency Help');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Roadside Assistance'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Key Makers'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Ambulance Services'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Gas Leakage Fix'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Security Guards');

-- 11. Hospitality & Stay Management
INSERT INTO categories (id, name) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hospitality & Stay Management');
INSERT INTO sub_categories (category_id, name) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Guest House Management'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PG & Hostel Services'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Homestay & Airbnb Care'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Professional Waitstaff'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Travel & Concierge');