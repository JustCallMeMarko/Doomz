/** Static periodic table data — offline reference, no API needed. */

export type ElementCategory =
  | "alkali"
  | "alkaline"
  | "transition"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble"
  | "lanthanide"
  | "actinide";

export interface PeriodicElement {
  z: number;
  symbol: string;
  name: string;
  category: ElementCategory;
  /** Atomic mass (standard atomic weight, rounded). */
  mass: number;
  /** 1-based grid column (1..18) and row (1..9; 8 = lanthanides, 9 = actinides). */
  x: number;
  y: number;
  /** IUPAC group (1-18), period (1-7), and block (s/p/d/f). */
  group: number;
  period: number;
  block: "s" | "p" | "d" | "f";
  /** State at standard temperature/pressure. */
  state: "solid" | "liquid" | "gas";
  /** Ground-state electron configuration, e.g. [Ar] 3d6 4s2. */
  electronConfig: string;
  info: string;
  /** Practical uses, grid-down framing. */
  uses: string;
  /** Exactly 3 common examples of where to get it. */
  examples: [string, string, string];
}

export const CATEGORY_META: Record<ElementCategory, { label: string; tile: string }> = {
  alkali: { label: "Alkali metal", tile: "border-red-500/50 bg-red-500/10 hover:bg-red-500/20" },
  alkaline: { label: "Alkaline earth", tile: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20" },
  transition: { label: "Transition metal", tile: "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20" },
  "post-transition": { label: "Post-transition metal", tile: "border-lime-500/50 bg-lime-500/10 hover:bg-lime-500/20" },
  metalloid: { label: "Metalloid", tile: "border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20" },
  nonmetal: { label: "Nonmetal", tile: "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20" },
  halogen: { label: "Halogen", tile: "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20" },
  noble: { label: "Noble gas", tile: "border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20" },
  lanthanide: { label: "Lanthanide", tile: "border-fuchsia-500/50 bg-fuchsia-500/10 hover:bg-fuchsia-500/20" },
  actinide: { label: "Actinide", tile: "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20" },
};

/** [z, symbol, name, category, mass, column, row, info, uses, [example1, example2, example3]] */
type Row = [number, string, string, ElementCategory, number, number, number, string, string, [string, string, string]];

const ROWS: Row[] = [
  [1, "H", "Hydrogen", "nonmetal", 1, 1, 1, "Lightest element; fills most of the universe.", "Fuel gas, water chemistry, ammonia synthesis", ["Water electrolysis", "Steam reforming of biomass/biogas", "Zinc + acid reaction"]],
  [2, "He", "Helium", "noble", 4, 18, 1, "Inert lifting and cooling gas that escapes to space once released.", "Balloons, MRI cooling, shielding gas", ["Party balloon tanks", "Natural gas wells (trace)", "Welding supply shops"]],
  [3, "Li", "Lithium", "alkali", 6.9, 1, 2, "Reactive light metal central to modern batteries.", "Rechargeable batteries, mood medication, grease", ["18650/lithium battery salvage", "Brine evaporation", "Lithium grease tubes"]],
  [4, "Be", "Beryllium", "alkaline", 9, 2, 2, "Stiff light aerospace metal; dust is highly toxic.", "Aerospace parts, X-ray windows, springs", ["Old aircraft scrap", "X-ray tube windows", "Non-sparking tool alloys"]],
  [5, "B", "Boron", "metalloid", 10.8, 13, 2, "Metalloid behind borax and borosilicate glass.", "Laundry booster, neutron absorbers, glass", ["Borax cleaning powder", "Pyrex/borosilicate glassware", "Boric acid roach killer"]],
  [6, "C", "Carbon", "nonmetal", 12, 14, 2, "Basis of all life; also steel's key alloying element.", "Charcoal fuel, water filtration, steel hardening", ["Charcoal from wood", "Activated carbon filters", "Graphite pencil cores"]],
  [7, "N", "Nitrogen", "nonmetal", 14, 15, 2, "78% of air; the feedstock for fertilizer and explosives.", "Nitrate fertilizer, food preservation, refrigeration", ["Compost and manure nitrates", "Urine processing", "Air separation"]],
  [8, "O", "Oxygen", "nonmetal", 16, 16, 2, "Oxidizer required by fire and breathing.", "Medical oxygen, welding, water treatment", ["Electrolysis of water", "O2 concentrator machines", "Compressed gas bottles"]],
  [9, "F", "Fluorine", "halogen", 19, 17, 2, "Most reactive element; its compounds harden teeth.", "Fluoride dental care, Teflon coatings, refrigerants", ["Fluoride toothpaste", "Water fluoridation supplies", "Non-stick cookware coating"]],
  [10, "Ne", "Neon", "noble", 20.2, 18, 2, "Inert gas famous for orange-red signage glow.", "Neon signs, cryogenics, vacuum tubes", ["Neon sign salvage", "High-voltage indicator lamps", "Lab gas suppliers"]],
  [11, "Na", "Sodium", "alkali", 23, 1, 3, "Soft reactive metal; its chloride is table salt.", "Salt for food preservation, water softening, lye making", ["Table salt", "Seawater evaporation", "Baking/washing soda"]],
  [12, "Mg", "Magnesium", "alkaline", 24.3, 2, 3, "Light structural metal that burns blinding white.", "Fire starters, light alloys, antacid medicine", ["Ferro rod/Mg fire starters", "Epsom salt (sulfate)", "Old wheels and laptop frames"]],
  [13, "Al", "Aluminium", "post-transition", 27, 13, 3, "Light corrosion-proof metal everywhere in civil life.", "Cookware, wiring, aircraft and cans", ["Scrap cans and foil", "Aircraft/bike frames", "Window frames and siding"]],
  [14, "Si", "Silicon", "metalloid", 28.1, 14, 3, "Semiconductor at the heart of chips and glass.", "Solar cells, glass, silicone sealant", ["Sand and quartz", "Salvaged solar panels", "Electronics and chips"]],
  [15, "P", "Phosphorus", "nonmetal", 31, 15, 3, "Fertilizer essential; white form ignites on contact with air.", "Fertilizer, matches, smoke devices", ["Bone ash", "NPK fertilizer bags", "Urine processing"]],
  [16, "S", "Sulfur", "nonmetal", 32.1, 16, 3, "Brimstone — yellow, flammable, sharp-smelling.", "Gunpowder, sulfuric acid, fungicide, vulcanization", ["Garden sulfur dust", "Match heads", "Gypsum/drywall processing"]],
  [17, "Cl", "Chlorine", "halogen", 35.5, 17, 3, "Disinfectant halogen behind bleach and PVC.", "Water purification, bleach, PVC plastic", ["Household bleach", "Pool chlorine tablets", "Brine electrolysis"]],
  [18, "Ar", "Argon", "noble", 39.9, 18, 3, "Inert gas making up ~1% of air.", "Welding shield gas, bulb fill, wine preservation", ["TIG welding bottles", "Incandescent bulb fill", "Welding supply shops"]],
  [19, "K", "Potassium", "alkali", 39.1, 1, 4, "Reactive metal vital to nerves and crops.", "Potash fertilizer, electrolytes, soap making", ["Wood ash (potash)", "Banana peels and compost", "Fertilizer blends"]],
  [20, "Ca", "Calcium", "alkaline", 40.1, 2, 4, "Element of bones, shells and cement.", "Lime mortar/plaster, soil amendment, supplements", ["Limestone and chalk", "Eggshells and bones", "Gypsum drywall"]],
  [21, "Sc", "Scandium", "transition", 45, 3, 4, "Rare light metal used in elite aluminium alloys.", "Aerospace alloys, high-end bike frames", ["Aerospace scrap", "Premium bicycle frames", "Specialty alloy dealers"]],
  [22, "Ti", "Titanium", "transition", 47.9, 4, 4, "Strong, light, corrosion-proof premium metal.", "Implants, tools, aircraft parts", ["Aircraft and bicycle frames", "Golf club heads", "Implant/surgical scrap"]],
  [23, "V", "Vanadium", "transition", 50.9, 5, 4, "Steel strengthener for tools and springs.", "Tool steels, flow batteries, axles", ["Tool steel scrap", "Crankshafts and axles", "Redox battery cells"]],
  [24, "Cr", "Chromium", "transition", 52, 6, 4, "Hard shiny plating; the key to stainless steel.", "Chrome plating, stainless steel, tanning", ["Stainless steel scrap", "Chrome bumper trim", "Chrome-vanadium tools"]],
  [25, "Mn", "Manganese", "transition", 54.9, 7, 4, "Steel desulfurizer and battery cathode.", "Steel making, alkaline batteries, pigments", ["AA alkaline battery black mass", "Hard steel scrap", "Soil micronutrient mixes"]],
  [26, "Fe", "Iron", "transition", 55.8, 8, 4, "The backbone metal of civilization and blood.", "Steel, tools, structures, cookware", ["Scrap iron and steel", "Old machinery and rebar", "Cast-iron cookware"]],
  [27, "Co", "Cobalt", "transition", 58.9, 9, 4, "Batteries, magnets and deep-blue pigment.", "Li-ion cathodes, superalloys, pigments", ["Li-ion battery packs", "Magnet scrap", "Cobalt drill bits"]],
  [28, "Ni", "Nickel", "transition", 58.7, 10, 4, "Corrosion-proof alloy metal in steel and coins.", "Stainless steel, coins, NiMH batteries", ["Stainless steel scrap", "Coins", "NiMH rechargeable batteries"]],
  [29, "Cu", "Copper", "transition", 63.5, 11, 4, "Top electrical conductor after silver.", "Wiring, motors, plumbing, antimicrobial surfaces", ["Electrical wire and motors", "Copper pipe", "Brass and bronze scrap"]],
  [30, "Zn", "Zinc", "transition", 65.4, 12, 4, "Sacrificial coating that keeps steel from rusting.", "Galvanizing, brass, batteries, skin cream", ["Galvanized steel and nails", "Die-cast parts and carburetors", "Carbon-zinc battery casings"]],
  [31, "Ga", "Gallium", "post-transition", 69.7, 13, 4, "Metal that melts in your hand; LED backbone.", "LEDs, semiconductors, thermometers", ["LED strips and lamps", "Gallium thermometers", "Old RF electronics"]],
  [32, "Ge", "Germanium", "metalloid", 72.6, 14, 4, "First transistor semiconductor; infrared optics.", "IR lenses, fiber optics, vintage audio", ["Old transistors and diodes", "Thermal camera optics", "Fiber optic cable"]],
  [33, "As", "Arsenic", "metalloid", 74.9, 15, 4, "Historic poison; also a useful semiconductor dopant.", "Old wood preservative, alloys, semiconductors", ["Pre-2003 pressure-treated lumber", "Old pesticide containers", "Lead alloy hardeners"]],
  [34, "Se", "Selenium", "nonmetal", 79, 16, 4, "Trace nutrient and light-sensitive element.", "Photocells, glass decolorizing, supplements", ["Brazil nuts", "Multivitamins", "Old photocopier drums"]],
  [35, "Br", "Bromine", "halogen", 79.9, 17, 4, "Dense red liquid halogen.", "Flame retardants, photo chemistry, spa sanitizer", ["Flame-retardant plastics", "Hot tub bromine tablets", "Old photographic chemicals"]],
  [36, "Kr", "Krypton", "noble", 83.8, 18, 4, "Inert gas for high-end flashes and windows.", "Camera flashes, insulated windows, lasers", ["Photographic flash tubes", "High-end window units", "Excimer laser tubes"]],
  [37, "Rb", "Rubidium", "alkali", 85.5, 1, 5, "Soft metal that ignites in air; timekeeping standard.", "Atomic clocks, photoelectric cells, research", ["Atomic clock modules", "GPS timing units", "Lab suppliers"]],
  [38, "Sr", "Strontium", "alkaline", 87.6, 2, 5, "Burns brilliant crimson — the red in fireworks.", "Fireworks and flares, ceramics, toothpaste", ["Emergency road flares", "Red fireworks", "Strontium ceramic magnets"]],
  [39, "Y", "Yttrium", "transition", 88.9, 3, 5, "Rare earth metal behind red CRT phosphor.", "Phosphors, superconductors, YAG lasers", ["Old CRT displays", "YAG laser crystals", "Ceramic superconductors"]],
  [40, "Zr", "Zirconium", "transition", 91.2, 4, 5, "Extremely corrosion-proof; invisible to neutrons.", "Nuclear cladding, ceramic knives, CZ gems", ["Cubic zirconia jewelry", "Ceramic knife blades", "Nuclear fuel cladding"]],
  [41, "Nb", "Niobium", "transition", 92.9, 5, 5, "Superconducting metal for the strongest magnets.", "MRI magnets, pipeline steel, jewelry", ["MRI magnet scrap", "Niobium jewelry", "Superconducting wire"]],
  [42, "Mo", "Molybdenum", "transition", 95.9, 6, 5, "High-temperature steel hardener and lubricant.", "Tool steels, MoS2 grease, filaments", ["Tool and drill steel", "Moly grease tubes", "Heating element wire"]],
  [43, "Tc", "Technetium", "transition", 98, 7, 5, "First human-made element; medical tracer isotope.", "Nuclear medicine imaging", ["Hospital radiopharmacy", "Medical isotope generators", "Not otherwise obtainable"]],
  [44, "Ru", "Ruthenium", "transition", 101.1, 8, 5, "Hard platinum-group metal for electronics.", "Electrical contacts, catalysts, pen nibs", ["Thick-film chip resistors", "Hard drive platters", "Catalyst pellets"]],
  [45, "Rh", "Rhodium", "transition", 102.9, 9, 5, "Rarest precious metal; platinum-white shine.", "Catalytic converters, mirror coatings, plating", ["Catalytic converters", "White-gold plating", "Searchlight reflectors"]],
  [46, "Pd", "Palladium", "transition", 106.4, 10, 5, "Hydrogen-absorbing catalyst metal.", "Catalytic converters, hydrogen purification, dentistry", ["Catalytic converters", "Ceramic capacitors (MLCC)", "Dental crown scrap"]],
  [47, "Ag", "Silver", "transition", 107.9, 11, 5, "Best electrical conductor; kills microbes on contact.", "Electronics, jewelry, antibacterial wound dressings", ["Coins and jewelry", "Electronics contacts and solder", "Photo film processing"]],
  [48, "Cd", "Cadmium", "post-transition", 112.4, 12, 5, "Toxic heavy metal — useful but dangerous.", "NiCd batteries, yellow pigment, plating", ["NiCd power-tool batteries", "Cadmium yellow paints", "Old plated hardware"]],
  [49, "In", "Indium", "post-transition", 114.8, 13, 5, "Soft metal behind every touchscreen.", "ITO display coatings, low-melt solder, seals", ["LCD touchscreens (ITO layer)", "Indium solder", "Old flat-panel displays"]],
  [50, "Sn", "Tin", "post-transition", 118.7, 14, 5, "Solder metal; coats cans against corrosion.", "Solder, tin plating, bronze alloy", ["Electronics solder", "Tin-plated food cans", "Pewter and bronze scrap"]],
  [51, "Sb", "Antimony", "metalloid", 121.8, 15, 5, "Brittle metalloid that hardens lead.", "Battery plates, flame retardants, pewter", ["Lead-acid battery plates", "Type metal and pewter", "Flame-retardant plastics"]],
  [52, "Te", "Tellurium", "metalloid", 127.6, 16, 5, "Rare metalloid for solar and thermoelectrics.", "Solar cells, thermoelectric coolers, steel additive", ["CdTe solar panels", "Peltier cooler modules", "Free-machining steel"]],
  [53, "I", "Iodine", "halogen", 126.9, 17, 5, "Disinfectant halogen essential to the thyroid.", "Wound antiseptic, water purification, thyroid medicine", ["Povidone-iodine bottles", "Water-purification tablets", "Iodized salt"]],
  [54, "Xe", "Xenon", "noble", 131.3, 18, 5, "Heavy inert gas for brilliant arc light.", "HID headlamps, projector bulbs, ion thrusters", ["HID/xenon headlamps", "Cinema projector lamps", "Strobe flash tubes"]],
  [55, "Cs", "Caesium", "alkali", 132.9, 1, 6, "Most reactive common metal; defines the second.", "Atomic clocks, drilling fluids, photoelectric cells", ["Atomic clock modules", "Cesium formate brine (oilfield)", "Lab suppliers"]],
  [56, "Ba", "Barium", "alkaline", 137.3, 2, 6, "Dense alkaline metal; compounds glow green.", "Medical imaging contrast, fireworks, drilling mud", ["Barium meal kits (medical)", "Green fireworks", "Oil-drilling barite"]],
  [57, "La", "Lanthanum", "lanthanide", 138.9, 3, 6, "First lanthanide; improves glass and batteries.", "Camera optics, NiMH batteries, lighter flints", ["Camera lens glass", "NiMH battery alloy", "Ferrocerium flints"]],
  [58, "Ce", "Cerium", "lanthanide", 140.1, 3, 8, "Most abundant rare earth; spark-maker.", "Ferrocerium flints, glass polishing, catalysts", ["Lighter/flint strikers", "Cerium oxide polishing powder", "Catalytic converters"]],
  [59, "Pr", "Praseodymium", "lanthanide", 140.9, 4, 8, "Rare earth for magnets and yellow glass.", "Strong magnets, glass coloring, arc electrodes", ["NdFeB magnet scrap", "Didymium glassblowing lenses", "Carbon arc rods"]],
  [60, "Nd", "Neodymium", "lanthanide", 144.2, 5, 8, "Source of the world's strongest magnets.", "Permanent magnets, motors, speakers", ["Hard drive voice-coil magnets", "Speakers and headphones", "Cordless tool motors"]],
  [61, "Pm", "Promethium", "lanthanide", 145, 6, 8, "Radioactive rare earth with no stable form.", "Old luminous paint, nuclear batteries", ["Vintage luminous dials", "Betavoltaic cells", "Not practically obtainable"]],
  [62, "Sm", "Samarium", "lanthanide", 150.4, 7, 8, "Heat-proof magnet rare earth.", "SmCo magnets, reactor control rods, lasers", ["SmCo magnet scrap", "Precision motors", "Laser gain media"]],
  [63, "Eu", "Europium", "lanthanide", 152, 8, 8, "Red phosphor rare earth of screens and Euros.", "Display phosphors, anti-counterfeit inks", ["CRT/TV red phosphors", "Euro banknote ink", "LED phosphor coatings"]],
  [64, "Gd", "Gadolinium", "lanthanide", 157.3, 9, 8, "Highly magnetic; MRI contrast workhorse.", "MRI contrast agents, magnetic refrigeration", ["MRI contrast vials", "Magnetocaloric materials", "Neutron shielding"]],
  [65, "Tb", "Terbium", "lanthanide", 158.9, 10, 8, "Green phosphor rare earth.", "Green screen/lamp phosphors, magnetostrictive actuators", ["Fluorescent lamp phosphor", "CRT green phosphors", "Sonar transducer alloys"]],
  [66, "Dy", "Dysprosium", "lanthanide", 162.5, 11, 8, "Keeps magnets strong when hot.", "High-temp magnets, control rods, hard drives", ["EV/wind-turbine magnets", "Nuclear control rods", "Hard drive media"]],
  [67, "Ho", "Holmium", "lanthanide", 164.9, 12, 8, "Strongest magnetic moment of any element.", "Surgical lasers, magnetic pole pieces", ["Ho:YAG surgical lasers", "Magnet pole pieces", "Specialty glass filters"]],
  [68, "Er", "Erbium", "lanthanide", 167.3, 13, 8, "Pink rare earth that amplifies fiber light.", "Fiber-optic amplifiers, pink glass, dermatology lasers", ["Fiber-optic amplifier modules", "Pink glazes and sunglasses", "Er:YAG lasers"]],
  [69, "Tm", "Thulium", "lanthanide", 168.9, 14, 8, "Rarest stable lanthanide.", "Portable X-ray sources, lasers", ["Portable X-ray units", "Tm-doped lasers", "Not practically obtainable"]],
  [70, "Yb", "Ytterbium", "lanthanide", 173, 15, 8, "Fiber-laser doping rare earth.", "Fiber lasers, atomic clocks, stress gauges", ["Fiber laser modules", "Atomic clock research", "Stainless steel stress gauges"]],
  [71, "Lu", "Lutetium", "lanthanide", 175, 16, 8, "Densest rare earth; PET-scan scintillator.", "PET detectors, cancer therapy isotope", ["PET scanner crystals (LSO)", "Radiopharmaceuticals", "Lab suppliers"]],
  [72, "Hf", "Hafnium", "transition", 178.5, 4, 6, "Neutron-hungry metal twin of zirconium.", "Reactor control rods, CPU insulators, plasma tips", ["Nuclear control rods", "CPU high-k dielectric layers", "Plasma cutter electrodes"]],
  [73, "Ta", "Tantalum", "transition", 180.9, 5, 6, "Corrosion-proof capacitor metal.", "Phone capacitors, implants, chemical equipment", ["Tantalum capacitors on boards", "Surgical implant scrap", "Corrosion-proof labware"]],
  [74, "W", "Tungsten", "transition", 183.8, 6, 6, "Highest melting point of all metals.", "Bulb filaments, drill bits, armor penetrators", ["Incandescent bulb filaments", "Carbide tooling and bits", "Tungsten darts/weights"]],
  [75, "Re", "Rhenium", "transition", 186.2, 7, 6, "Ultra-rare superalloy metal.", "Jet turbine blades, catalysts, filaments", ["Jet engine turbine scrap", "Reforming catalysts", "Mass spectrometer filaments"]],
  [76, "Os", "Osmium", "transition", 190.2, 8, 6, "Densest naturally occurring element.", "Pen nibs, record needles, electrical contacts", ["Fountain pen iridium tips", "Phonograph needles", "Instrument pivot points"]],
  [77, "Ir", "Iridium", "transition", 192.2, 9, 6, "Most corrosion-proof metal known.", "Spark plugs, crucibles, pen tips", ["Iridium spark plugs", "Lab crucibles", "Pen nib tipping"]],
  [78, "Pt", "Platinum", "transition", 195.1, 10, 6, "Premier catalyst and jewelry metal.", "Catalytic converters, jewelry, labware", ["Catalytic converters", "Platinum jewelry", "Lab electrodes and crucibles"]],
  [79, "Au", "Gold", "transition", 197, 11, 6, "Untarnishing conductor and eternal money.", "Electronics contacts, jewelry, dentistry", ["Connector pins and PCB fingers", "Jewelry and coins", "Dental gold scrap"]],
  [80, "Hg", "Mercury", "transition", 200.6, 12, 6, "Only metal liquid at room temperature; toxic vapor.", "Thermometers, switches, lamps, amalgam", ["Old thermometers/thermostats", "Fluorescent tubes and CFLs", "Tilt switches and relays"]],
  [81, "Tl", "Thallium", "post-transition", 204.4, 13, 6, "The poisoner's poison; also IR optics.", "IR lenses, old rat poison (banned)", ["IR optical windows", "Scintillation crystals", "Historic poison — avoid"]],
  [82, "Pb", "Lead", "post-transition", 207.2, 14, 6, "Dense soft metal; blocks radiation.", "Batteries, shielding, solder, weights", ["Car batteries", "Wheel weights and fishing sinkers", "Old pipes and flashing"]],
  [83, "Bi", "Bismuth", "post-transition", 209, 15, 6, "Safely heavy metal with rainbow crystals.", "Stomach medicine, low-melt alloys, lead-free shot", ["Pepto-Bismol", "Low-melt fusible alloys", "Lead-free fishing shot"]],
  [84, "Po", "Polonium", "post-transition", 209, 16, 6, "Fiercely radioactive rare element.", "Antistatic brushes, heat sources", ["Antistatic brush strips", "Uranium ore (trace)", "Dangerously radioactive — avoid"]],
  [85, "At", "Astatine", "halogen", 210, 17, 6, "Rarest natural element on Earth.", "Cancer-therapy research isotope", ["Cyclotron-produced isotopes", "Uranium decay (trace)", "Not practically obtainable"]],
  [86, "Rn", "Radon", "noble", 222, 18, 6, "Radioactive soil gas; indoor lung-cancer risk.", "Nothing — it's a hazard to vent, not harvest", ["Basement soil seepage", "Radon test kits", "Ventilation is the fix"]],
  [87, "Fr", "Francium", "alkali", 223, 1, 7, "Most unstable natural element; vanishes in minutes.", "Research only — none", ["Actinium decay chains", "Particle accelerators", "Not practically obtainable"]],
  [88, "Ra", "Radium", "alkaline", 226, 2, 7, "Glowing radioactive metal of watch-dial infamy.", "Historic luminous paint, old medical sources", ["Vintage luminous dials", "Antique medical quackery", "Dangerously radioactive — avoid"]],
  [89, "Ac", "Actinium", "actinide", 227, 3, 7, "Radioactive namesake of the actinide series.", "Neutron sources, cancer therapy research", ["Neutron generator sources", "Targeted alpha therapy trials", "Not practically obtainable"]],
  [90, "Th", "Thorium", "actinide", 232, 3, 9, "Weakly radioactive metal brighter than expected.", "Gas lantern mantles, TIG electrodes, lens glass", ["Gas lantern mantles", "Thoriated TIG welding rods", "Monazite sand"]],
  [91, "Pa", "Protactinium", "actinide", 231, 4, 9, "Rare dense radioactive actinide.", "Research only — none", ["Uranium ore extraction", "Lab suppliers", "Not practically obtainable"]],
  [92, "U", "Uranium", "actinide", 238, 5, 9, "Nuclear fuel and counterweight metal.", "Reactor fuel, uranium glass, counterweights", ["Uranium glass / Fiestaware", "Aircraft counterweights (old)", "Pitchblende ore"]],
  [93, "Np", "Neptunium", "actinide", 237, 6, 9, "First transuranic element, made in reactors.", "Precursor to Pu-238, research", ["Spent nuclear fuel", "Am-241 decay in detectors", "Not practically obtainable"]],
  [94, "Pu", "Plutonium", "actinide", 244, 7, 9, "Weapons/fuel metal powering deep-space probes.", "RTG space batteries, reactor fuel", ["RTG units (spacecraft)", "Reactor-grade material", "Strictly controlled — unavailable"]],
  [95, "Am", "Americium", "actinide", 243, 8, 9, "The element inside every smoke detector.", "Smoke detector ionization source, gauges", ["Ionization smoke detectors", "Density/moisture gauges", "Antique sources"]],
  [96, "Cm", "Curium", "actinide", 247, 9, 9, "Synthetic actinide for space alpha sources.", "Alpha sources, Mars-rover spectrometers", ["APXS instruments (rovers)", "Alpha sources in industry", "Not practically obtainable"]],
  [97, "Bk", "Berkelium", "actinide", 247, 10, 9, "Synthetic element made atom by atom.", "Research only — none", ["High-flux reactors", "National labs", "Not obtainable"]],
  [98, "Cf", "Californium", "actinide", 251, 11, 9, "Intense neutron source too hot to stockpile.", "Reactor start-up sources, ore scanners", ["Neutron startup sources", "Moisture/density scanners", "Licensed facilities only"]],
  [99, "Es", "Einsteinium", "actinide", 252, 12, 9, "Synthetic element discovered in H-bomb debris.", "Research only — none", ["Thermonuclear test debris", "Accelerator production", "Not obtainable"]],
  [100, "Fm", "Fermium", "actinide", 257, 13, 9, "Synthetic element named for Fermi.", "Research only — none", ["Reactor transmutation", "National labs", "Not obtainable"]],
  [101, "Md", "Mendelevium", "actinide", 258, 14, 9, "Synthetic element honoring Mendeleev.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [102, "No", "Nobelium", "actinide", 259, 15, 9, "Synthetic element honoring Nobel.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [103, "Lr", "Lawrencium", "actinide", 266, 16, 9, "Synthetic last actinide.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [104, "Rf", "Rutherfordium", "transition", 267, 4, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [105, "Db", "Dubnium", "transition", 268, 5, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [106, "Sg", "Seaborgium", "transition", 269, 6, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [107, "Bh", "Bohrium", "transition", 270, 7, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [108, "Hs", "Hassium", "transition", 277, 8, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [109, "Mt", "Meitnerium", "transition", 278, 9, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [110, "Ds", "Darmstadtium", "transition", 281, 10, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [111, "Rg", "Roentgenium", "transition", 282, 11, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [112, "Cn", "Copernicium", "transition", 285, 12, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [113, "Nh", "Nihonium", "post-transition", 286, 13, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [114, "Fl", "Flerovium", "post-transition", 289, 14, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [115, "Mc", "Moscovium", "post-transition", 290, 15, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [116, "Lv", "Livermorium", "post-transition", 293, 16, 7, "Synthetic superheavy metal.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [117, "Ts", "Tennessine", "halogen", 294, 17, 7, "Synthetic superheavy halogen.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
  [118, "Og", "Oganesson", "noble", 294, 18, 7, "Heaviest element ever made.", "Research only — none", ["Accelerator production", "National labs", "Not obtainable"]],
];

// --- Derived chemistry data ------------------------------------------------

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86, 118]);
const LIQUIDS = new Set([35, 80]);

/** Aufbau filling order: [subshell, capacity]. */
const SHELLS: [string, number][] = [
  ["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2],
  ["3d", 10], ["4p", 6], ["5s", 2], ["4d", 10], ["5p", 6], ["6s", 2],
  ["4f", 14], ["5d", 10], ["6p", 6], ["7s", 2], ["5f", 14], ["6d", 10], ["7p", 6],
];

const NOBLE: [number, string][] = [[2, "He"], [10, "Ne"], [18, "Ar"], [36, "Kr"], [54, "Xe"], [86, "Rn"]];

/** Observed ground-state configs that break the Aufbau rule. */
const CONFIG_EXCEPTIONS: Record<number, string> = {
  24: "[Ar] 3d5 4s1", 29: "[Ar] 3d10 4s1",
  41: "[Kr] 4d4 5s1", 42: "[Kr] 4d5 5s1", 44: "[Kr] 4d7 5s1", 45: "[Kr] 4d8 5s1",
  46: "[Kr] 4d10", 47: "[Kr] 4d10 5s1",
  57: "[Xe] 5d1 6s2", 58: "[Xe] 4f1 5d1 6s2", 64: "[Xe] 4f7 5d1 6s2",
  78: "[Xe] 4f14 5d9 6s1", 79: "[Xe] 4f14 5d10 6s1",
  89: "[Rn] 6d1 7s2", 90: "[Rn] 6d2 7s2", 91: "[Rn] 5f2 6d1 7s2",
  92: "[Rn] 5f3 6d1 7s2", 93: "[Rn] 5f4 6d1 7s2", 96: "[Rn] 5f7 6d1 7s2",
  103: "[Rn] 5f14 7s2 7p1",
};

function electronConfig(z: number): string {
  if (CONFIG_EXCEPTIONS[z]) return CONFIG_EXCEPTIONS[z];
  let n = z;
  const parts: string[] = [];
  for (const [sub, cap] of SHELLS) {
    if (n <= 0) break;
    const take = Math.min(n, cap);
    parts.push(`${sub}${take}`);
    n -= take;
  }
  // Compress the leading core to a noble-gas shorthand.
  const coreZ = NOBLE.filter(([nz]) => nz < z).at(-1);
  if (coreZ) {
    const [nz, sym] = coreZ;
    // Count how many subshells the noble gas fills so we can strip them.
    let remaining = nz;
    let i = 0;
    for (const [, cap] of SHELLS) {
      if (remaining <= 0) break;
      remaining -= cap;
      i++;
    }
    return `[${sym}] ${parts.slice(i).join(" ")}`;
  }
  return parts.join(" ");
}

function blockOf(x: number, y: number): "s" | "p" | "d" | "f" {
  if (y >= 8) return "f";
  if (x <= 2) return "s";
  if (x <= 12) return "d";
  return "p";
}

export const ELEMENTS: PeriodicElement[] = ROWS.map(
  ([z, symbol, name, category, mass, x, y, info, uses, examples]) => ({
    z,
    symbol,
    name,
    category,
    mass,
    x,
    y,
    group: x,
    period: y >= 8 ? (y === 8 ? 6 : 7) : y,
    block: blockOf(x, y),
    state: GASES.has(z) ? "gas" : LIQUIDS.has(z) ? "liquid" : "solid",
    electronConfig: electronConfig(z),
    info,
    uses,
    examples,
  }),
);
