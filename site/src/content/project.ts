// All figures and sources below come from the Team NIYANTA SIH 2026 deck.

export const problem = {
  id: 'SIH26161',
  title: 'Dam Break Inundation Modelling using Hydrodynamic Modelling of any River',
  theme: 'Disaster Management',
  category: 'Software',
}

export const impactStats = [
  { value: 97.5, decimals: 1, suffix: ' M', label: 'People exposed to extreme floods every year', source: 'CEEW (2020)', href: 'https://www.ceew.in/sites/default/files/CEEW-Preparing-India-for-extreme-climate-events_10Dec20.pdf' },
  { value: 6138, decimals: 0, suffix: '', label: 'Large dams in India, 1,289 of them over 50 years old', source: 'NRLD 2023', href: 'https://www.business-standard.com/pti-stories/national/1-065-large-dams-50-100-years-old-224-are-over-a-century-old-govt-124121600799_1.html' },
  { value: 40, decimals: 0, suffix: ' M ha', label: 'Flood-prone land, one-eighth of India', source: 'RBA via PIB', href: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1807793' },
  { value: 25805, decimals: 0, prefix: '₹', suffix: ' cr', label: 'Average flood damage every year (2011–21)', source: 'CWC via FACTLY', href: 'https://factly.in/data-average-annual-economic-impact-due-to-floods-is-more-than-rs-25000-crores-after-the-year-2010/' },
  { value: 15, decimals: 0, suffix: ' M', label: 'People exposed to glacial-lake floods. India is in the top 4', source: 'Taylor et al., Nat. Commun. 2023', href: 'https://doi.org/10.1038/s41467-023-36033-x' },
  { value: 75, decimals: 0, suffix: '%', label: 'Of districts are climate hotspots', source: 'CEEW (2020)', href: 'https://www.ceew.in/press-releases/75-districts-and-half-india%E2%80%99s-population-vulnerable-extreme-climate-events-ceew-study' },
]

export type Scenario = {
  n: string
  title: string
  short: string
  chain: string[]
  cases: { name: string; image: string; href: string }[]
  inputs: string[]
  compute: string[]
  outputs: string[]
}

export const scenarios: Scenario[] = [
  {
    n: '01',
    title: 'Dam Criticality',
    short: 'An ageing or overloaded dam fails under its own reservoir.',
    chain: ['High inflow', 'Storage increase', 'Overtopping', 'Failed dam', 'Flood consequences'],
    cases: [
      { name: 'Machhu Dam II, Gujarat (1979)', image: '/media/flood-map.webp', href: 'https://damfailures.org/case-study/machhu-dam-ii-gujarat-india-1979' },
      { name: 'Tiware Dam, Maharashtra (2019)', image: '/media/tiware-breach.webp', href: 'https://www.hindustantimes.com/india-news/2-killed-many-missing-after-dam-breach-in-maharashtra-s-ratnagiri/story-oGmqOAP7JZ1B4yTEjUw5LK.html' },
    ],
    inputs: ['Google Earth Engine', 'Copernicus Sentinel', 'Dam / reservoir data', 'DEM (Cartosat / SRTM / GLO-30)', 'Historical records'],
    compute: ['Reservoir condition analysis', 'Breach risk estimation'],
    outputs: ['Breach / overflow risk', 'Flood extent map', 'Depth & velocity', 'Arrival time', 'Affected population & infrastructure'],
  },
  {
    n: '02',
    title: 'Natural Extreme Event',
    short: 'A glacier, landslide or cloudburst sends a sudden wave down the valley.',
    chain: ['Weather change', 'Glacier / ice-rock change', 'Natural blockage', 'Sudden release', 'Flash flood'],
    cases: [
      { name: 'Rishiganga, Uttarakhand (2021)', image: '/media/rishi-after.webp', href: 'https://www.researchgate.net/publication/382327177_A_Geospatial_Investigation_of_the_Rishiganga_Disaster_in_Uttarakhand_India' },
      { name: 'Nepal flash flood, Sentinel-2', image: '/media/nepal-after.webp', href: 'https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2/Nepal_flash_flood_imaged_by_satellites' },
    ],
    inputs: ['Google Earth Engine', 'Copernicus Sentinel-1/2', 'Open-Meteo', 'Glacier / terrain (Sentinel-2)', 'DEM (GLO-30 / SRTM)'],
    compute: ['Change detection', 'Event risk assessment'],
    outputs: ['Change map (glacier / terrain)', 'Risk indication', 'Possible event scenario', 'Flood extent map', 'Depth & arrival time'],
  },
  {
    n: '03',
    title: 'Human / Wartime Trigger',
    short: 'A dam is deliberately attacked and the river becomes a weapon.',
    chain: ['Deliberate attack', 'Sudden release', 'Dam breach', 'Flood wave', 'Downstream flooding'],
    cases: [
      { name: 'Kakhovka Dam, Ukraine (2023)', image: '/media/kakhovka-flood.webp', href: 'https://en.wikipedia.org/wiki/Destruction_of_the_Kakhovka_Dam' },
      { name: 'The Dnieper river was the frontline', image: '/media/kherson-frontline.webp', href: 'https://en.wikipedia.org/wiki/Destruction_of_the_Kakhovka_Dam' },
    ],
    inputs: ['Google Earth Engine', 'Copernicus Sentinel', 'Satellite imagery (pre / current)', 'DEM (SRTM / ALOS)', 'Population & critical infrastructure'],
    compute: ['Breach scenario', 'Scenario generation', 'Hydrodynamic simulation', 'Impact assessment'],
    outputs: ['Inundation probability map', 'Flood extent map', 'Depth & velocity', 'Arrival time', 'Affected population & infrastructure'],
  },
]

export const validationCases = [
  { name: 'Rishiganga, Uttarakhand (2021)', result: 'Model output matched with real-world incident data', accuracy: '80–90%', image: '/media/rishi-after.webp' },
  { name: 'Nepal flash flood, Sentinel-2 (ESA)', result: 'Matched against real-world results. AI model: 85% accuracy', accuracy: '80%', image: '/media/nepal-after.webp' },
  { name: 'Kakhovka Dam, Ukraine (2023)', result: 'Regional impact analysis and incident verification', accuracy: 'Verified', image: '/media/kakhovka-flood.webp' },
]

export const breachCheck = [
  { model: 'NIYANTA (fixed)', method: 'Froehlich (2008) + Fread (1988)', q: 659056, ours: true },
  { model: 'Maddamsetty et al. (2010)', method: 'NWS-BREACH physical erosion', q: 980324 },
  { model: 'Froehlich (1995)', method: 'Peak-outflow regression', q: 390000, approx: true },
]

export const roadmap = [
  { title: 'Literature study', sub: 'Tehri, SPH, GLOFs', status: 'done' },
  { title: 'Multispectral analysis', sub: '2003–2021', status: 'done' },
  { title: 'SPH benchmark', sub: 'PASS', status: 'done' },
  { title: 'Delft3D / ANUGA run', sub: 'Validation', status: 'done' },
  { title: 'MVP dashboard', sub: 'Working', status: 'done' },
  { title: 'Finalizing the software', sub: 'In progress', status: 'active' },
  { title: 'Deploy & host', sub: 'Offline', status: 'next' },
] as const

export type Reference = { authors: string; year: string; title: string; venue: string; href: string; tag: string }

export const references: Reference[] = [
  { authors: 'Madamsetty, R., Praveen, T.V., Surya Rao, S., & Manjula Vani, K.', year: '2010', title: 'Tehri Dam-Breach Versus Monsoon Flood Routing in the Ganga River System', venue: 'ISH Journal of Hydraulic Engineering, 16(1), 109–131', href: 'https://doi.org/10.1080/09715010.2010.10514992', tag: 'Dam break' },
  { authors: 'Crespo, A.J.C., Domínguez, J.M., Rogers, B.D., et al.', year: '2015', title: 'DualSPHysics: Open-source parallel CFD solver based on Smoothed Particle Hydrodynamics (SPH)', venue: 'Computer Physics Communications, 187, 204–216', href: 'https://doi.org/10.1016/j.cpc.2014.10.004', tag: 'Solver' },
  { authors: 'Froehlich, D.C.', year: '2008', title: 'Embankment Dam Breach Parameters and Their Uncertainties', venue: 'Journal of Hydraulic Engineering, ASCE, 134(12), 1708–1721', href: 'https://doi.org/10.1061/(ASCE)0733-9429(2008)134:12(1708)', tag: 'Dam break' },
  { authors: 'Kernkamp, H.W.J., van Dam, A., Stelling, G.S., & de Goede, E.D.', year: '2011', title: 'Efficient scheme for the shallow water equations on unstructured grids (Delft3D Flexible Mesh)', venue: 'Ocean Dynamics, 61, 1175–1188', href: 'https://doi.org/10.1007/s10236-011-0423-6', tag: 'Solver' },
  { authors: 'Roberts, S., Nielsen, O., Gray, D., & Sexton, J.', year: '—', title: 'ANUGA User Manual', venue: 'Geoscience Australia & ANU', href: 'https://github.com/GeoscienceAustralia/anuga_core', tag: 'Solver' },
  { authors: 'ResearchGate', year: '2024', title: 'A Geospatial Investigation of the Rishiganga Disaster in Uttarakhand, India', venue: 'ResearchGate', href: 'https://www.researchgate.net/publication/382327177_A_Geospatial_Investigation_of_the_Rishiganga_Disaster_in_Uttarakhand_India', tag: 'Case study' },
]

