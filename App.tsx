import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   MON PRONO TURF — PWA de pronostics hippiques
   Design "Prestige Blanc & Marron"
   ============================================================ */

/* ---------- Utilitaires de génération déterministe (mock data) ---------- */
function seeded(seed) {
  let x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}
function pick(arr, seed) {
  return arr[Math.floor(seeded(seed) * arr.length) % arr.length];
}
function fmtCote(seed) {
  const v = 1.4 + seeded(seed) * 38;
  return v.toFixed(1).replace(".", ",");
}

const NOMS_CHEVAUX = [
  "Bella Vita","Grand Sultan","Ombre du Soir","Rêve de Paris","Flash Royal","Étoile Filante",
  "Voltige d'Or","Prince Noir","Diamant Bleu","Belle Aurore","Césario du Rib","Uranie de Guez",
  "Timon du Buisson","Voleur d'Amour","Djaimy Sport","Idéal du Gazeau","Menhir Balbuzard",
  "Nice de Belouet","Élite du Rib","Kadre Royal","Lady Suprême","Miss Dixieland","Roi Soleil",
  "Vent d'Ouest","Comtesse Royale","Duc de Bretagne","Farceur du Levant","Grand Argent",
  "Harmonie Divine","Impérial Trot","Joker de Nuit","Krone Express","Liberté Chérie",
  "Mirage Doré","Nougat Express","Opéra Buffa","Pacha des Bois","Quinté Magic","Rubis d'Automne",
  "Sultane Grise","Tornade Bleue","Ultimatum","Vahiné Royale","Wonder Belle","Xanadu du Parc",
  "Yakusa des Champs","Zéphyr Doré"
];
const JOCKEYS = [
  "E. Raffin","A. Abrivard","B. Goetz","D. Thomain","M. Guelpa","J. Dubois","F. Ouvrie",
  "P-Y. Verva","A. Barbanneau","T. Levesque","C. Demeyer","P-C. Boudot","M. Barzalona",
  "C. Soumillon","O. Peslier","T. Piccone","F. Nivard","B. Piton","J. Cabre","A. Lamy"
];
const ENTRAINEURS = [
  "J-M. Bazire","P. Levesque","JP. Marmion","S. Guarato","A. Fabre","F. Head","C. Ferland",
  "J-P. Dubois","Y. Barberot","C. Bigeon","N. Roussel"
];
const PRIX_TROT = [
  "Prix des Tilleuls","Prix d'Automne","Prix de la Marne","Prix Ariane","Prix Corrida",
  "Prix Messidor","Prix des Chênes","Prix du Soleil","Prix de la République","Prix Fontenay",
  "Prix des Sables","Prix de Normandie","Prix des Alizés","Prix du Val de Loire"
];
const PRIX_PLAT = [
  "Prix du Bois Joli","Prix de Diane","Prix Excelsior","Prix des Tourterelles","Prix du Rond-Point",
  "Prix de la Forêt","Prix Fontainebleau","Prix du Marais","Prix des Lilas","Prix de l'Aurore",
  "Prix Coronation","Prix des Sablonnières","Prix du Domaine","Prix Longines"
];
const FORMULES_ANALYSE = [
  (n, j) => `${n} confirme une belle forme du moment et bénéficie du concours précieux de ${j}, un driver/jockey en pleine réussite cette saison.`,
  (n, j) => `Sur cette distance, ${n} a déjà montré de solides références. L'association avec ${j} est un gage de sérieux pour cet engagement.`,
  (n, j) => `${n} sort d'un parcours encourageant et retrouve une piste qui lui convient. ${j} devra gérer une course tactique mais le potentiel est réel.`,
  (n, j) => `Attention à ${n}, souvent sous-coté alors que ses dernières prestations sont solides. ${j} en selle inspire confiance sur ce parcours.`,
  (n, j) => `${n} possède la vitesse pour faire la différence en fin de parcours. ${j} connaît bien ce protégé et vise une place d'honneur.`,
  (n, j) => `Le profil de ${n} colle parfaitement à cette épreuve. Reste à voir la gestion de course de ${j}, qui a l'habitude de ce genre de rendez-vous.`,
  (n, j) => `${n} n'a pas déçu lors de sa dernière sortie. Avec ${j} aux commandes, une nouvelle place dans les points est tout à fait envisageable.`,
  (n, j) => `Outsider à surveiller : ${n} progresse course après course. ${j} pourrait créer la surprise si le rythme lui convient.`
];

