-- =============================================================================
-- Barn Finder - seed: indoor ice rinks in major Ohio, Pennsylvania and Michigan metros
--
-- Run AFTER migrations/20261006000001_schema.sql, in the Supabase SQL Editor.
-- Inserts required fields only (name + address) plus map coordinates.
-- Safe to re-run: rinks already present (same name, city and state) are skipped.
--
-- Addresses were verified against rink, municipal and venue websites/listings
-- in October 2026. Coordinates come from OpenStreetMap building locations where
-- available, otherwise the US Census geocoder (street-level; can be off by a few
-- hundred meters - pins can be dragged to correct them in the app).
-- =============================================================================

begin;

insert into public.rinks (name, street, city, region, postal_code, country_code, latitude, longitude)
select v.name, v.street, v.city, v.region, v.postal_code, 'US', v.latitude, v.longitude
from (values
  -- Ohio (29)
  ('Slater Family Ice Arena', '417 N Mercer Rd', 'Bowling Green', 'OH', '43403', 41.378987, -83.627728),
  ('John M. Coyne Recreation Center Ice Rink', '7600 Memphis Ave', 'Brooklyn', 'OH', '44144', 41.440046, -81.738376),
  ('Northland Ice Center', '10400 Reading Rd', 'Cincinnati', 'OH', '45241', 39.253374, -84.423076),
  ('Queen City Sportsplex', '10765 Reading Rd', 'Cincinnati', 'OH', '45241', 39.262705, -84.416599),
  ('Rocket Arena', '1 Center Ct', 'Cleveland', 'OH', '44115', 41.496685, -81.688544),
  ('Cleveland Heights Community Center Ice Rinks', '1 Monticello Blvd', 'Cleveland Heights', 'OH', '44118', 41.515215, -81.570947),
  ('Nationwide Arena', '200 W Nationwide Blvd', 'Columbus', 'OH', '43215', 39.969190, -83.006105),
  ('Ohio State University Ice Rink', '390 Woody Hayes Dr', 'Columbus', 'OH', '43210', 40.005303, -83.018330),
  ('OhioHealth Chiller Easton', '3600 Chiller Ln', 'Columbus', 'OH', '43219', 40.054608, -82.925589),
  ('OhioHealth Ice Haus', '200 W Nationwide Blvd', 'Columbus', 'OH', '43215', 39.968484, -83.006641),
  ('Value City Arena at the Schottenstein Center', '555 Borror Dr', 'Columbus', 'OH', '43210', 40.007603, -83.024957),
  ('OhioHealth Chiller Dublin', '7001 Dublin Park Dr', 'Dublin', 'OH', '43016', 40.100611, -83.187373),
  ('North Park Ice Arena', '901 Duffey St', 'Elyria', 'OH', '44035', 41.386472, -82.072176),
  ('C.E. Orr Ice Arena', '22550 Milton Ave', 'Euclid', 'OH', '44123', 41.600828, -81.522981),
  ('Floyd E. Stefanski Ice Center (Gilmour Academy)', '2045 SOM Center Rd', 'Gates Mills', 'OH', '44040', 41.505180, -81.438393),
  ('Kettering Recreation Complex Ice Arena', '2900 Glengarry Dr', 'Kettering', 'OH', '45420', 39.695317, -84.113961),
  ('Serpentini Arena at Winterhurst', '14740 Lakewood Heights Blvd', 'Lakewood', 'OH', '44107', 41.470371, -81.798342),
  ('OhioHealth Chiller North', '8144 Highfield Dr', 'Lewis Center', 'OH', '43035', 40.168756, -83.015558),
  ('Mentor Civic Arena', '8600 Munson Rd', 'Mentor', 'OH', '44060', 41.698459, -81.332139),
  ('North Olmsted Recreation Center Ice Rink', '26000 Lorain Rd', 'North Olmsted', 'OH', '44070', 41.420551, -81.909925),
  ('Goggin Ice Center', '610 S Oak St', 'Oxford', 'OH', '45056', 39.504512, -84.736301),
  ('Michael A. Reis Ice Rink', '5000 Forestwood Dr', 'Parma', 'OH', '44134', 41.402208, -81.720082),
  ('Hamilton Ice Arena', '21018 Hilliard Blvd', 'Rocky River', 'OH', '44116', 41.467181, -81.856576),
  ('Thornton Park Ice Arena', '20701 Farnsleigh Rd', 'Shaker Heights', 'OH', '44122', 41.470443, -81.534392),
  ('Brunswick Auto Mart Arena', '15381 Royalton Rd', 'Strongsville', 'OH', '44136', 41.313158, -81.802964),
  ('Sylvania Tam-O-Shanter', '7060 Sylvania Ave', 'Sylvania', 'OH', '43560', 41.689395, -83.713137),
  ('Huntington Center', '500 Jefferson Ave', 'Toledo', 'OH', '43604', 41.650603, -83.536933),
  ('Hobart Arena', '255 Adams St', 'Troy', 'OH', '45373', 40.046143, -84.205875),
  ('OhioHealth Chiller Ice Works', '401 E Wilson Bridge Rd', 'Worthington', 'OH', '43085', 40.107480, -83.002182),
  -- Pennsylvania (24)
  ('PPL Center', '701 Hamilton St', 'Allentown', 'PA', '18101', 40.602655, -75.472882),
  ('Philadelphia Skating Club and Humane Society', '220 Holland Ave', 'Ardmore', 'PA', '19003', 40.008440, -75.301487),
  ('IceWorks Skating Complex', '3000 Dutton Mill Rd', 'Aston', 'PA', '19014', 39.858692, -75.423864),
  ('cfsbank Event Center', '111 Gallitin Rd', 'Belle Vernon', 'PA', '15012', 40.198264, -79.828794),
  ('Steel Ice Center', '320 E 1st St', 'Bethlehem', 'PA', '18015', 40.613825, -75.373868),
  ('Printscape Arena at Southpointe', '114 Southpointe Blvd', 'Canonsburg', 'PA', '15317', 40.277903, -80.161580),
  ('Hatfield Ice Arena', '350 County Line Rd', 'Colmar', 'PA', '18915', 40.280131, -75.256594),
  ('UPMC Lemieux Sports Complex', '8000 Cranberry Springs Dr', 'Cranberry Township', 'PA', '16066', 40.687922, -80.094353),
  ('Erie Insurance Arena', '809 French St', 'Erie', 'PA', '16501', 42.127868, -80.080867),
  ('Twin Ponds East', '3904 Corey Rd', 'Harrisburg', 'PA', '17109', 40.273832, -76.823648),
  ('The Skatium', '1002 Darby Rd', 'Havertown', 'PA', '19083', 39.976924, -75.304299),
  ('Giant Center', '550 W Hersheypark Dr', 'Hershey', 'PA', '17033', 40.286412, -76.669094),
  ('Class of 1923 Arena', '3130 Walnut St', 'Philadelphia', 'PA', '19104', 39.951735, -75.187030),
  ('Flyers Skate Zone Northeast Philadelphia', '10990 Decatur Rd', 'Philadelphia', 'PA', '19154', 40.093742, -74.990805),
  ('Wissahickon Skating Club', '550 W Willow Grove Ave', 'Philadelphia', 'PA', '19118', 40.063650, -75.207816),
  ('Xfinity Mobile Arena', '3601 S Broad St', 'Philadelphia', 'PA', '19148', 39.901191, -75.171892),
  ('Alpha Ice Complex', '66 Alpha Dr W', 'Pittsburgh', 'PA', '15238', 40.539861, -79.834765),
  ('Clearview Arena', '7600 Grand Ave', 'Pittsburgh', 'PA', '15225', 40.517575, -80.149349),
  ('Ice Castle Arena', '990 Castle Shannon Blvd', 'Pittsburgh', 'PA', '15234', 40.366213, -80.026441),
  ('Mt. Lebanon Ice Center', '900 Cedar Blvd', 'Pittsburgh', 'PA', '15228', 40.374085, -80.055439),
  ('PPG Paints Arena', '1001 Fifth Ave', 'Pittsburgh', 'PA', '15219', 40.438855, -79.990767),
  ('Pegula Ice Arena', '250 University Dr', 'University Park', 'PA', '16802', 40.806643, -77.857020),
  ('Baierl Ice Complex', '103 Marshall Dr', 'Warrendale', 'PA', '15086', 40.667902, -80.100585),
  ('Ice Line Quad Rinks', '700 Lawrence Dr', 'West Chester', 'PA', '19380', 39.983152, -75.584509),
  -- Michigan (34)
  ('Ann Arbor Ice Cube', '2121 Oak Valley Dr', 'Ann Arbor', 'MI', '48103', 42.254210, -83.778214),
  ('Veterans Memorial Park Ice Arena', '2150 Jackson Ave', 'Ann Arbor', 'MI', '48103', 42.281536, -83.778012),
  ('Yost Ice Arena', '1116 S State St', 'Ann Arbor', 'MI', '48104', 42.267617, -83.741025),
  ('Birmingham Ice Arena', '2300 E Lincoln St', 'Birmingham', 'MI', '48009', 42.538437, -83.192334),
  ('Detroit Skating Club', '888 Denison Ct', 'Bloomfield Hills', 'MI', '48302', 42.607932, -83.290825),
  ('Southside Ice Arena', '566 100th St SW', 'Byron Center', 'MI', '49315', 42.782622, -85.677631),
  ('Arctic Edge Ice Arena', '46615 Michigan Ave', 'Canton', 'MI', '48188', 42.267988, -83.497366),
  ('Dearborn Ice Skating Center', '14900 Ford Rd', 'Dearborn', 'MI', '48126', 42.330362, -83.189350),
  ('Little Caesars Arena', '2645 Woodward Ave', 'Detroit', 'MI', '48201', 42.340986, -83.055004),
  ('Munn Ice Arena', '1 Chestnut Rd', 'East Lansing', 'MI', '48824', 42.728165, -84.489364),
  ('Suburban Ice East Lansing', '2810 Hannah Blvd', 'East Lansing', 'MI', '48823', 42.720050, -84.454173),
  ('Farmington Hills Ice Arena', '35500 W Eight Mile Rd', 'Farmington Hills', 'MI', '48335', 42.440077, -83.395095),
  ('Suburban Ice Farmington Hills', '23996 Freeway Park Dr', 'Farmington Hills', 'MI', '48335', 42.465911, -83.422356),
  ('Dort Financial Center', '3501 Lapeer Rd', 'Flint', 'MI', '48503', 43.009927, -83.644259),
  ('Fraser Hockeyland', '34400 Utica Rd', 'Fraser', 'MI', '48026', 42.549087, -82.955961),
  ('Garden City Ice Arena', '200 Log Cabin Rd', 'Garden City', 'MI', '48135', 42.311384, -83.345548),
  ('Griff''s IceHouse at Belknap Park', '30 Coldbrook St NE', 'Grand Rapids', 'MI', '49503', 42.981220, -85.665256),
  ('Patterson Ice Center', '2550 Patterson Ave SE', 'Grand Rapids', 'MI', '49546', 42.916928, -85.547604),
  ('Van Andel Arena', '130 Fulton St W', 'Grand Rapids', 'MI', '49503', 42.963166, -85.670898),
  ('Griff''s Georgetown', '8500 48th Ave', 'Hudsonville', 'MI', '49426', 42.923746, -85.901207),
  ('Kentwood Ice Arena', '6230 Kalamazoo Ave SE', 'Kentwood', 'MI', '49508', 42.849333, -85.620454),
  ('Eddie Edgar Ice Arena', '33841 Lyndon St', 'Livonia', 'MI', '48154', 42.389143, -83.377271),
  ('Suburban Ice Macomb', '54755 Broughton Rd', 'Macomb', 'MI', '48042', 42.700266, -82.920999),
  ('Mount Clemens Ice Arena', '200 N Groesbeck Hwy', 'Mount Clemens', 'MI', '48043', 42.609150, -82.893101),
  ('Novi Ice Arena', '42400 Nick Lidstrom Dr', 'Novi', 'MI', '48375', 42.460114, -83.468541),
  ('USA Hockey Arena', '14900 Beck Rd', 'Plymouth', 'MI', '48170', 42.389379, -83.506396),
  ('Suburban Ice Rochester', '52999 Dequindre Rd', 'Rochester', 'MI', '48307', 42.682441, -83.094231),
  ('John Lindell Ice Arena', '1403 Lexington Blvd', 'Royal Oak', 'MI', '48073', 42.521141, -83.161359),
  ('Southfield Sports Arena', '26000 Evergreen Rd', 'Southfield', 'MI', '48076', 42.480148, -83.240774),
  ('St. Clair Shores Civic Arena', '20000 Stephens St', 'St. Clair Shores', 'MI', '48080', 42.473008, -82.914547),
  ('Kennedy Recreation Center', '3101 West Rd', 'Trenton', 'MI', '48183', 42.139039, -83.204972),
  ('Troy Sports Center', '1819 E Big Beaver Rd', 'Troy', 'MI', '48083', 42.565353, -83.111809),
  ('Lakeland Ice Arena', '7330 Highland Rd', 'Waterford', 'MI', '48327', 42.660656, -83.431611),
  ('Yack Arena', '3131 3rd St', 'Wyandotte', 'MI', '48192', 42.201555, -83.152627)
) as v(name, street, city, region, postal_code, latitude, longitude)
where not exists (
  select 1 from public.rinks r
  where lower(r.name) = lower(v.name) and lower(r.city) = lower(v.city) and r.region = v.region
);

commit;
