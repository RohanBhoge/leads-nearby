-- Clear existing data to avoid duplicates (optional, use with caution in prod)
TRUNCATE TABLE public.sub_categories CASCADE;
TRUNCATE TABLE public.categories CASCADE;

DO $$
DECLARE
    cat_home_repairs uuid;
    cat_electronic uuid;
    cat_academic uuid;
    cat_events uuid;
    cat_logistics uuid;
    cat_personal_care uuid;
    cat_cleaning uuid;
    cat_professional uuid;
    cat_it uuid;
    cat_urgent uuid;
    cat_hospitality uuid;
BEGIN
    -- 1. Home Repairs & Maintenance
    INSERT INTO public.categories (name) VALUES ('Home Repairs & Maintenance') RETURNING id INTO cat_home_repairs;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Electricians', cat_home_repairs),
        ('Plumbers', cat_home_repairs),
        ('Carpenters', cat_home_repairs),
        ('Painters', cat_home_repairs),
        ('Pest Control', cat_home_repairs);

    -- 2. Electronic & Home Appliances
    INSERT INTO public.categories (name) VALUES ('Electronic & Home Appliances') RETURNING id INTO cat_electronic;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('AC Services', cat_electronic),
        ('Kitchen Appliances', cat_electronic),
        ('Washing Machine', cat_electronic),
        ('TV & Entertainment', cat_electronic),
        ('Water Purifiers', cat_electronic);

    -- 3. Academic & College Services
    INSERT INTO public.categories (name) VALUES ('Academic & College Services') RETURNING id INTO cat_academic;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Project & Thesis Support', cat_academic),
        ('DTP & Printing', cat_academic),
        ('Home Tutors', cat_academic),
        ('Technical Skill Training', cat_academic),
        ('Stationery & Supplies', cat_academic);

    -- 4. Events & Celebrations
    INSERT INTO public.categories (name) VALUES ('Events & Celebrations') RETURNING id INTO cat_events;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Event Hosts & Anchors', cat_events),
        ('Photography & Video', cat_events),
        ('Catering Services', cat_events),
        ('Decorators', cat_events),
        ('Sound & DJ', cat_events);

    -- 5. Logistics & Daily Labor
    INSERT INTO public.categories (name) VALUES ('Logistics & Daily Labor') RETURNING id INTO cat_logistics;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Packers & Movers', cat_logistics),
        ('Loading & Unloading', cat_logistics),
        ('Delivery Partners', cat_logistics),
        ('Daily Wage Laborers', cat_logistics),
        ('Drivers', cat_logistics);

    -- 6. Personal Care & Wellness
    INSERT INTO public.categories (name) VALUES ('Personal Care & Wellness') RETURNING id INTO cat_personal_care;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Salon at Home', cat_personal_care),
        ('Massage & Spa', cat_personal_care),
        ('Fitness Trainers', cat_personal_care),
        ('Physiotherapy', cat_personal_care),
        ('Nursing Care', cat_personal_care);

    -- 7. Cleaning & Sanitization
    INSERT INTO public.categories (name) VALUES ('Cleaning & Sanitization') RETURNING id INTO cat_cleaning;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Full Home Cleaning', cat_cleaning),
        ('Sofa & Carpet', cat_cleaning),
        ('Kitchen & Bathroom', cat_cleaning),
        ('Water Tank Cleaning', cat_cleaning),
        ('Car Cleaning', cat_cleaning);

    -- 8. Professional & Legal Services
    INSERT INTO public.categories (name) VALUES ('Professional & Legal Services') RETURNING id INTO cat_professional;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Rent Agreements', cat_professional),
        ('Maha e-Seva', cat_professional),
        ('Notary & Affidavit', cat_professional),
        ('Tax & Accounting', cat_professional),
        ('Insurance Agents', cat_professional);

    -- 9. IT & Digital Solutions
    INSERT INTO public.categories (name) VALUES ('IT & Digital Solutions') RETURNING id INTO cat_it;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Laptop & PC Repair', cat_it),
        ('WiFi & Networking', cat_it),
        ('Web & App Support', cat_it),
        ('Mobile Repair', cat_it),
        ('CCTV Installation', cat_it);

    -- 10. Urgent & Emergency Help
    INSERT INTO public.categories (name) VALUES ('Urgent & Emergency Help') RETURNING id INTO cat_urgent;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Roadside Assistance', cat_urgent),
        ('Key Makers', cat_urgent),
        ('Ambulance Services', cat_urgent),
        ('Gas Leakage Fix', cat_urgent),
        ('Security Guards', cat_urgent);

    -- 11. Hospitality & Stay Management
    INSERT INTO public.categories (name) VALUES ('Hospitality & Stay Management') RETURNING id INTO cat_hospitality;
    INSERT INTO public.sub_categories (name, category_id) VALUES 
        ('Guest House Management', cat_hospitality),
        ('PG & Hostel Services', cat_hospitality),
        ('Homestay & Airbnb Care', cat_hospitality),
        ('Professional Waitstaff', cat_hospitality),
        ('Travel & Concierge', cat_hospitality);

END $$;