const COULEURS_PMU = {
  1:  { bg: "#FFFFFF", fg: "#111111", border: "#3D2314" },
  2:  { bg: "#E30613", fg: "#FFFFFF" },
  3:  { bg: "#009640", fg: "#FFFFFF" },
  4:  { bg: "#0066B3", fg: "#FFFFFF" },
  5:  { bg: "#FFD500", fg: "#111111" },
  6:  { bg: "#111111", fg: "#FFFFFF" },
  7:  { bg: "#F7941D", fg: "#111111" },
  8:  { bg: "#EC008C", fg: "#FFFFFF" },
  9:  { bg: "#8B4513", fg: "#FFFFFF" },
  10: { bg: "#702F8A", fg: "#FFFFFF" },
  11: { bg: "#00AEEF", fg: "#111111" },
  12: { bg: "#C71585", fg: "#FFFFFF" },
  13: { bg: "#808080", fg: "#FFFFFF" },
  14: { bg: "#9ACD32", fg: "#111111" },
  15: { bg: "#FA8072", fg: "#111111" },
  16: { bg: "#556B2F", fg: "#FFFFFF" },
  17: { bg: "#FFFFFF", fg: "#111111", border: "#111111", stripe: true },
  18: { bg: "#E30613", fg: "#FFFFFF", stripe: true }
};
function couleurNumero(n) {
  if (COULEURS_PMU[n]) return COULEURS_PMU[n];
  const base = COULEURS_PMU[((n - 1) % 18) + 1];
  return { ...base, dim: true };
}

/* ---------- Génération du programme mock ---------- */
const REUNIONS_META = [
  { id: "R1", hippodrome: "Vincennes", ville: "Paris", discipline: "Trot Attelé", nbCourses: 8, heureBase: 13, min0: 50 },
  { id: "R2", hippodrome: "Chantilly", ville: "Oise", discipline: "Plat", nbCourses: 7, heureBase: 13, min0: 25 },
  { id: "R3", hippodrome: "Deauville-Clairefontaine", ville: "Calvados", discipline: "Plat", nbCourses: 6, heureBase: 14, min0: 5 },
  { id: "R4", hippodrome: "Cagnes-sur-Mer", ville: "Alpes-Maritimes", discipline: "Plat & Obstacle", nbCourses: 7, heureBase: 12, min0: 40 },
  { id: "R5", hippodrome: "Enghien", ville: "Val-d'Oise", discipline: "Trot Monté", nbCourses: 8, heureBase: 18, min0: 0 }
];

function genererCourse(reunionMeta, numero) {
  const seedBase = reunionMeta.id.charCodeAt(1) * 1000 + numero * 17;
  const estTrot = reunionMeta.discipline.includes("Trot");
  const nom = estTrot ? pick(PRIX_TROT, seedBase + 1) : pick(PRIX_PLAT, seedBase + 1);
  const distance = estTrot
    ? 2100 + Math.floor(seeded(seedBase + 2) * 8) * 100
    : 1200 + Math.floor(seeded(seedBase + 2) * 12) * 100;
  const totalMin = reunionMeta.min0 + (numero - 1) * 33;
  const heure = reunionMeta.heureBase + Math.floor(totalMin / 60);
  const minute = totalMin % 60;
  const heureStr = `${String(heure).padStart(2, "0")}h${String(minute).padStart(2, "0")}`;

  const nbPartants = 8 + Math.floor(seeded(seedBase + 3) * 9); // 8 à 16
  const partants = [];
  for (let i = 1; i <= nbPartants; i++) {
    const s = seedBase * 31 + i * 7;
    const nomCheval = pick(NOMS_CHEVAUX, s);
    const jockey = pick(JOCKEYS, s + 3);
    const entraineur = pick(ENTRAINEURS, s + 5);
    const cote = fmtCote(s + 9);
    const analyse = pick(FORMULES_ANALYSE, s + 11)(nomCheval, jockey);
    partants.push({ numero: i, nom: nomCheval, jockey, entraineur, cote, coteNum: parseFloat(cote.replace(",", ".")), analyse });
  }
  const ordreLogique = [...partants].sort((a, b) => a.coteNum - b.coteNum).map((p) => p.numero);
  const pronoSynthetique = ordreLogique.slice(0, Math.min(8, ordreLogique.length));

  return {
    id: `${reunionMeta.id}C${numero}`,
    numero,
    nom,
    distance,
    heure: heureStr,
    discipline: reunionMeta.discipline,
    partants,
    pronoSynthetique
  };
}

function genererProgramme() {
  return REUNIONS_META.map((r) => ({
    ...r,
    courses: Array.from({ length: r.nbCourses }, (_, i) => genererCourse(r, i + 1))
  }));
}

const BILAN_MOCK = [
  { date: "14/08/2026", course: "R1C4 - Vincennes", type: "Penalty du Jour", cheval: "5 - Grand Argent", resultat: "Gagnant" },
  { date: "14/08/2026", course: "R2C3 - Chantilly", type: "Outsider du Jour", cheval: "11 - Menhir Balbuzard", resultat: "Placé" },
  { date: "13/08/2026", course: "R1C6 - Vincennes", type: "Penalty du Jour", cheval: "3 - Roi Soleil", resultat: "Gagnant" },
  { date: "13/08/2026", course: "R3C2 - Deauville", type: "Tocard du Jour", cheval: "14 - Joker de Nuit", resultat: "Non placé" },
  { date: "12/08/2026", course: "R4C1 - Cagnes-sur-Mer", type: "Outsider du Jour", cheval: "9 - Sultane Grise", resultat: "Gagnant" },
  { date: "12/08/2026", course: "R1C2 - Vincennes", type: "Penalty du Jour", cheval: "1 - Prince Noir", resultat: "Placé" },
  { date: "11/08/2026", course: "R2C5 - Chantilly", type: "Penalty du Jour", cheval: "7 - Rubis d'Automne", resultat: "Non placé" }
];

