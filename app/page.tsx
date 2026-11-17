import Countdown from "@/components/Countdown";
import TigerHero from "@/components/TigerHero";
import { EVENT } from "@/lib/event";

/** One line of Marathi with its English underneath, side by side in spirit. */
function Bi({
  mr,
  en,
  mrClass = "text-bone",
  enClass = "text-bone-dim",
}: {
  mr: React.ReactNode;
  en: React.ReactNode;
  mrClass?: string;
  enClass?: string;
}) {
  return (
    <>
      <span className={`block ${mrClass}`}>{mr}</span>
      <span className={`mt-1 block ${enClass}`}>{en}</span>
    </>
  );
}

const DAYS = [
  {
    date: "२० नोव्हेंबर · 20 Nov",
    mr: "नागपुरात धडक",
    en: "Landing in Nagpur",
    mrText:
      "सगळे नागपुरात येऊन धडकणार — कोणी सकाळी, कोणी दुपारी, कोणी संध्याकाळी. लई गोंधळ होणार, पण मजा पण तेवढीच!",
    enText:
      "Everyone arrives in Nagpur at their own time — morning, afternoon or evening. Some chaos, plenty of fun.",
  },
  {
    date: "२१ नोव्हेंबर · 21 Nov",
    mr: "ताडोबाचा दिवस",
    en: "Tadoba day",
    mrText: "जंगल, गप्पा, गाणी आणि धमाल. वाघोबा दिसला तर नशीब आपलं!",
    enText: "Jungle, stories, songs and masti. Fingers crossed for the tiger!",
  },
  {
    date: "२२ नोव्हेंबर · 22 Nov",
    mr: "परतीची वाट",
    en: "Heading home",
    mrText: "मनात आठवणी भरून आणि पुढच्या भेटीचं ठरवून परतायचं.",
    enText: "Back home with full hearts — and the next reunion already planned.",
  },
];

const FUN = [
  {
    icon: "🎣",
    mr: "फिशपॉन्ड",
    en: "Fishpond",
    mrText:
      "प्रत्येकाच्या नावानं एक गाणं — बहुतेक गमतीशीर, लई हसवणारं! तुमच्या नावाचं कोणतं निघतं बगा.",
    enText:
      "Everyone gets a song (or two) dedicated to them, mostly funny ones. See which song comes out with your name!",
    byMr: "आयोजक: विकास, नीलेश आणि नीलिमा",
    byEn: "Run by Vikas, Nilesh and Nilima",
  },
  {
    icon: "🎤",
    mr: "गाण्यांच्या मैफली",
    en: "Singing sessions",
    mrText: "जुनी गाणी, नवे सूर आणि रात्री अंताक्षरी — गळा तयार ठेवा!",
    enText: "Old songs, new tunes and a late-night antakshari — warm up your voices!",
    byMr: "सादरकर्ते: नीलेश आणि सुनील",
    byEn: "Led by Nilesh and Sunil",
  },
  {
    icon: "😄",
    mr: "लई थट्टामस्करी",
    en: "Lots of leg-pulling",
    mrText: "काय बे भाऊ, एकमेकांची टांग खेचाले तयार राहा!",
    enText: "Be ready for plenty of friendly teasing, from everyone to everyone.",
    byMr: "सगळ्यांकडून सगळ्यांसाठी",
    byEn: "From everyone, for everyone",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ---------------------------------------------------------- hero -- */}
      <section className="grid items-center gap-8 pt-14 pb-10 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-3 font-display text-sm font-semibold tracking-[0.2em] text-leaf uppercase">
            मित्रांचं गेट-टुगेदर · Friends reunion · {EVENT.year}
          </p>
          <h1 className="font-display text-5xl leading-[1.15] font-extrabold text-bone sm:text-7xl">
            ताडोबा बोलवतंय,
            <span className="block text-tiger">चला रे!</span>
          </h1>
          <p className="mt-2 font-display text-2xl font-bold text-leaf sm:text-3xl">
            Tadoba is calling us back.
          </p>
          <p className="mt-5 max-w-xl text-lg text-bone-dim">
            <Bi
              mr={
                <>
                  जुनी दोस्ती, जुन्या गप्पा, आणि यंदा सोबतीला वाघोबा.{" "}
                  <strong>२० ते २२ नोव्हेंबर {EVENT.year}</strong>.
                </>
              }
              en={
                <>
                  Old friends, old stories — and this time, tigers.{" "}
                  <strong className="text-bone">{EVENT.mainDays}</strong>.
                </>
              }
              mrClass="text-bone-dim"
            />
          </p>
          <div className="mt-8">
            <Countdown target={EVENT.startsAt} />
          </div>
        </div>

        <TigerHero className="mx-auto w-64 drop-shadow-2xl sm:w-80 lg:w-full lg:max-w-md" />
      </section>

      <div className="stripes h-2 rounded-full opacity-70" />

      {/* ----------------------------------------------------- the days -- */}
      <section className="py-12">
        <h2 className="font-display text-3xl font-bold text-bone">
          तीन दिवस <span className="text-leaf">· Three days</span>
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {DAYS.map((d) => (
            <div key={d.date} className="card p-6">
              <p className="text-xs font-semibold tracking-widest text-tiger uppercase">
                {d.date}
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-leaf">
                {d.mr} <span className="text-bone-dim">· {d.en}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-bone">
                {d.mrText}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                {d.enText}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- what's in store -- */}
      <section className="pb-12">
        <h2 className="font-display text-3xl font-bold text-bone">
          काय काय धमाल आहे <span className="text-leaf">· What&apos;s in store</span>
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FUN.map((f) => (
            <div key={f.en} className="card p-6">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-xl font-bold text-leaf">
                {f.mr} <span className="text-bone-dim">· {f.en}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-bone">
                {f.mrText}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                {f.enText}
              </p>
              <p className="mt-4 text-xs font-semibold text-amber-glow">
                {f.byMr}
                <span className="block font-normal text-bone-dim">{f.byEn}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ organiser + सरकार -- */}
      <section className="grid gap-4 pb-8 md:grid-cols-2">
        <div className="card border-tiger/40 p-8 text-center">
          <div className="text-4xl">🌟</div>
          <p className="mt-3 text-xs font-semibold tracking-widest text-tiger uppercase">
            आयोजक · Organiser
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold text-bone">
            मयुरी <span className="text-tiger">· Mayuri</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-bone">
            हे सगळं घडवून आणल्याबद्दल मनापासून धन्यवाद, मयुरी!
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            Heartfelt thanks, Mayuri, for making all of this happen.
          </p>
        </div>

        <div className="card border-amber-glow/40 p-8 text-center">
          <div className="text-4xl">👑</div>
          <p className="mt-3 text-xs font-semibold tracking-widest text-amber-glow uppercase">
            आपल्या सगळ्यांच्या लाडक्या · Our most respected
          </p>
          <h2 className="mt-2 font-display text-5xl font-extrabold text-amber-glow">
            सरकार
          </h2>
          <p className="mt-1 font-display text-lg text-bone-dim">
            नीलिमा · Nilima
          </p>
          <p className="mt-4 text-sm leading-relaxed text-bone">
            आमच्या ग्रुपचा आदर आणि आधार — तुमच्याशिवाय ही मैफल अधुरी आहे.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            The respect and heart of our group. This gathering is incomplete
            without you.
          </p>
        </div>
      </section>
    </div>
  );
}
