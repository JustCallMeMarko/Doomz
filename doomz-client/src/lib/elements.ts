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
  /** 1-based grid column (1..18) and row (1..9; 8 = lanthanides, 9 = actinides). */
  x: number;
  y: number;
  info: string;
  /** Common ways to obtain it in a grid-down scenario. */
  sources: string;
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

/** [z, symbol, name, category, column, row, info, sources] */
type Row = [number, string, string, ElementCategory, number, number, string, string];

const ROWS: Row[] = [
  [1, "H", "Hydrogen", "nonmetal", 1, 1, "Lightest element; fuel, water chemistry, ammonia synthesis.", "Electrolysis of water, steam reforming of biomass/biogas"],
  [2, "He", "Helium", "noble", 18, 1, "Inert lifting and cooling gas; escapes into space once released.", "Natural gas wells (trace); not practical to produce"],
  [3, "Li", "Lithium", "alkali", 1, 2, "Reactive light metal; rechargeable batteries, mood medication.", "Salvage from lithium batteries, brine evaporation"],
  [4, "Be", "Beryllium", "alkaline", 2, 2, "Stiff light aerospace metal; dust is highly toxic.", "Old aircraft/space parts, X-ray windows — handle dust carefully"],
  [5, "B", "Boron", "metalloid", 13, 2, "Metalloid used in glass, detergents, neutron absorbers.", "Borax laundry booster, borosilicate glassware"],
  [6, "C", "Carbon", "nonmetal", 14, 2, "Basis of life; charcoal, steel alloying, water filtration.", "Charcoal from wood, graphite pencils, activated carbon"],
  [7, "N", "Nitrogen", "nonmetal", 15, 2, "78% of air; fertilizer (nitrates), refrigerant, explosives feedstock.", "Air separation, compost/manure nitrates, urine"],
  [8, "O", "Oxygen", "nonmetal", 16, 2, "Oxidizer for fire and respiration; medical gas, welding.", "Electrolysis of water, O2 concentrators, air"],
  [9, "F", "Fluorine", "halogen", 17, 2, "Most reactive element; fluoride salts for dental health, Teflon.", "Fluoride toothpaste/supplements — elemental form is dangerous"],
  [10, "Ne", "Neon", "noble", 18, 2, "Inert gas glowing orange in discharge tubes.", "Neon signs; not practical to produce"],
  [11, "Na", "Sodium", "alkali", 1, 3, "Soft reactive metal; table salt, street lights, coolant.", "Table salt, seawater evaporation, baking soda chemistry"],
  [12, "Mg", "Magnesium", "alkaline", 2, 3, "Light structural metal; burns blinding white, alloys, medicine.", "Fire starters, old wheels/laptop frames, Epsom salt, seawater"],
  [13, "Al", "Aluminium", "post-transition", 13, 3, "Light corrosion-proof metal; cans, wiring, cookware.", "Scrap cans, foil, aircraft parts, window frames"],
  [14, "Si", "Silicon", "metalloid", 14, 3, "Semiconductor and glass feedstock; sand and quartz.", "Sand, quartz, glass, solar panels, electronics"],
  [15, "P", "Phosphorus", "nonmetal", 15, 3, "Fertilizer essential; matches, smoke — white form ignites in air.", "Bone ash, fertilizer, urine processing"],
  [16, "S", "Sulfur", "nonmetal", 16, 3, "Brimstone; gunpowder, sulfuric acid, vulcanization, fungicide.", "Garden sulfur, matches, volcanic deposits, gypsum"],
  [17, "Cl", "Chlorine", "halogen", 17, 3, "Disinfectant gas; bleach, PVC, water treatment.", "Bleach, pool chlorine, electrolysis of brine"],
  [18, "Ar", "Argon", "noble", 18, 3, "Inert shielding gas for welding and bulbs; ~1% of air.", "Welding supply bottles, light bulbs"],
  [19, "K", "Potassium", "alkali", 1, 4, "Reactive metal; potash fertilizer and electrolyte.", "Wood ash (potash), bananas, fertilizer"],
  [20, "Ca", "Calcium", "alkaline", 2, 4, "Bones, lime mortar, plaster, water hardness.", "Limestone, chalk, bones/eggshells, gypsum, lime"],
  [21, "Sc", "Scandium", "transition", 3, 4, "Rare light metal in high-end aluminium alloys.", "Not practical — aerospace scrap only"],
  [22, "Ti", "Titanium", "transition", 4, 4, "Strong light corrosion-proof metal; implants, tools, aerospace.", "Aircraft/bicycle frames, golf clubs, implant scrap"],
  [23, "V", "Vanadium", "transition", 5, 4, "Steel strengthener; tool steels, flow batteries.", "Tool steel scrap"],
  [24, "Cr", "Chromium", "transition", 6, 4, "Hard shiny plating; stainless steel key ingredient.", "Stainless steel, chrome trim, tools"],
  [25, "Mn", "Manganese", "transition", 7, 4, "Steel desulfurizer; batteries, hard steels.", "Alkaline batteries, hard steel scrap"],
  [26, "Fe", "Iron", "transition", 8, 4, "Most used metal; steel, tools, structures, blood oxygen.", "Scrap iron/steel, rust, magnets, old machinery"],
  [27, "Co", "Cobalt", "transition", 9, 4, "Batteries, magnets, deep-blue pigment.", "Li-ion batteries, magnet scrap"],
  [28, "Ni", "Nickel", "transition", 10, 4, "Corrosion-proof alloy metal; stainless, coins, batteries.", "Stainless steel, coins, NiMH batteries"],
  [29, "Cu", "Copper", "transition", 11, 4, "Top electrical conductor; wiring, plumbing, antimicrobial.", "Wire, pipe, motors, transformers, brass/bronze scrap"],
  [30, "Zn", "Zinc", "transition", 12, 4, "Galvanizing, brass, batteries, skin medicine.", "Galvanized steel, die-cast parts, battery casings"],
  [31, "Ga", "Gallium", "post-transition", 13, 4, "Melts in your hand; LEDs, semiconductors.", "LEDs, old electronics"],
  [32, "Ge", "Germanium", "metalloid", 14, 4, "Early transistor semiconductor; IR optics.", "Old transistors, fiber optics"],
  [33, "As", "Arsenic", "metalloid", 15, 4, "Poisonous metalloid; old pesticides and wood preservative.", "Pressure-treated lumber (pre-2003) — toxic, avoid"],
  [34, "Se", "Selenium", "nonmetal", 16, 4, "Trace nutrient; photocells, glass decolorizer.", "Brazil nuts, multivitamins, old photocells"],
  [35, "Br", "Bromine", "halogen", 17, 4, "Dense red liquid; flame retardants, old photo chemistry.", "Flame-retardant plastics, pool chemicals"],
  [36, "Kr", "Krypton", "noble", 18, 4, "Inert gas for specialty bulbs and flashes.", "Specialty bulbs; not practical"],
  [37, "Rb", "Rubidium", "alkali", 1, 5, "Very reactive metal; atomic clocks, research.", "Not practical — lab sources only"],
  [38, "Sr", "Strontium", "alkaline", 2, 5, "Red fireworks color; flares, ceramics.", "Emergency road flares, fireworks"],
  [39, "Y", "Yttrium", "transition", 3, 5, "CRT phosphors, superconductors, YAG lasers.", "Old CRT displays, laser parts"],
  [40, "Zr", "Zirconium", "transition", 4, 5, "Extremely corrosion-proof; nuclear cladding, cubic zirconia.", "Zirconia ceramics/gems, nuclear scrap"],
  [41, "Nb", "Niobium", "transition", 5, 5, "Superconducting magnet and pipeline steel alloy.", "MRI magnet scrap"],
  [42, "Mo", "Molybdenum", "transition", 6, 5, "High-temp steel hardener; lubricant (MoS2).", "Tool steel, MoS2 grease"],
  [43, "Tc", "Technetium", "transition", 7, 5, "First synthetic element; medical imaging isotope.", "Not obtainable — nuclear medicine only"],
  [44, "Ru", "Ruthenium", "transition", 8, 5, "Hard platinum-group metal; electrical contacts.", "Electronics contacts"],
  [45, "Rh", "Rhodium", "transition", 9, 5, "Rarest precious metal; catalytic converters.", "Catalytic converters"],
  [46, "Pd", "Palladium", "transition", 10, 5, "Catalytic converters, hydrogen purification, jewelry.", "Catalytic converters, electronics, dental scrap"],
  [47, "Ag", "Silver", "transition", 11, 5, "Best conductor; antibacterial, photography, currency.", "Coins, jewelry, electronics, mirrors, photo film"],
  [48, "Cd", "Cadmium", "post-transition", 12, 5, "Toxic metal; NiCd batteries, yellow pigment.", "NiCd batteries — toxic, handle carefully"],
  [49, "In", "Indium", "post-transition", 13, 5, "Soft metal; touchscreen ITO coatings, solder.", "LCD screens (ITO), low-melt solder"],
  [50, "Sn", "Tin", "post-transition", 14, 5, "Solder, tin cans plating, bronze.", "Solder, tin-plated cans, bronze scrap"],
  [51, "Sb", "Antimony", "metalloid", 15, 5, "Lead hardener; flame retardants, pewter.", "Battery lead alloys, pewter, flame-retardant goods"],
  [52, "Te", "Tellurium", "metalloid", 16, 5, "Rare metalloid; solar cells, thermoelectrics.", "Solar panels (CdTe), thermoelectric modules"],
  [53, "I", "Iodine", "halogen", 17, 5, "Disinfectant; thyroid medicine, water purification.", "Povidone-iodine, tinctures, water-purification tablets"],
  [54, "Xe", "Xenon", "noble", 18, 5, "Heavy inert gas; arc lamps, ion thrusters, anesthesia.", "HID headlamps, projector bulbs"],
  [55, "Cs", "Caesium", "alkali", 1, 6, "Most reactive common metal; atomic clocks define the second.", "Not practical — lab sources"],
  [56, "Ba", "Barium", "alkaline", 2, 6, "Dense metal compounds; medical imaging contrast, fireworks green.", "Barium contrast kits (medical), fireworks"],
  [57, "La", "Lanthanum", "lanthanide", 3, 6, "First lanthanide; camera optics, battery alloys.", "Camera lenses, NiMH batteries"],
  [58, "Ce", "Cerium", "lanthanide", 3, 8, "Most abundant rare earth; flints, polishing, self-cleaning ovens.", "Lighter flints (ferrocerium), polishing compound"],
  [59, "Pr", "Praseodymium", "lanthanide", 4, 8, "Magnet and glass-coloring rare earth.", "Strong magnets (with Nd)"],
  [60, "Nd", "Neodymium", "lanthanide", 5, 8, "Strongest permanent magnets; speakers, motors, generators.", "Hard drives, speakers, headphones, motors"],
  [61, "Pm", "Promethium", "lanthanide", 6, 8, "Radioactive synthetic rare earth.", "Not obtainable — no natural supply"],
  [62, "Sm", "Samarium", "lanthanide", 7, 8, "Heat-stable magnets for motors and headphones.", "SmCo magnets in old drives/motors"],
  [63, "Eu", "Europium", "lanthanide", 8, 8, "Red phosphor in screens and Euro banknote ink.", "CRT/LCD phosphors"],
  [64, "Gd", "Gadolinium", "lanthanide", 9, 8, "MRI contrast agent; magnetic refrigeration.", "Medical imaging supplies"],
  [65, "Tb", "Terbium", "lanthanide", 10, 8, "Green phosphor in screens and lamps.", "Fluorescent lamps, screens"],
  [66, "Dy", "Dysprosium", "lanthanide", 11, 8, "Magnet heat-resistance additive, control rods.", "High-temp Nd magnets"],
  [67, "Ho", "Holmium", "lanthanide", 12, 8, "Strongest magnetic moment; lasers, pole pieces.", "Laser/medical equipment"],
  [68, "Er", "Erbium", "lanthanide", 13, 8, "Fiber-optic amplifier dopant; pink glass.", "Fiber-optic hardware"],
  [69, "Tm", "Thulium", "lanthanide", 14, 8, "Rarest stable lanthanide; portable X-ray sources.", "Not practical"],
  [70, "Yb", "Ytterbium", "lanthanide", 15, 8, "Doping for fiber lasers; atomic clocks.", "Fiber laser parts"],
  [71, "Lu", "Lutetium", "lanthanide", 16, 8, "Dense rare earth; PET-scan detectors.", "Medical scanner crystals"],
  [72, "Hf", "Hafnium", "transition", 4, 6, "Neutron absorber; control rods, high-k chip insulator.", "Nuclear control rods, CPU dies"],
  [73, "Ta", "Tantalum", "transition", 5, 6, "Corrosion-proof dense metal; phone capacitors, implants.", "Capacitors in electronics"],
  [74, "W", "Tungsten", "transition", 6, 6, "Highest melting point; bulb filaments, drill bits, armor.", "Incandescent filaments, carbide tooling, darts"],
  [75, "Re", "Rhenium", "transition", 7, 6, "Very rare; jet turbine superalloys.", "Not practical"],
  [76, "Os", "Osmium", "transition", 8, 6, "Densest element; fountain pen tips, record needles.", "Pen nibs, phonograph needles"],
  [77, "Ir", "Iridium", "transition", 9, 6, "Most corrosion-proof; spark plugs, crucibles.", "Spark plugs"],
  [78, "Pt", "Platinum", "transition", 10, 6, "Catalyst metal; catalytic converters, jewelry, labware.", "Catalytic converters, jewelry"],
  [79, "Au", "Gold", "transition", 11, 6, "Untarnishing conductor; currency, connectors, dentistry.", "Jewelry, electronics pins/connectors"],
  [80, "Hg", "Mercury", "transition", 12, 6, "Liquid metal; old thermometers, switches — toxic vapor.", "Thermostats, fluorescent tubes — toxic, handle carefully"],
  [81, "Tl", "Thallium", "post-transition", 13, 6, "Notorious poison; old rat poison and optics.", "Avoid — extremely toxic"],
  [82, "Pb", "Lead", "post-transition", 14, 6, "Dense soft metal; batteries, radiation shielding, solder.", "Car batteries, wheel weights, old pipes/paint"],
  [83, "Bi", "Bismuth", "post-transition", 15, 6, "Safe heavy metal; Pepto-Bismol, low-melt alloys.", "Stomach remedies, fishing weights"],
  [84, "Po", "Polonium", "post-transition", 16, 6, "Intensely radioactive rare element.", "Not obtainable — dangerously radioactive"],
  [85, "At", "Astatine", "halogen", 17, 6, "Rarest natural element; seconds-long half-lives.", "Not obtainable"],
  [86, "Rn", "Radon", "noble", 18, 6, "Radioactive gas seeping from soil; lung-cancer risk.", "Avoid — ventilate basements, radon test kits"],
  [87, "Fr", "Francium", "alkali", 1, 7, "Most unstable natural element; exists in micrograms.", "Not obtainable"],
  [88, "Ra", "Radium", "alkaline", 2, 7, "Radioactive glow-paint metal of the radium girls.", "Old luminous dials — dangerously radioactive"],
  [89, "Ac", "Actinium", "actinide", 3, 7, "Radioactive metal; neutron sources.", "Not obtainable"],
  [90, "Th", "Thorium", "actinide", 3, 9, "Slightly radioactive; lantern mantles, welding electrodes.", "Gas lantern mantles, TIG welding rods"],
  [91, "Pa", "Protactinium", "actinide", 4, 9, "Rare radioactive actinide.", "Not obtainable"],
  [92, "U", "Uranium", "actinide", 5, 9, "Nuclear fuel; dense metal, old green glass pigment.", "Uranium glass (Fiestaware), minerals — regulated/radioactive"],
  [93, "Np", "Neptunium", "actinide", 6, 9, "Synthetic transuranic; smoke-detector decay product.", "Not obtainable"],
  [94, "Pu", "Plutonium", "actinide", 7, 9, "Weapons/reactor fuel; RTG power sources.", "Not obtainable — strictly controlled"],
  [95, "Am", "Americium", "actinide", 8, 9, "Trace in smoke detectors as ionization source.", "Smoke detectors (micrograms)"],
  [96, "Cm", "Curium", "actinide", 9, 9, "Synthetic; space-probe alpha sources.", "Not obtainable"],
  [97, "Bk", "Berkelium", "actinide", 10, 9, "Synthetic, made atom by atom.", "Not obtainable"],
  [98, "Cf", "Californium", "actinide", 11, 9, "Intense neutron source; reactor starts, ore scanners.", "Not obtainable"],
  [99, "Es", "Einsteinium", "actinide", 12, 9, "Synthetic; made in labs by microgram.", "Not obtainable"],
  [100, "Fm", "Fermium", "actinide", 13, 9, "Synthetic; exists in atoms only.", "Not obtainable"],
  [101, "Md", "Mendelevium", "actinide", 14, 9, "Synthetic; named for Mendeleev.", "Not obtainable"],
  [102, "No", "Nobelium", "actinide", 15, 9, "Synthetic.", "Not obtainable"],
  [103, "Lr", "Lawrencium", "actinide", 16, 9, "Synthetic.", "Not obtainable"],
  [104, "Rf", "Rutherfordium", "transition", 4, 7, "Synthetic superheavy.", "Not obtainable"],
  [105, "Db", "Dubnium", "transition", 5, 7, "Synthetic superheavy.", "Not obtainable"],
  [106, "Sg", "Seaborgium", "transition", 6, 7, "Synthetic superheavy.", "Not obtainable"],
  [107, "Bh", "Bohrium", "transition", 7, 7, "Synthetic superheavy.", "Not obtainable"],
  [108, "Hs", "Hassium", "transition", 8, 7, "Synthetic superheavy.", "Not obtainable"],
  [109, "Mt", "Meitnerium", "transition", 9, 7, "Synthetic superheavy.", "Not obtainable"],
  [110, "Ds", "Darmstadtium", "transition", 10, 7, "Synthetic superheavy.", "Not obtainable"],
  [111, "Rg", "Roentgenium", "transition", 11, 7, "Synthetic superheavy.", "Not obtainable"],
  [112, "Cn", "Copernicium", "transition", 12, 7, "Synthetic superheavy.", "Not obtainable"],
  [113, "Nh", "Nihonium", "post-transition", 13, 7, "Synthetic superheavy.", "Not obtainable"],
  [114, "Fl", "Flerovium", "post-transition", 14, 7, "Synthetic superheavy.", "Not obtainable"],
  [115, "Mc", "Moscovium", "post-transition", 15, 7, "Synthetic superheavy.", "Not obtainable"],
  [116, "Lv", "Livermorium", "post-transition", 16, 7, "Synthetic superheavy.", "Not obtainable"],
  [117, "Ts", "Tennessine", "halogen", 17, 7, "Synthetic superheavy.", "Not obtainable"],
  [118, "Og", "Oganesson", "noble", 18, 7, "Heaviest known element; synthetic.", "Not obtainable"],
];

export const ELEMENTS: PeriodicElement[] = ROWS.map(
  ([z, symbol, name, category, x, y, info, sources]) => ({ z, symbol, name, category, x, y, info, sources }),
);