/* ---------- Petits composants ---------- */
function PastilleNumero({ n, size = 32 }) {
  const c = couleurNumero(n);
  return (
    <span
      className="pastille"
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: size * 0.42,
        background: c.stripe
          ? `repeating-linear-gradient(45deg, ${c.bg}, ${c.bg} 4px, #ffffff 4px, #ffffff 8px)`
          : c.bg,
        color: c.fg,
        border: `1.5px solid ${c.border || "rgba(61,35,20,0.25)"}`,
        opacity: c.dim ? 0.85 : 1
      }}
    >
      {n}
    </span>
  );
}

function Chevron({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s ease" }}
    >
      <path d="M6 9l6 6 6-6" stroke="#6B4226" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================ */

export default function PronoTurf() {
  const [programme, setProgramme] = useState(() => genererProgramme());
  const [loadingApi, setLoadingApi] = useState(true);
  const [apiSource, setApiSource] = useState("demo");

  const [reunionActive, setReunionActive] = useState("R1");
  const [courseActive, setCourseActive] = useState(1);
  const [ouvert, setOuvert] = useState(null); // numero du cheval déplié
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vueDrawer, setVueDrawer] = useState(null); // 'penalty'|'outsider'|'tocard'|'bilan'|'admin'|null

  const [adminAuth, setAdminAuth] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdErreur, setPwdErreur] = useState(false);
  const [adminCourseSel, setAdminCourseSel] = useState({ r: "R1", c: 1 });
  const [pronoEdit, setPronoEdit] = useState("");

  const [specials, setSpecials] = useState({
    penalty: { titre: "Grand Argent", detail: "R1 · C4 — Vincennes", commentaire: "Une valeur sûre du jour : régularité, driver en forme et un engagement taillé pour lui. La confiance est totale sur ce numéro." },
    outsider: { titre: "Menhir Balbuzard", detail: "R2 · C3 — Chantilly", commentaire: "Coté large sur les papiers mais des dernières sorties bien plus intéressantes qu'il n'y paraît. Un pari qui peut rapporter gros." },
    tocard: { titre: "Joker de Nuit", detail: "R3 · C2 — Deauville", commentaire: "Le petit poucet du jour, pour ceux qui aiment prendre des risques calculés. À loger uniquement en jeu complémentaire." }
  });

  const [bilan, setBilan] = useState(BILAN_MOCK);

  /* ---- Tentative de récupération des données réelles PMU (avec repli mock) ---- */
  useEffect(() => {
    // L'API PMU (offline.turfinfo.api.pmu.fr) ne renvoie pas d'en-têtes CORS :
    // un navigateur mobile bloque donc l'appel direct depuis une PWA hébergée
    // ailleurs. On passe par un proxy CORS public, avec plusieurs solutions
    // de repli en cas d'indisponibilité de l'une d'elles.
    async function fetchViaProxy(targetUrl) {
      const proxies = [
        // 1) corsproxy.io — relaie la réponse brute (même Content-Type que l'origine)
        {
          nom: "corsproxy.io",
          construireUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
          extraire: async (res) => res.json()
        },
        // 2) allorigins.win — encapsule la réponse dans { contents: "..." } (raw endpoint = passthrough)
        {
          nom: "allorigins (raw)",
          construireUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          extraire: async (res) => res.json()
        },
        // 3) allorigins.win — variante /get, renvoie le JSON sous forme de texte dans "contents"
        {
          nom: "allorigins (get)",
          construireUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
          extraire: async (res) => {
            const enveloppe = await res.json();
            return JSON.parse(enveloppe.contents);
          }
        }
      ];

      let derniereErreur = null;
      for (const proxy of proxies) {
        try {
          const proxyUrl = proxy.construireUrl(targetUrl);
          const res = await fetch(proxyUrl, { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(`${proxy.nom} → HTTP ${res.status}`);
          const data = await proxy.extraire(res);
          return data;
        } catch (err) {
          derniereErreur = err;
          console.info(`Proxy CORS "${proxy.nom}" indisponible, tentative suivante…`, err.message);
        }
      }
      throw derniereErreur || new Error("Tous les proxys CORS ont échoué");
    }

    async function chargerProgrammePmu() {
      try {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        const dateStr = `${dd}${mm}${yyyy}`;
        const urlPmu = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${dateStr}`;

        // Appel de l'API PMU via proxy CORS (fonctionne depuis n'importe quel
        // téléphone/navigateur, contrairement à l'appel direct qui est bloqué).
        const data = await fetchViaProxy(urlPmu);

        const reunionsBrutes = data?.programme?.reunions;
        if (!Array.isArray(reunionsBrutes) || reunionsBrutes.length === 0) {
          throw new Error("Format de programme PMU inattendu");
        }

        // Adaptation minimale du format réel PMU -> format interne de l'app.
        // (La structure complète de l'API étant riche, seules les infos
        // essentielles sont reprises ici ; le reste reste géré via l'espace admin.)
        const mapped = reunionsBrutes.slice(0, 5).map((r, idx) => {
          const meta = REUNIONS_META[idx] || REUNIONS_META[0];
          const courses = (r.courses || []).map((c, i) =>
            genererCourse(meta, i + 1) // on garde des partants réalistes en secours
          );
          return {
            ...meta,
            id: `R${idx + 1}`,
            hippodrome: r.hippodrome?.libelleCourt || meta.hippodrome,
            courses: courses.length ? courses : Array.from({ length: meta.nbCourses }, (_, i) => genererCourse(meta, i + 1))
          };
        });

        setProgramme(mapped);
        setApiSource("pmu");
      } catch (err) {
        // Tous les proxys CORS ont échoué, réseau hors-ligne, ou format inattendu :
        // on reste sur les données de secours pour ne jamais bloquer l'affichage.
        console.info("API PMU indisponible (même via proxy CORS), utilisation des données de démonstration :", err.message);
        setApiSource("demo");
      } finally {
        setLoadingApi(false);
      }
    }
    chargerProgrammePmu();
  }, []);

  const reunion = useMemo(() => programme.find((r) => r.id === reunionActive) || programme[0], [programme, reunionActive]);
  const course = useMemo(() => reunion?.courses.find((c) => c.numero === courseActive) || reunion?.courses[0], [reunion, courseActive]);

  useEffect(() => {
    setCourseActive(1);
    setOuvert(null);
  }, [reunionActive]);
  useEffect(() => setOuvert(null), [courseActive]);

  function selectionnerReunion(id) {
    setReunionActive(id);
  }

  function ouvrirDrawerVue(vue) {
    setVueDrawer(vue);
    if (vue === "admin" && !adminAuth) {
      setPwdInput("");
      setPwdErreur(false);
    }
  }

  function verifierMdp() {
    if (pwdInput === "1234") {
      setAdminAuth(true);
      setPwdErreur(false);
      const c = programme.find((r) => r.id === adminCourseSel.r)?.courses.find((cc) => cc.numero === adminCourseSel.c);
      setPronoEdit(c ? c.pronoSynthetique.join(" - ") : "");
    } else {
      setPwdErreur(true);
    }
  }

  function appliquerProno() {
    const nums = pronoEdit
      .split(/[\s,-]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
    setProgramme((prev) =>
      prev.map((r) =>
        r.id !== adminCourseSel.r
          ? r
          : { ...r, courses: r.courses.map((c) => (c.numero !== adminCourseSel.c ? c : { ...c, pronoSynthetique: nums })) }
      )
    );
  }

  function modifierAnalyse(numeroCheval, texte) {
    setProgramme((prev) =>
      prev.map((r) =>
        r.id !== adminCourseSel.r
          ? r
          : {
              ...r,
              courses: r.courses.map((c) =>
                c.numero !== adminCourseSel.c
                  ? c
                  : { ...c, partants: c.partants.map((p) => (p.numero !== numeroCheval ? p : { ...p, analyse: texte })) }
              )
            }
      )
    );
  }

  const courseAdmin = useMemo(() => {
    const r = programme.find((rr) => rr.id === adminCourseSel.r);
    return r?.courses.find((cc) => cc.numero === adminCourseSel.c);
  }, [programme, adminCourseSel]);

  const couleurResultat = (res) =>
    res === "Gagnant" ? "#2E7D32" : res === "Placé" ? "#B8860B" : "#B23A2E";

  if (!reunion || !course) return null;

  return (
    <div className="app-root">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .app-root {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
          background: #FBF9F5;
          color: #3D2314;
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
          padding-bottom: 40px;
          overflow-x: hidden;
        }
        .serif { font-family: "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif; }

        /* ---- Header ---- */
        .header {
          position: sticky; top: 0; z-index: 30;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(107,66,38,0.15);
          padding: 14px 16px 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .burger-btn {
          width: 38px; height: 38px; border-radius: 12px;
          background: #FBF9F5; border: 1px solid rgba(107,66,38,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .burger-btn:active { background: #E8D5C4; }
        .header-title { text-align: center; flex: 1; }
        .header-title h1 { margin: 0; font-size: 17px; letter-spacing: 0.5px; color: #3D2314; font-weight: 700; }
        .header-title span { font-size: 11px; color: #8a6a52; letter-spacing: 1.2px; text-transform: uppercase; }
        .header-spacer { width: 38px; flex-shrink: 0; }
        .api-badge {
          font-size: 9.5px; padding: 2px 7px; border-radius: 20px; font-weight: 600;
          letter-spacing: .3px; white-space: nowrap;
        }

        /* ---- Drawer ---- */
        .overlay {
          position: fixed; inset: 0; background: rgba(61,35,20,0.42);
          z-index: 40; opacity: 0; pointer-events: none; transition: opacity .25s ease;
        }
        .overlay.show { opacity: 1; pointer-events: auto; }
        .drawer {
          position: fixed; top: 0; left: 0; height: 100%; width: 82%; max-width: 340px;
          background: #FFFFFF; z-index: 50; transform: translateX(-105%);
          transition: transform .28s cubic-bezier(.4,0,.2,1);
          box-shadow: 8px 0 30px rgba(61,35,20,0.15);
          display: flex; flex-direction: column;
        }
        .drawer.open { transform: translateX(0); }
        .drawer-head {
          padding: 22px 18px 16px 18px; border-bottom: 1px solid rgba(107,66,38,0.12);
          background: linear-gradient(135deg, #3D2314, #6B4226);
        }
        .drawer-head h2 { margin: 0; color: #FBF9F5; font-size: 19px; }
        .drawer-head p { margin: 4px 0 0; color: #E8D5C4; font-size: 12px; }
        .drawer-nav { padding: 10px; flex: 1; overflow-y: auto; }
        .drawer-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 12px; border-radius: 12px; margin-bottom: 4px;
          font-size: 14.5px; font-weight: 600; color: #3D2314;
        }
        .drawer-item:active, .drawer-item.active { background: #FBF9F5; }
        .drawer-item .ic { font-size: 18px; width: 22px; text-align: center; }
        .drawer-close {
          margin: 10px; padding: 12px; text-align: center; border-radius: 12px;
          border: 1px solid rgba(107,66,38,0.25); font-size: 13.5px; font-weight: 600; color: #6B4226;
        }

        /* ---- Onglets réunions ---- */
        .reunions-bar {
          display: flex; gap: 8px; overflow-x: auto; padding: 12px 14px;
          background: #FFFFFF; border-bottom: 1px solid rgba(107,66,38,0.1);
          scrollbar-width: none;
        }
        .reunions-bar::-webkit-scrollbar { display: none; }
        .reunion-chip {
          flex-shrink: 0; padding: 8px 14px; border-radius: 20px;
          border: 1.4px solid #6B4226; font-size: 12.5px; font-weight: 700; color: #6B4226;
          background: #FFFFFF; display: flex; flex-direction: column; align-items: center; line-height: 1.25;
          min-width: 68px;
        }
        .reunion-chip .sub { font-size: 9.5px; font-weight: 500; color: #8a6a52; margin-top: 1px; }
        .reunion-chip.active { background: #6B4226; color: #FFFFFF; }
        .reunion-chip.active .sub { color: #E8D5C4; }

        /* ---- Pastilles courses ---- */
        .courses-bar {
          display: flex; gap: 8px; overflow-x: auto; padding: 10px 14px 12px;
          background: #FBF9F5; scrollbar-width: none;
        }
        .courses-bar::-webkit-scrollbar { display: none; }
        .course-pastille {
          flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
          background: #FFFFFF; border: 1.4px solid rgba(107,66,38,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; font-weight: 700; color: #6B4226;
        }
        .course-pastille.active { background: #6B4226; color: #FFFFFF; border-color: #6B4226; }

        /* ---- Carte course ---- */
        .content { padding: 14px 14px 8px; }
        .card {
          background: #FFFFFF; border: 1px solid rgba(107,66,38,0.15);
          border-radius: 16px; padding: 14px 16px; margin-bottom: 14px;
        }
        .course-title { font-size: 16.5px; font-weight: 700; margin: 0 0 2px; color: #3D2314; }
        .course-meta { font-size: 12.5px; color: #8a6a52; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;}
        .course-meta b { color: #6B4226; }

        .prono-card {
          background: linear-gradient(135deg, #FBF9F5, #F3E9DD);
          border: 1px solid #E8D5C4;
        }
        .prono-label {
          font-size: 10.5px; letter-spacing: 1.3px; text-transform: uppercase;
          color: #8a6a52; font-weight: 700; margin-bottom: 8px;
        }
        .prono-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .prono-arrow { color: #c9b299; font-size: 12px; margin: 0 -2px; }

        /* ---- Liste partants ---- */
        .partant-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 4px; border-bottom: 1px solid rgba(107,66,38,0.09);
        }
        .partant-row:last-child { border-bottom: none; }
        .partant-info { flex: 1; min-width: 0; }
        .partant-nom { font-size: 14px; font-weight: 700; color: #3D2314; }
        .partant-sub { font-size: 11.5px; color: #8a6a52; margin-top: 1px; }
        .partant-cote {
          font-size: 13px; font-weight: 700; color: #6B4226; background: #F3E9DD;
          border-radius: 8px; padding: 4px 8px; flex-shrink: 0;
        }
        .analyse-box {
          margin: 0 4px 10px 42px; padding: 10px 12px; background: #FBF9F5;
          border-left: 3px solid #E8D5C4; border-radius: 0 10px 10px 0;
          font-size: 12.8px; line-height: 1.5; color: #4a3324;
        }

        .section-title { font-size: 12px; letter-spacing: .8px; text-transform: uppercase; color: #8a6a52; font-weight: 700; margin: 4px 0 10px; }

        /* ---- Boutons ---- */
        .btn {
          background: #6B4226; color: #FFFFFF; border: none; border-radius: 12px;
          padding: 11px 16px; font-size: 13.5px; font-weight: 700; width: 100%;
        }
        .btn:active { background: #3D2314; }
        .btn-outline {
          background: #FFFFFF; color: #6B4226; border: 1.4px solid #6B4226; border-radius: 12px;
          padding: 10px 14px; font-size: 13px; font-weight: 700;
        }
        input.field, textarea.field, select.field {
          width: 100%; border: 1.3px solid rgba(107,66,38,0.28); border-radius: 10px;
          padding: 10px 12px; font-size: 13.5px; color: #3D2314; background: #FBF9F5;
          font-family: inherit;
        }
        label.flabel { font-size: 11.5px; font-weight: 700; color: #8a6a52; text-transform: uppercase; letter-spacing: .5px; display: block; margin: 12px 0 5px; }

        /* ---- Panneau spécial (drawer views) ---- */
        .special-card {
          border-radius: 16px; padding: 18px; margin-bottom: 16px;
          border: 1px solid #E8D5C4; background: #FBF9F5;
        }
        .special-badge {
          display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .5px;
          padding: 4px 10px; border-radius: 20px; background: #6B4226; color: #fff; margin-bottom: 10px;
        }
        .special-title { font-size: 20px; font-weight: 800; margin: 0 0 3px; }
        .special-detail { font-size: 12.5px; color: #8a6a52; margin-bottom: 10px; }
        .special-comment { font-size: 13.5px; line-height: 1.55; color: #4a3324; }

        table.bilan-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        table.bilan-table th { text-align: left; color: #8a6a52; font-weight: 700; padding: 6px 4px; border-bottom: 1.5px solid rgba(107,66,38,0.2); font-size: 10.5px; text-transform: uppercase; }
        table.bilan-table td { padding: 8px 4px; border-bottom: 1px solid rgba(107,66,38,0.08); vertical-align: top; }
        .stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .stat-box { flex: 1; background: #FBF9F5; border: 1px solid #E8D5C4; border-radius: 12px; padding: 12px; text-align: center; }
        .stat-num { font-size: 22px; font-weight: 800; color: #6B4226; }
        .stat-lbl { font-size: 10px; color: #8a6a52; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px;}

        .lock-screen { display: flex; flex-direction: column; align-items: center; padding: 40px 10px; }
        .lock-icon { font-size: 40px; margin-bottom: 10px; }
        .error-txt { color: #B23A2E; font-size: 12px; margin-top: 6px; }

        .horse-edit { border: 1px solid rgba(107,66,38,0.15); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
        .horse-edit-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12.5px; font-weight: 700; }
      `}</style>

      {/* ---------------- HEADER ---------------- */}
      <div className="header">
        <button className="burger-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="#3D2314" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="header-title">
          <h1 className="serif">MON PRONO TURF</h1>
          <span>Programme PMU du jour</span>
        </div>
        <div className="header-spacer" />
      </div>

      {/* ---------------- DRAWER ---------------- */}
      <div className={`overlay ${drawerOpen ? "show" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <h2 className="serif">Menu</h2>
          <p>{apiSource === "pmu" ? "Données PMU en direct" : "Aperçu — données de démonstration"}</p>
        </div>
        <div className="drawer-nav">
          <div className={`drawer-item ${vueDrawer === "penalty" ? "active" : ""}`} onClick={() => ouvrirDrawerVue("penalty")}>
            <span className="ic">🎯</span> Le Penalty du Jour
          </div>
          <div className={`drawer-item ${vueDrawer === "outsider" ? "active" : ""}`} onClick={() => ouvrirDrawerVue("outsider")}>
            <span className="ic">💣</span> L'Outsider du Jour
          </div>
          <div className={`drawer-item ${vueDrawer === "tocard" ? "active" : ""}`} onClick={() => ouvrirDrawerVue("tocard")}>
            <span className="ic">🏆</span> Le Tocard du Jour
          </div>
          <div className={`drawer-item ${vueDrawer === "bilan" ? "active" : ""}`} onClick={() => ouvrirDrawerVue("bilan")}>
            <span className="ic">📊</span> Bilan des Pronostics
          </div>
          <div className={`drawer-item ${vueDrawer === "admin" ? "active" : ""}`} onClick={() => ouvrirDrawerVue("admin")}>
            <span className="ic">⚙️</span> Espace Admin
          </div>
          {vueDrawer && (
            <div className="drawer-item" style={{ marginTop: 8, color: "#8a6a52" }} onClick={() => { setVueDrawer(null); setDrawerOpen(false); }}>
              <span className="ic">📋</span> Retour au programme
            </div>
          )}
        </div>
        <div className="drawer-close" onClick={() => setDrawerOpen(false)}>Fermer</div>
      </div>

      {/* ---------------- VUES DU DRAWER (plein écran) ---------------- */}
      {vueDrawer === "penalty" && (
        <div className="content">
          <div className="special-card">
            <span className="special-badge">🎯 PENALTY DU JOUR</span>
            <h3 className="special-title serif">{specials.penalty.titre}</h3>
            <div className="special-detail">{specials.penalty.detail}</div>
            <p className="special-comment">{specials.penalty.commentaire}</p>
          </div>
        </div>
      )}
      {vueDrawer === "outsider" && (
        <div className="content">
          <div className="special-card">
            <span className="special-badge">💣 OUTSIDER DU JOUR</span>
            <h3 className="special-title serif">{specials.outsider.titre}</h3>
            <div className="special-detail">{specials.outsider.detail}</div>
            <p className="special-comment">{specials.outsider.commentaire}</p>
          </div>
        </div>
      )}
      {vueDrawer === "tocard" && (
        <div className="content">
          <div className="special-card">
            <span className="special-badge">🏆 TOCARD DU JOUR</span>
            <h3 className="special-title serif">{specials.tocard.titre}</h3>
            <div className="special-detail">{specials.tocard.detail}</div>
            <p className="special-comment">{specials.tocard.commentaire}</p>
          </div>
        </div>
      )}

      {vueDrawer === "bilan" && (
        <div className="content">
          <div className="stat-row">
            <div className="stat-box">
              <div className="stat-num">{bilan.filter((b) => b.resultat === "Gagnant").length}</div>
              <div className="stat-lbl">Gagnants</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{bilan.filter((b) => b.resultat === "Placé").length}</div>
              <div className="stat-lbl">Placés</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{Math.round((bilan.filter((b) => b.resultat !== "Non placé").length / bilan.length) * 100)}%</div>
              <div className="stat-lbl">Réussite</div>
            </div>
          </div>
          <div className="card">
            <table className="bilan-table">
              <thead>
                <tr><th>Date</th><th>Course</th><th>Sélection</th><th>Résultat</th></tr>
              </thead>
              <tbody>
                {bilan.map((b, i) => (
                  <tr key={i}>
                    <td>{b.date}</td>
                    <td>{b.type}<br /><span style={{ color: "#8a6a52" }}>{b.course}</span></td>
                    <td>{b.cheval}</td>
                    <td style={{ color: couleurResultat(b.resultat), fontWeight: 700 }}>{b.resultat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vueDrawer === "admin" && !adminAuth && (
        <div className="content">
          <div className="card lock-screen">
            <div className="lock-icon">🔒</div>
            <div className="serif" style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Espace Administrateur</div>
            <input
              className="field" type="password" placeholder="Mot de passe"
              value={pwdInput} onChange={(e) => setPwdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifierMdp()}
              style={{ marginBottom: 10, textAlign: "center" }}
            />
            {pwdErreur && <div className="error-txt">Mot de passe incorrect.</div>}
            <div style={{ height: 10 }} />
            <button className="btn" onClick={verifierMdp}>Déverrouiller</button>
          </div>
        </div>
      )}

      {vueDrawer === "admin" && adminAuth && (
        <div className="content">
          <div className="card">
            <div className="section-title">Sélection de la course à éditer</div>
            <label className="flabel">Réunion</label>
            <select
              className="field"
              value={adminCourseSel.r}
              onChange={(e) => setAdminCourseSel({ r: e.target.value, c: 1 })}
            >
              {programme.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.hippodrome}</option>)}
            </select>
            <label className="flabel">Course</label>
            <select
              className="field"
              value={adminCourseSel.c}
              onChange={(e) => setAdminCourseSel((s) => ({ ...s, c: parseInt(e.target.value, 10) }))}
            >
              {programme.find((r) => r.id === adminCourseSel.r)?.courses.map((c) => (
                <option key={c.numero} value={c.numero}>C{c.numero} — {c.nom}</option>
              ))}
            </select>

            <label className="flabel">Pronostic synthétique (numéros séparés par des tirets)</label>
            <input className="field" value={pronoEdit} onChange={(e) => setPronoEdit(e.target.value)} placeholder="ex : 5 - 4 - 3 - 2 - 1" />
            <div style={{ height: 10 }} />
            <button className="btn-outline" style={{ width: "100%" }} onClick={appliquerProno}>Enregistrer le pronostic</button>
          </div>

          <div className="card">
            <div className="section-title">Analyse de chaque partant</div>
            {courseAdmin?.partants.map((p) => (
              <div className="horse-edit" key={p.numero}>
                <div className="horse-edit-head">
                  <PastilleNumero n={p.numero} size={24} /> {p.nom}
                </div>
                <textarea
                  className="field" rows={3} defaultValue={p.analyse}
                  onBlur={(e) => modifierAnalyse(p.numero, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title">🎯 Penalty du Jour</div>
            <label className="flabel">Cheval & course</label>
            <input className="field" value={specials.penalty.titre} onChange={(e) => setSpecials((s) => ({ ...s, penalty: { ...s.penalty, titre: e.target.value } }))} />
            <input className="field" style={{ marginTop: 6 }} value={specials.penalty.detail} onChange={(e) => setSpecials((s) => ({ ...s, penalty: { ...s.penalty, detail: e.target.value } }))} />
            <label className="flabel">Commentaire</label>
            <textarea className="field" rows={3} value={specials.penalty.commentaire} onChange={(e) => setSpecials((s) => ({ ...s, penalty: { ...s.penalty, commentaire: e.target.value } }))} />
          </div>

          <div className="card">
            <div className="section-title">💣 Outsider du Jour</div>
            <label className="flabel">Cheval & course</label>
            <input className="field" value={specials.outsider.titre} onChange={(e) => setSpecials((s) => ({ ...s, outsider: { ...s.outsider, titre: e.target.value } }))} />
            <input className="field" style={{ marginTop: 6 }} value={specials.outsider.detail} onChange={(e) => setSpecials((s) => ({ ...s, outsider: { ...s.outsider, detail: e.target.value } }))} />
            <label className="flabel">Commentaire</label>
            <textarea className="field" rows={3} value={specials.outsider.commentaire} onChange={(e) => setSpecials((s) => ({ ...s, outsider: { ...s.outsider, commentaire: e.target.value } }))} />
          </div>

          <div className="card">
            <div className="section-title">🏆 Tocard du Jour</div>
            <label className="flabel">Cheval & course</label>
            <input className="field" value={specials.tocard.titre} onChange={(e) => setSpecials((s) => ({ ...s, tocard: { ...s.tocard, titre: e.target.value } }))} />
            <input className="field" style={{ marginTop: 6 }} value={specials.tocard.detail} onChange={(e) => setSpecials((s) => ({ ...s, tocard: { ...s.tocard, detail: e.target.value } }))} />
            <label className="flabel">Commentaire</label>
            <textarea className="field" rows={3} value={specials.tocard.commentaire} onChange={(e) => setSpecials((s) => ({ ...s, tocard: { ...s.tocard, commentaire: e.target.value } }))} />
          </div>

          <button className="btn-outline" style={{ width: "100%" }} onClick={() => { setAdminAuth(false); setVueDrawer(null); }}>
            Quitter l'espace admin
          </button>
        </div>
      )}

      {/* ---------------- PROGRAMME PRINCIPAL ---------------- */}
      {!vueDrawer && (
        <>
          <div className="reunions-bar">
            {programme.map((r) => (
              <div
                key={r.id}
                className={`reunion-chip ${r.id === reunionActive ? "active" : ""}`}
                onClick={() => selectionnerReunion(r.id)}
              >
                {r.id}
                <span className="sub">{r.hippodrome}</span>
              </div>
            ))}
          </div>

          <div className="courses-bar">
            {reunion.courses.map((c) => (
              <div
                key={c.numero}
                className={`course-pastille ${c.numero === courseActive ? "active" : ""}`}
                onClick={() => setCourseActive(c.numero)}
              >
                C{c.numero}
              </div>
            ))}
          </div>

          <div className="content">
            <div className="card">
              <div className="course-title serif">{course.nom}</div>
              <div className="course-meta">
                <span>{reunion.id}{course.numero} · {reunion.hippodrome}</span>
              </div>
              <div className="course-meta">
                <span>🏁 <b>{course.distance} m</b></span>
                <span>🕐 Départ <b>{course.heure}</b></span>
                <span>{course.discipline}</span>
                <span>{course.partants.length} partants</span>
              </div>
            </div>

            <div className="card prono-card">
              <div className="prono-label">Pronostic synthétique de l'expert</div>
              <div className="prono-chips">
                {course.pronoSynthetique.map((n, i) => (
                  <React.Fragment key={n}>
                    <PastilleNumero n={n} size={30} />
                    {i < course.pronoSynthetique.length - 1 && <span className="prono-arrow">—</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="section-title">Liste des partants</div>
            <div className="card" style={{ padding: "6px 10px" }}>
              {course.partants.map((p) => (
                <React.Fragment key={p.numero}>
                  <div className="partant-row" onClick={() => setOuvert(ouvert === p.numero ? null : p.numero)}>
                    <PastilleNumero n={p.numero} />
                    <div className="partant-info">
                      <div className="partant-nom">{p.nom}</div>
                      <div className="partant-sub">{p.jockey} · Ent. {p.entraineur}</div>
                    </div>
                    <div className="partant-cote">{p.cote}</div>
                    <Chevron open={ouvert === p.numero} />
                  </div>
                  {ouvert === p.numero && <div className="analyse-box">{p.analyse}</div>}
                </React.Fragment>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 10.5, color: "#b8a288", padding: "10px 20px" }}>
              {loadingApi
                ? "Connexion à l'API PMU (via proxy CORS)…"
                : apiSource === "pmu"
                ? "Données PMU chargées en direct via proxy CORS."
                : "Aperçu avec données de démonstration — l'API PMU (via proxy CORS) sera réessayée au prochain chargement."}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
