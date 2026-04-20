-- PlateMap seed — 15 Bengaluru restaurants spanning Halal, Veg, Vegan, Jain.
-- Coordinates approximate. Categories curated; verify before launch.

insert into public.restaurants
  (slug, name, description, address, area, city, lat, lng, phone, cuisine_type, price_range, dietary_categories, is_verified, photos)
values
  -- HALAL
  ('savoury-restaurant-frazer-town',
   'Savoury Restaurant',
   'Long-running Frazer Town institution for Arabic-Indian halal classics — mandi, mutton chops, shawarma.',
   'Mosque Rd, Pulikeshi Nagar, Frazer Town', 'Frazer Town', 'Bengaluru',
   12.9990, 77.6160, '+91 80 2548 1234', 'Arabic · Mughlai', '$$',
   '{halal}', true,
   array['https://images.unsplash.com/photo-1547592180-85f173990554?w=1200']),

  ('al-daaz-shivaji-nagar',
   'Al-Daaz',
   'Late-night halal favourite in Shivaji Nagar — famed for bhuna gosht and sheermal.',
   'OPH Rd, Shivaji Nagar', 'Shivaji Nagar', 'Bengaluru',
   12.9891, 77.6067, '+91 80 2559 8844', 'Mughlai · North Indian', '$$',
   '{halal}', true,
   array['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1200']),

  ('empire-restaurant-koramangala',
   'Empire Restaurant',
   'The Bangalore halal chain — butter chicken, kababs, and bucket biryani open until 2am.',
   '7th Block, Koramangala', 'Koramangala', 'Bengaluru',
   12.9345, 77.6240, '+91 80 2552 0000', 'North Indian · Mughlai', '$$',
   '{halal}', true,
   array['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1200']),

  ('meghana-foods-residency-road',
   'Meghana Foods',
   'Andhra-style biryani — halal meat, old-Bangalore queues, daily.',
   'Residency Rd, Shanthala Nagar', 'Residency Road', 'Bengaluru',
   12.9693, 77.6039, '+91 99002 11144', 'Andhra · Biryani', '$$',
   '{halal}', true,
   array['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=1200']),

  -- VEG
  ('mtr-lalbagh',
   'Mavalli Tiffin Room (MTR)',
   'Since 1924. Rava idli, filter coffee, and the city''s most civilised breakfast queue.',
   'Lalbagh Rd, Mavalli', 'Mavalli', 'Bengaluru',
   12.9552, 77.5836, '+91 80 2222 0022', 'South Indian', '$$',
   '{veg}', true,
   array['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200']),

  ('vidyarthi-bhavan-basavanagudi',
   'Vidyarthi Bhavan',
   'Crisp masala dosa, newspaper-lined tables, since 1943.',
   'Gandhi Bazaar Main Rd, Basavanagudi', 'Basavanagudi', 'Bengaluru',
   12.9432, 77.5710, '+91 80 2667 7588', 'South Indian', '$',
   '{veg}', true,
   array['https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200']),

  ('cta-indiranagar',
   'Central Tiffin Room (CTR)',
   'Benne masala dosa that justifies the trip to Malleswaram. Pure veg.',
   '7th Cross, Margosa Rd, Malleswaram', 'Malleswaram', 'Bengaluru',
   13.0032, 77.5688, '+91 80 2331 3839', 'South Indian', '$',
   '{veg}', true,
   array['https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?w=1200']),

  ('halli-mane-malleshwaram',
   'Halli Mane',
   'Village-style Karnataka thali — ragi mudde, saaru, palya. Pure veg.',
   '3rd Cross, Sampige Rd, Malleswaram', 'Malleswaram', 'Bengaluru',
   13.0036, 77.5712, '+91 80 4124 8282', 'Karnataka · Thali', '$$',
   '{veg}', false,
   array['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200']),

  -- VEGAN
  ('carrots-koramangala',
   'Carrots',
   'India''s first fully vegan restaurant — plant-based burgers, mock meat, oat lattes.',
   '80 Feet Rd, Koramangala 4th Block', 'Koramangala', 'Bengaluru',
   12.9373, 77.6252, '+91 80 4095 8585', 'Vegan · Global', '$$$',
   '{vegan,veg}', true,
   array['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200']),

  ('greenr-cafe-indiranagar',
   'Greenr Cafe',
   'Pan-Asian and Italian, fully vegan. Jackfruit bao, cashew cheese pizzas.',
   '12th Main, HAL 2nd Stage, Indiranagar', 'Indiranagar', 'Bengaluru',
   12.9719, 77.6412, '+91 99024 88844', 'Vegan · Pan-Asian', '$$$',
   '{vegan,veg}', true,
   array['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200']),

  ('burma-burma-ub-city',
   'Burma Burma',
   'Burmese vegetarian with a large vegan-marked menu. Khow suey, tea-leaf salad.',
   'UB City Mall, Vittal Mallya Rd', 'Lavelle Road', 'Bengaluru',
   12.9719, 77.5956, '+91 80 4178 5678', 'Burmese · Vegan-friendly', '$$$',
   '{veg,vegan}', true,
   array['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200']),

  -- JAIN
  ('rajdhani-thali-phoenix',
   'Rajdhani Thali',
   'Unlimited Rajasthani-Gujarati thali with a dedicated Jain menu (no onion / garlic).',
   'Phoenix Marketcity, Whitefield Rd', 'Whitefield', 'Bengaluru',
   12.9956, 77.6962, '+91 80 4909 8800', 'Rajasthani · Gujarati · Jain', '$$$',
   '{jain,veg}', true,
   array['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=1200']),

  ('shreeraj-jain-chickpet',
   'Shreeraj Jain Bhojanalay',
   'Strict Jain kitchen in old Bangalore — no root vegetables, closed before sundown.',
   'Chickpet Main Rd, Chickpet', 'Chickpet', 'Bengaluru',
   12.9678, 77.5756, '+91 80 2287 1122', 'Jain · Gujarati', '$',
   '{jain,veg}', true,
   array['https://images.unsplash.com/photo-1631452180775-2c5f6e6a3c8b?w=1200']),

  ('kanti-sweets-jain-jayanagar',
   'Kanti Sweets',
   'Jain-marked sweets and chaat — kachori, sev puri without onion or garlic.',
   '11th Main, 4th Block, Jayanagar', 'Jayanagar', 'Bengaluru',
   12.9293, 77.5830, '+91 80 2663 4321', 'Sweets · Chaat', '$',
   '{jain,veg}', false,
   array['https://images.unsplash.com/photo-1601314002592-b8734bca6604?w=1200']),

  -- MULTI (Halal + Veg)
  ('nandhana-palace-koramangala',
   'Nandhana Palace',
   'Andhra meals hall — halal meat line and a clearly-marked pure-veg thali line.',
   '80 Feet Rd, Koramangala 4th Block', 'Koramangala', 'Bengaluru',
   12.9365, 77.6245, '+91 80 4123 1234', 'Andhra', '$$',
   '{halal,veg}', true,
   array['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200'])
on conflict (slug) do nothing;

-- Seed hours (Mon-Sun, 11:00-23:00) for every restaurant that doesn't have them
update public.restaurants
set hours = jsonb_build_object(
  'mon', jsonb_build_object('open', '11:00', 'close', '23:00'),
  'tue', jsonb_build_object('open', '11:00', 'close', '23:00'),
  'wed', jsonb_build_object('open', '11:00', 'close', '23:00'),
  'thu', jsonb_build_object('open', '11:00', 'close', '23:00'),
  'fri', jsonb_build_object('open', '11:00', 'close', '23:30'),
  'sat', jsonb_build_object('open', '11:00', 'close', '23:30'),
  'sun', jsonb_build_object('open', '11:00', 'close', '23:00')
)
where hours is null;
