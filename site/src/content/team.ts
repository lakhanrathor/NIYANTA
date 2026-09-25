/**
 * ─────────────────────────────────────────────────────────────
 *  TEAM — edit this file to add your members.
 * ─────────────────────────────────────────────────────────────
 *  Photos: drop images into  site/public/team/  and set
 *  `photo: '/team/your-file.jpg'`. Portrait (4:5) crops look best.
 *  Leave `photo` empty to show a monogram placeholder.
 *  Any link can be left empty and its icon will be hidden.
 */

export type Member = {
  name: string
  role: string
  bio: string
  expertise: string[]
  photo?: string
  lead?: boolean
  links?: { linkedin?: string; github?: string; email?: string; portfolio?: string }
}

export const teamMeta = {
  teamName: 'NIYANTA',
  teamId: '', // e.g. 'SIH-XXXXX' — leave empty to hide
  motto: 'Engineers, data scientists and researchers with one goal: give the people downstream more time.',
}

// PLACEHOLDER CONTENT — replace names, photos and bios with the real ones.
export const team: Member[] = [
  {
    name: 'Member One',
    role: 'Team Lead · Hydrodynamic Modelling',
    bio: 'The driving force behind NIYANTA. Designed the end-to-end architecture, built the Froehlich breach model and the DualSPHysics → ANUGA solver pipeline, and personally tracked down the depth bug that made our Tehri peak flow match the published study. Keeps six people moving in one direction.',
    expertise: ['Hydrodynamics', 'DualSPHysics', 'ANUGA / Delft3D', 'Python', 'System design', 'Leadership'],
    photo: '/team/member-1.jpg',
    lead: true,
    links: { linkedin: '', github: '', email: '' },
  },
  {
    name: 'Member Two',
    role: 'Remote Sensing & GIS',
    bio: 'Our eyes in the sky. Built the Google Earth Engine pipeline that pulls Sentinel-1 SAR, Sentinel-2 and Copernicus DEM data, and produced the before/after analysis for the Nepal and Rishiganga case studies. Turns raw pixels into maps anyone can read.',
    expertise: ['Google Earth Engine', 'Sentinel-1/2', 'QGIS', 'DEM processing', 'GDAL', 'Cartography'],
    photo: '/team/member-2.jpg',
    links: { linkedin: '', github: '', email: '' },
  },
  {
    name: 'Member Three',
    role: 'AI / Machine Learning',
    bio: 'The brain behind the AI. Trained the glacier segmentation and change-detection models that reached 85% accuracy on the Nepal case, and built the 2003–2021 multispectral glacial-calving analysis. Brilliant at getting models to work on messy, real-world data.',
    expertise: ['PyTorch', 'Computer vision', 'U-Net segmentation', 'Change detection', 'scikit-learn', 'Data pipelines'],
    photo: '/team/member-3.jpg',
    links: { linkedin: '', github: '', email: '' },
  },
  {
    name: 'Member Four',
    role: 'Full-stack Engineering',
    bio: 'The builder who made it all usable. Created the NIYANTA dashboard, the backend APIs and the automated report module with one-click PDF, CSV and GIS export. Writes clean, fast code and ships features overnight.',
    expertise: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL / PostGIS', 'REST APIs', 'Docker'],
    photo: '/team/member-4.jpg',
    links: { linkedin: '', github: '', email: '' },
  },
  {
    name: 'Member Five',
    role: '3D Visualisation & Simulation',
    bio: 'The artist of the team. Turned solver output into 3D terrain, flood-wave animations and the simulation renders you see on this site. Has a rare knack for making complex physics look simple and beautiful.',
    expertise: ['Three.js / WebGL', 'Blender', 'ParaView', 'CesiumJS', 'Shaders', 'Motion design'],
    photo: '/team/member-5.jpg',
    links: { linkedin: '', github: '', email: '' },
  },
  {
    name: 'Member Six',
    role: 'Research & Validation',
    bio: 'Our conscience and our fact-checker. Led the literature review, collected the case studies from Machhu II to Kakhovka, and cross-checked every number on this site against its source. The reason judges can trust our results.',
    expertise: ['Literature review', 'Hydrology', 'Validation', 'Impact analysis', 'Technical writing', 'Presentation'],
    photo: '/team/member-6.jpg',
    links: { linkedin: '', github: '', email: '' },
  },
]
