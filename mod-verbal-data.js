/* Curated word banks for the verbal modules (mod-verbal.js). All task text is German.
 * Generated from hand-written tables; every bank is verified by tests/verbal.test.js.
 * Browser: load this file BEFORE mod-verbal.js. Node: require()d by mod-verbal.js. */
(function (root) {
  'use strict';
  const D = {};

  // ===================== 1. ANALOGIES =====================
  // Pair syntax: "A>B" ; "A>B=ok1,ok2" lists further equally valid completions for A ; leading "+" = rarer words (hard level).
  // Relation direction is fixed per relation (see `dir`).
  const ANALOGY_RAW = {
    teil: { name: 'Ganzes–Teil', dir: 'Ganzes → Teil', lv: [1, 2], pairs: `
Hand>Finger
Fuß>Zeh
Buch>Seite=Kapitel
Jahr>Monat
Haus>Zimmer=Raum
Uhr>Zeiger=Ziffernblatt
Baum>Ast=Stamm,Blatt,Zweig,Wurzel,Krone
Auto>Reifen=Rad,Motor,Lenkrad
Fahrrad>Pedal=Lenkrad,Sattel,Kette,Speiche
Auge>Pupille=Lid,Wimper,Iris
Zug>Waggon=Wagen,Lokomotive
Gesicht>Nase=Mund,Auge,Stirn,Kinn,Wange
Tastatur>Taste
Kette>Glied
Schiff>Mast=Deck,Bug,Heck,Kiel
Gebiss>Zahn
Flugzeug>Tragfläche=Flügel,Cockpit,Rumpf
Blume>Blüte=Stängel,Blatt,Stiel
+Kompass>Nadel
+Hammer>Stiel=Kopf
` },
    ober: { name: 'Einzelnes–Oberbegriff', dir: 'Einzelnes → Oberbegriff', lv: [1, 2], pairs: `
Hund>Säugetier=Tier,Lebewesen,Haustier
Rose>Blume=Pflanze
Eiche>Baum=Pflanze,Laubbaum
Apfel>Obst=Frucht
Karotte>Gemüse=Wurzelgemüse
Stuhl>Möbel=Möbelstück,Sitzmöbel
Hammer>Werkzeug
Geige>Instrument=Musikinstrument,Streichinstrument
Fußball>Sportart=Sport,Ballsport,Mannschaftssport
Rot>Farbe
Rhein>Fluss=Strom
Adler>Vogel=Tier,Greifvogel,Raubvogel
Lachs>Fisch=Tier
Auto>Fahrzeug
Mars>Planet=Himmelskörper
Januar>Monat
Montag>Wochentag=Tag
Tulpe>Blume=Pflanze
Forelle>Fisch=Tier
+Zeder>Nadelbaum=Baum,Pflanze
+Rubin>Edelstein=Stein
` },
    gegen: { name: 'Gegensatz', dir: 'Wort → Gegenteil', lv: [1, 2], pairs: `
heiß>kalt=kühl
hell>dunkel=finster
groß>klein=winzig
laut>leise=still
schnell>langsam=gemächlich
hoch>niedrig=tief,flach
alt>jung=neu
dick>dünn=schmal,schlank
nass>trocken=dürr
voll>leer
stark>schwach=kraftlos
mutig>feige=ängstlich,furchtsam
reich>arm=mittellos
Anfang>Ende=Schluss
Tag>Nacht
Freund>Feind=Gegner
Sieg>Niederlage
Frieden>Krieg
Lob>Tadel=Kritik
Wahrheit>Lüge=Unwahrheit
+Überfluss>Mangel=Knappheit
+Sparsamkeit>Verschwendung
+Zustimmung>Ablehnung=Widerspruch
+Optimist>Pessimist
` },
    werkzeug: { name: 'Werkzeug–Tätigkeit', dir: 'Werkzeug → Tätigkeit', lv: [2, 3], pairs: `
Säge>sägen
Hammer>hämmern
Bohrer>bohren
Pinsel>malen=streichen,anstreichen,pinseln
Schere>schneiden=scheren
Besen>fegen=kehren
Spaten>graben=umgraben
Nadel>nähen=sticken,stechen
Stift>schreiben=zeichnen,malen,kritzeln
Kamm>kämmen
Bürste>bürsten=putzen,schrubben
Pflug>pflügen=ackern
Waage>wiegen
Angel>angeln=fischen
Mixer>mixen=rühren,pürieren
Fön>föhnen=trocknen
Schaufel>schaufeln=graben
Messer>schneiden
Zange>zwicken=klemmen,kneifen
Feile>feilen
+Kelle>mauern
+Lupe>vergrößern=betrachten,untersuchen
+Hobel>hobeln
+Meißel>meißeln=hauen
` },
    ort: { name: 'Ort–Tätigkeit', dir: 'Ort → typische Tätigkeit', lv: [2, 3], pairs: `
Schule>lernen=unterrichten
Bibliothek>lesen=ausleihen,studieren
Bäckerei>backen
Küche>kochen=backen
Schwimmbad>schwimmen=baden
Kirche>beten=singen
Werkstatt>reparieren=basteln,handwerken
Gericht>urteilen=richten
Restaurant>essen=speisen
Turnhalle>turnen=trainieren
Garage>parken
Labor>forschen=experimentieren
Tankstelle>tanken
Bühne>spielen=auftreten
Hafen>anlegen=verladen
Friseursalon>frisieren=schneiden
Kino>zuschauen=schauen
Stadion>anfeuern=zuschauen
+Sternwarte>beobachten=forschen
+Kloster>beten=meditieren
` },
    ursache: { name: 'Ursache–Wirkung', dir: 'Ursache → Wirkung', lv: [2, 3], pairs: `
Regen>Nässe=Pfütze
Frost>Eis=Kälte
Sonne>Wärme=Licht,Schatten,Sonnenbrand,Hitze
Feuer>Rauch=Asche,Hitze,Brand
Schlaf>Erholung=Ruhe
Übung>Fortschritt=Können,Erfolg,Routine
Lernen>Wissen=Kenntnis,Bildung
Sturm>Schaden=Verwüstung,Zerstörung
Hitze>Schweiß=Durst
Trockenheit>Dürre=Missernte
Reibung>Wärme=Hitze
Erdbeben>Zerstörung=Schaden,Tsunami
Anstrengung>Müdigkeit=Erschöpfung,Schweiß
Impfung>Immunität=Schutz
Fleiß>Erfolg=Belohnung
Schlaflosigkeit>Müdigkeit=Erschöpfung
+Inflation>Preisanstieg=Teuerung
+Überschwemmung>Schaden=Zerstörung
` },
    material: { name: 'Rohstoff–Erzeugnis', dir: 'Material → Erzeugnis', lv: [2, 3], pairs: `
Milch>Käse=Butter,Joghurt,Quark,Sahne,Kefir
Mehl>Brot=Kuchen,Nudeln,Teig,Gebäck
Trauben>Wein=Saft,Rosinen,Most
Wolle>Garn=Pullover,Stoff,Socke,Faden,Strickzeug,Mütze
Leder>Schuh=Tasche,Gürtel,Jacke,Handschuh,Sattel
Glas>Fenster=Flasche,Brille,Spiegel,Linse
Ton>Keramik=Geschirr,Vase,Ziegel,Tasse,Topf
Baumwolle>Stoff=Garn,Hemd,Kleidung,Faden
Holz>Papier=Möbel,Brett,Tisch,Balken
Sand>Glas=Beton,Mörtel
Kakao>Schokolade=Praline
Getreide>Mehl=Brot,Schrot,Bier
Erdöl>Benzin=Kunststoff,Diesel,Plastik,Heizöl
Oliven>Öl=Olivenöl
Zuckerrübe>Zucker
Eisenerz>Eisen=Stahl,Metall
+Flachs>Leinen=Garn,Faden
+Hanf>Seil=Tau,Faden
` },
    jung: { name: 'Tier–Junges', dir: 'Tier → Jungtier', lv: [1, 2], pairs: `
Hund>Welpe
Katze>Kätzchen=Katzenjunges
Pferd>Fohlen=Füllen
Kuh>Kalb
Schaf>Lamm
Ziege>Zicklein=Kitz
Reh>Kitz
Schwein>Ferkel
Huhn>Küken
Frosch>Kaulquappe
Schmetterling>Raupe
Hase>Häschen=Junghase
Wildschwein>Frischling
Gans>Gössel
Fliege>Made
` },
    laut: { name: 'Tier–Laut', dir: 'Tier → Laut', lv: [1, 2], pairs: `
Hund>bellen=kläffen,knurren,jaulen
Katze>miauen=fauchen,schnurren
Kuh>muhen=brüllen
Schaf>blöken
Pferd>wiehern=schnauben
Schwein>grunzen=quieken
Hahn>krähen
Frosch>quaken
Esel>iahen=schreien
Löwe>brüllen=knurren
Biene>summen=brummen
Schlange>zischen
Taube>gurren
Wolf>heulen
Vogel>zwitschern=singen,pfeifen,trillern
Grille>zirpen
Gans>schnattern=gackern
Maus>piepsen=quieken,fiepen
Elefant>trompeten
Bär>brummen=knurren
` },
    heim: { name: 'Tier–Behausung', dir: 'Tier → Behausung', lv: [2, 3], pairs: `
Hund>Hütte=Zwinger
Pferd>Stall=Box
Vogel>Nest=Käfig
Biene>Stock=Bienenstock,Korb
Fuchs>Bau=Höhle
Spinne>Netz=Spinnennetz
Bär>Höhle
Eichhörnchen>Kobel=Nest,Baum
Hase>Sasse=Bau
Biber>Burg
Storch>Horst=Nest
Taube>Schlag=Taubenschlag
Wal>Meer=Ozean
Frosch>Teich=Tümpel,Weiher,See
Schaf>Weide=Koppel,Pferch,Stall
Kuh>Weide=Stall
` },
    grad: { name: 'Steigerung', dir: 'schwächer → stärker', lv: [2, 3], pairs: `
warm>heiß
kühl>kalt=eisig
Wind>Sturm=Orkan
Bach>Fluss=Strom
Teich>See=Meer
Hügel>Berg
Ärger>Wut=Zorn,Raserei
Abneigung>Hass
Sympathie>Liebe=Zuneigung
müde>erschöpft=kraftlos,ermattet
mögen>lieben
Brise>Wind
Schauer>Wolkenbruch=Platzregen,Unwetter
Schreck>Entsetzen=Panik,Grauen
+Lächeln>Lachen=Gelächter
+Unmut>Empörung
` },
    beruf: { name: 'Beruf–Arbeitsgegenstand', dir: 'Beruf → Arbeitsgegenstand', lv: [2, 3], pairs: `
Bäcker>Brot=Brötchen,Kuchen,Teig,Gebäck,Torte
Schneider>Stoff=Kleidung,Anzug,Nadel,Garn
Gärtner>Pflanze=Beet,Blume,Rasen,Baum
Arzt>Patient=Kranker
Lehrer>Schüler=Unterricht
Richter>Urteil=Gesetz,Prozess,Fall
Friseur>Haar=Haare,Frisur,Kunde
Metzger>Fleisch=Wurst
Imker>Honig=Biene,Bienen,Bienenstock
Winzer>Wein=Trauben,Rebe,Weinberg
Landwirt>Acker=Feld,Vieh,Getreide
Maurer>Stein=Mauer,Ziegel,Mörtel
Schuster>Schuh=Schuhe,Leder,Sohle
Fischer>Fisch=Netz,Fang
Bibliothekar>Buch=Bücher
Pilot>Flugzeug=Maschine
Koch>Speise=Essen,Gericht,Suppe,Menü
Dachdecker>Dach=Ziegel
Bauer>Feld=Acker,Vieh
+Töpfer>Ton=Keramik,Vase,Geschirr
+Goldschmied>Gold=Schmuck,Ring
` },
    fort: { name: 'Lebewesen–Fortbewegung', dir: 'Lebewesen → Fortbewegungsart', lv: [1, 2], pairs: `
Fisch>schwimmen=tauchen
Vogel>fliegen=flattern,segeln
Mensch>gehen=laufen,rennen,wandern
Schlange>kriechen=schlängeln
Frosch>hüpfen=springen
Pferd>galoppieren=traben,laufen,rennen,springen
Affe>klettern=hangeln,schwingen
Spinne>krabbeln=klettern,laufen
Ente>watscheln=schwimmen
Hase>hoppeln=hüpfen,rennen,springen
Seehund>robben
Maulwurf>graben=wühlen
Schmetterling>flattern=fliegen
Wal>tauchen=schwimmen
Gepard>sprinten=rennen,laufen,jagen
Känguru>springen=hüpfen
Adler>kreisen=fliegen,gleiten,segeln
` },
  };
  // Rarer-word markers: sets the level threshold (a leading + means the pair is only used in "hard").
  const ANALOGIES = {};
  Object.keys(ANALOGY_RAW).forEach((k) => {
    const r = ANALOGY_RAW[k];
    const pairs = r.pairs.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
      let hard = false;
      if (line[0] === '+') { hard = true; line = line.slice(1); }
      const m = line.match(/^([^>]+)>([^=]+)(?:=(.*))?$/);
      const ok = ((m[3] || '').split(',').map((s) => s.trim()).filter(Boolean));
      return { a: m[1].trim(), b: m[2].trim(), ok: [m[2].trim()].concat(ok.length ? ok : []), hard, rel: k };
    });
    ANALOGIES[k] = { id: k, name: r.name, dir: r.dir, lv: r.lv, pairs };
  });
  D.analogies = ANALOGIES;

  // ===================== 2./3. CATEGORY MASTER TABLE (similarities, classification, anagram helpers) =====================
  // Line: [*]Label | parent labels (comma) | family | members (comma).  "*" = leaf category used by the odd-word task:
  // leaf categories are pairwise disjoint (asserted in tests) and are truly disjoint in the real world.
  // Non-leaf tags (sub/super categories) are only used by "Gemeinsamkeiten"; a word's tag set = its direct tags plus all ancestors.
  const CAT_RAW = `
Lebewesen | | natur |
Tiere | Lebewesen | tier |
Wirbeltiere | Tiere | tier |
*Säugetiere | Wirbeltiere | tier | Hund, Katze, Kuh, Schwein, Schaf, Ziege, Hase, Reh, Fuchs, Wolf, Bär, Löwe, Elefant, Giraffe, Zebra, Delfin, Wal, Fledermaus, Igel, Maus, Eichhörnchen, Affe, Tiger, Hirsch, Dachs, Biber
*Vögel | Wirbeltiere | tier | Spatz, Amsel, Adler, Storch, Taube, Specht, Möwe, Schwan, Gans, Falke, Rabe, Krähe, Star, Meise, Pinguin, Papagei, Habicht, Bussard, Huhn
*Fische | Wirbeltiere | tier | Lachs, Forelle, Karpfen, Hecht, Hering, Thunfisch, Zander, Barsch, Makrele, Aal, Scholle, Kabeljau, Hai, Sardine
Reptilien | Wirbeltiere | tier | Schlange, Eidechse, Krokodil, Schildkröte, Gecko, Leguan, Chamäleon
Amphibien | Wirbeltiere | tier | Frosch, Kröte, Salamander, Molch, Unke
*Insekten | Tiere | tier | Ameise, Biene, Wespe, Fliege, Mücke, Schmetterling, Libelle, Heuschrecke, Grille, Hummel, Marienkäfer, Floh, Hornisse
Greifvögel | Vögel | tier | Adler, Falke, Habicht, Bussard
Pflanzen | Lebewesen | pflanze |
*Bäume | Pflanzen | pflanze | Eiche, Buche, Birke, Tanne, Fichte, Kiefer, Ahorn, Linde, Esche, Pappel, Erle, Ulme, Lärche, Platane
Nadelbäume | Bäume | pflanze | Tanne, Fichte, Kiefer, Lärche
Laubbäume | Bäume | pflanze | Eiche, Buche, Birke, Ahorn, Linde, Esche, Pappel, Erle, Ulme, Platane
*Blumen | Pflanzen | pflanze | Rose, Tulpe, Veilchen, Sonnenblume, Margerite, Lilie, Narzisse, Gänseblümchen, Krokus, Orchidee, Mohn, Dahlie, Aster, Primel, Hyazinthe
Lebensmittel | | essen |
*Obstsorten | Lebensmittel | essen | Apfel, Birne, Kirsche, Pflaume, Erdbeere, Himbeere, Banane, Ananas, Traube, Pfirsich, Zitrone, Mango, Aprikose, Mandarine, Heidelbeere, Johannisbeere, Brombeere, Nektarine
Steinobst | Obstsorten | essen | Kirsche, Pflaume, Pfirsich, Aprikose, Nektarine
Südfrüchte | Obstsorten | essen | Banane, Ananas, Mango, Zitrone, Mandarine
Zitrusfrüchte | Südfrüchte | essen | Zitrone, Mandarine, Grapefruit, Limette
*Gemüsesorten | Lebensmittel | essen | Karotte, Brokkoli, Blumenkohl, Spinat, Lauch, Sellerie, Radieschen, Rotkohl, Rote Bete, Erbse, Bohne, Spargel, Rosenkohl, Weißkohl, Grünkohl, Wirsing
Kohlsorten | Gemüsesorten | essen | Blumenkohl, Brokkoli, Rosenkohl, Rotkohl, Weißkohl, Grünkohl, Wirsing
Hülsenfrüchte | Gemüsesorten | essen | Erbse, Bohne, Linse, Kichererbse
Getreidesorten | Lebensmittel | essen | Weizen, Roggen, Gerste, Hafer, Hirse, Reis, Mais, Dinkel
*Gewürze und Kräuter | Lebensmittel | essen | Pfeffer, Zimt, Muskat, Kümmel, Curry, Kurkuma, Vanille, Safran, Koriander, Oregano, Thymian, Basilikum, Petersilie, Schnittlauch, Salbei, Dill, Majoran, Rosmarin, Lorbeer, Anis
Küchenkräuter | Gewürze und Kräuter | essen | Basilikum, Petersilie, Schnittlauch, Salbei, Dill, Thymian, Oregano, Majoran, Rosmarin
*Backwaren | Lebensmittel | essen | Brot, Brötchen, Brezel, Croissant, Kuchen, Torte, Strudel, Semmel, Zwieback, Baguette, Hörnchen, Muffin
*Süßigkeiten | Lebensmittel | essen | Schokolade, Bonbon, Gummibärchen, Lakritze, Praline, Kaugummi, Marzipan, Lutscher, Karamell, Nougat, Toffee, Traubenzucker
*Getränke | | essen | Wasser, Tee, Kaffee, Milch, Saft, Limonade, Bier, Wein, Cola, Kakao, Sekt, Schorle, Mineralwasser, Buttermilch
Alkoholische Getränke | Getränke | essen | Bier, Wein, Sekt, Schnaps, Whisky, Likör
*Möbelstücke | | ding | Stuhl, Tisch, Schrank, Bett, Sofa, Regal, Kommode, Sessel, Hocker, Schreibtisch, Vitrine, Truhe, Garderobe, Nachttisch
Sitzmöbel | Möbelstücke | ding | Stuhl, Sofa, Sessel, Hocker
*Werkzeuge | | ding | Hammer, Säge, Zange, Schraubenzieher, Bohrer, Schraubenschlüssel, Feile, Meißel, Axt, Spaten, Wasserwaage, Zollstock
*Küchengeräte | | ding | Toaster, Mixer, Wasserkocher, Schneebesen, Kochlöffel, Reibe, Sieb, Pfanne, Topf, Nudelholz, Dosenöffner, Kartoffelschäler, Pürierstab, Mikrowelle, Backofen
Elektrogeräte | | ding | Toaster, Mixer, Wasserkocher, Pürierstab, Mikrowelle, Backofen, Staubsauger, Waschmaschine, Fernseher, Föhn, Kühlschrank
*Kleidungsstücke | | ding | Hose, Hemd, Rock, Jacke, Mantel, Pullover, Kleid, Schal, Mütze, Handschuh, Socke, Bluse, Weste, Anzug
Kopfbedeckungen | Kleidungsstücke | ding | Mütze, Hut, Kappe
Schreibgeräte | | ding | Bleistift, Kugelschreiber, Füller, Filzstift, Buntstift, Kreide, Textmarker
Schmuckstücke | | ding | Ring, Kette, Armband, Ohrring, Brosche
*Gebäude | | ort | Schule, Kirche, Bahnhof, Rathaus, Schloss, Burg, Museum, Krankenhaus, Fabrik, Scheune, Kloster, Theater, Bibliothek, Hotel, Flughafen, Stadion
*Fahrzeuge | | verkehr | Auto, Bus, Zug, Fahrrad, Motorrad, Flugzeug, Schiff, Boot, Traktor, Straßenbahn, U-Bahn, Hubschrauber, Roller, Lastwagen, Fähre, Segelboot
Landfahrzeuge | Fahrzeuge | verkehr | Auto, Bus, Zug, Fahrrad, Motorrad, Traktor, Straßenbahn, U-Bahn, Roller, Lastwagen
Wasserfahrzeuge | Fahrzeuge | verkehr | Schiff, Boot, Fähre, Segelboot, Ruderboot, Dampfer, Kanu
Luftfahrzeuge | Fahrzeuge | verkehr | Flugzeug, Hubschrauber, Heißluftballon, Zeppelin, Segelflugzeug
*Berufe | | mensch | Lehrer, Arzt, Bäcker, Schreiner, Pilot, Richter, Koch, Friseur, Maurer, Gärtner, Metzger, Schneider, Apotheker, Elektriker, Pfarrer, Polizist, Maler, Mechaniker, Zahnarzt, Journalist, Architekt
Handwerksberufe | Berufe | mensch | Bäcker, Schreiner, Maurer, Metzger, Schneider, Elektriker, Maler, Friseur
Verwandte | | mensch | Mutter, Vater, Schwester, Bruder, Onkel, Tante, Großmutter, Großvater, Cousin
*Musikinstrumente | | musik | Geige, Flöte, Klavier, Gitarre, Trompete, Posaune, Cello, Harfe, Klarinette, Oboe, Saxofon, Tuba, Trommel, Orgel, Fagott, Bratsche, Xylofon, Triangel, Mundharmonika
Streichinstrumente | Musikinstrumente | musik | Geige, Cello, Bratsche, Kontrabass
Holzblasinstrumente | Blasinstrumente | musik | Flöte, Klarinette, Oboe, Fagott, Saxofon
Blechblasinstrumente | Blasinstrumente | musik | Trompete, Posaune, Tuba, Horn
Blasinstrumente | Musikinstrumente | musik |
Schlaginstrumente | Musikinstrumente | musik | Trommel, Pauke, Xylofon, Triangel, Gong, Tamburin
*Sportarten | | sport | Fußball, Handball, Tennis, Schwimmen, Turnen, Rudern, Boxen, Judo, Fechten, Reiten, Skifahren, Eishockey, Basketball, Volleyball, Segeln, Badminton, Tischtennis, Rugby, Surfen, Eiskunstlauf, Biathlon
Ballsportarten | Sportarten | sport | Fußball, Handball, Basketball, Volleyball, Tennis, Tischtennis, Rugby
Wassersportarten | Sportarten | sport | Schwimmen, Rudern, Segeln, Surfen, Tauchen, Kanufahren
Wintersportarten | Sportarten | sport | Skifahren, Eishockey, Eiskunstlauf, Biathlon, Snowboardfahren, Rodeln
Kampfsportarten | Sportarten | sport | Boxen, Judo, Karate, Fechten, Ringen
*Farben | | abstrakt | Rot, Blau, Grün, Gelb, Schwarz, Weiß, Braun, Grau, Violett, Rosa, Lila, Beige, Pink
*Körperteile | | mensch | Arm, Bein, Kopf, Hand, Knie, Ellbogen, Schulter, Nase, Ohr, Auge, Mund, Hals, Rücken, Bauch, Finger, Zeh, Daumen, Stirn, Kinn, Wange
Organe | Körperteile | mensch | Herz, Lunge, Leber, Niere, Magen, Gehirn
*Flüsse | Gewässer | geo | Rhein, Donau, Elbe, Weser, Main, Neckar, Oder, Mosel, Inn, Isar, Ems, Saale, Seine, Themse, Tiber, Nil, Amazonas, Wolga, Loire
Seen | Gewässer | geo | Bodensee, Müritz, Chiemsee, Gardasee, Plattensee, Starnberger See, Ammersee
Meere | Gewässer | geo | Nordsee, Ostsee, Mittelmeer, Atlantik, Pazifik, Schwarzes Meer, Rotes Meer
Gewässer | | geo |
*Berge | | geo | Zugspitze, Matterhorn, Eiger, Watzmann, Großglockner, Brocken, Feldberg, Mont Blanc, Everest, Kilimandscharo, Olymp, Fuji
*Länder | | geo | Frankreich, Italien, Spanien, Polen, Österreich, Schweiz, Norwegen, Schweden, Finnland, Dänemark, Portugal, Griechenland, Ungarn, Japan, China, Indien, Brasilien, Kanada, Ägypten
*Hauptstädte | | geo | Berlin, Paris, Rom, Madrid, Wien, Bern, Warschau, Prag, Budapest, Athen, Lissabon, Oslo, Stockholm, Helsinki, Kopenhagen, Brüssel, Dublin, London, Amsterdam, Moskau, Tokio, Peking, Kairo, Ottawa
Kontinente | | geo | Europa, Asien, Afrika, Amerika, Australien, Antarktis
*Monate | Zeitangaben | zeit | Januar, Februar, März, April, Mai, Juni, Juli, August, September, Oktober, November, Dezember
Wochentage | Zeitangaben | zeit | Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag
Jahreszeiten | Zeitangaben | zeit | Frühling, Sommer, Herbst, Winter
Zeitangaben | | zeit |
Zeiteinheiten | | zeit | Sekunde, Minute, Stunde, Woche, Jahr, Jahrhundert, Jahrzehnt
Himmelskörper | | natur | Sonne, Mond, Stern, Komet
Planeten | Himmelskörper | natur | Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun
Himmelsrichtungen | | abstrakt | Norden, Süden, Osten, Westen
*Metalle | | stoff | Eisen, Kupfer, Zink, Zinn, Blei, Gold, Silber, Aluminium, Nickel, Titan, Platin, Quecksilber
*Edelsteine | | stoff | Diamant, Rubin, Saphir, Smaragd, Opal, Amethyst, Topas, Granat, Jade, Turmalin, Aquamarin, Achat
*Schulfächer | | abstrakt | Mathematik, Physik, Chemie, Biologie, Geschichte, Erdkunde, Musik, Kunst, Religion, Informatik, Ethik, Latein
Wissenschaften | | abstrakt | Mathematik, Medizin, Psychologie, Soziologie
Naturwissenschaften | Wissenschaften | abstrakt | Physik, Chemie, Biologie, Geologie, Astronomie
*Gefühle | | abstrakt | Freude, Trauer, Wut, Angst, Neid, Stolz, Scham, Ekel, Liebe, Hoffnung, Eifersucht, Langeweile, Überraschung, Mitleid
*Geometrische Figuren | | abstrakt | Kreis, Quadrat, Dreieck, Rechteck, Raute, Trapez, Ellipse, Fünfeck, Sechseck, Siebeneck, Parallelogramm, Achteck
Geometrische Körper | | abstrakt | Würfel, Kugel, Quader, Pyramide, Zylinder, Kegel
Wetterphänomene | | natur | Regen, Schnee, Hagel, Nebel, Gewitter, Sturm, Wind
Naturkatastrophen | | natur | Erdbeben, Lawine, Tsunami, Dürre, Überschwemmung, Vulkanausbruch
Währungen | | abstrakt | Euro, Dollar, Franken, Yen, Rubel, Zloty
Satzzeichen | | sprache | Punkt, Komma, Fragezeichen, Ausrufezeichen, Doppelpunkt, Semikolon, Bindestrich
Wortarten | | sprache | Verb, Nomen, Adjektiv, Artikel, Pronomen, Adverb, Konjunktion, Präposition
Räume | | ort | Küche, Bad, Schlafzimmer, Flur, Keller, Dachboden, Wohnzimmer
`;
  // Words that are too ambiguous for the "Gemeinsamkeiten" task (membership in some tags is arguable).
  const SIM_AMBIGUOUS = ['Hirsch', 'Dachs', 'Biber', 'Hühner', 'Mais', 'Horn', 'Wasser', 'Milch', 'Saft', 'Kakao', 'Bad', 'Kegel', 'Wind', 'Sturm', 'Hafer', 'Reis', 'Gold', 'Silber', 'Ring', 'Kette', 'Herz', 'Ellbogen', 'Huhn', 'Schlange', 'Erde', 'Mond', 'Sonne', 'Stern', 'Kunst', 'Musik', 'Liebe', 'Hoffnung', 'Stolz', 'Mutter', 'Vater', 'Aal', 'Hai', 'Zeiteinheiten', 'Fledermaus', 'Pinguin', 'Wal', 'Delfin', 'Schwimmen', 'Segeln', 'Turnen', 'Reiten', 'Grapefruit', 'Limette', 'Brot', 'Bohne', 'Erbse', 'Linse', 'Kichererbse', 'Mango', 'Traube', 'Tee', 'Kaffee', 'Mineralwasser'];
  // Words belonging to two disjoint-leaf-style families in everyday use: never use in odd-word tasks.
  const ODD_AMBIGUOUS = ['Hai', 'Wal', 'Delfin', 'Pinguin'];
  // For each leaf category: other leaf categories from a close domain (used for hard odd-word questions).
  const NEAR_RAW = `
Obstsorten: Gemüsesorten, Süßigkeiten, Backwaren
Gemüsesorten: Obstsorten, Gewürze und Kräuter
Werkzeuge: Küchengeräte, Möbelstücke
Küchengeräte: Werkzeuge, Möbelstücke
Säugetiere: Vögel, Fische, Insekten
Vögel: Säugetiere, Insekten, Fische
Fische: Säugetiere, Vögel, Insekten
Insekten: Vögel, Fische, Säugetiere
Bäume: Blumen, Gemüsesorten
Blumen: Bäume, Gewürze und Kräuter
Flüsse: Berge, Länder
Berge: Flüsse, Länder
Länder: Hauptstädte, Berge
Hauptstädte: Länder, Flüsse
Metalle: Edelsteine, Werkzeuge
Edelsteine: Metalle, Werkzeuge
Musikinstrumente: Werkzeuge, Küchengeräte
Sportarten: Schulfächer, Fahrzeuge
Schulfächer: Sportarten, Berufe
Berufe: Schulfächer, Gebäude
Gebäude: Möbelstücke, Fahrzeuge
Fahrzeuge: Gebäude, Werkzeuge
Möbelstücke: Küchengeräte, Gebäude
Kleidungsstücke: Möbelstücke, Farben
Getränke: Obstsorten, Süßigkeiten
Backwaren: Süßigkeiten, Obstsorten
Süßigkeiten: Backwaren, Getränke
Gewürze und Kräuter: Gemüsesorten, Blumen
Körperteile: Kleidungsstücke, Gefühle
Gefühle: Körperteile, Schulfächer
Monate: Farben, Länder
Farben: Geometrische Figuren, Gefühle
Geometrische Figuren: Farben, Schulfächer
`;
  // --- parse ---
  const CATS = {};      // label -> { label, parents[], fam, direct[], leaf }
  CAT_RAW.split('\n').map((s) => s.trim()).filter(Boolean).forEach((line) => {
    const f = line.split('|').map((s) => s.trim());
    let label = f[0], leaf = false;
    if (label[0] === '*') { leaf = true; label = label.slice(1); }
    CATS[label] = { label, leaf, parents: f[1] ? f[1].split(',').map((s) => s.trim()) : [], fam: f[2], direct: f[3] ? f[3].split(',').map((s) => s.trim()).filter(Boolean) : [] };
  });
  const NEAR = {};
  NEAR_RAW.split('\n').map((s) => s.trim()).filter(Boolean).forEach((l) => {
    const [k, v] = l.split(':');
    NEAR[k.trim()] = v.split(',').map((s) => s.trim());
  });
  D.cats = CATS;
  D.near = NEAR;
  // Leaf-category pairs that overlap in everyday use: never combined in odd-word or umbrella-term questions.
  D.noPair = [['Backwaren', 'Süßigkeiten'], ['Gemüsesorten', 'Gewürze und Kräuter']];
  D.simAmbiguous = SIM_AMBIGUOUS;
  D.oddAmbiguous = ODD_AMBIGUOUS;
  // For tags that are "plants/animals in everyday use" certain broad tags must not be offered as wrong answers.
  D.noWith = {
    'Pflanzen': ['Obstsorten', 'Gemüsesorten', 'Getreidesorten', 'Gewürze und Kräuter', 'Küchenkräuter', 'Hülsenfrüchte'],
    'Lebewesen': ['Obstsorten', 'Gemüsesorten', 'Getreidesorten', 'Gewürze und Kräuter', 'Küchenkräuter', 'Hülsenfrüchte'],
    'Lebensmittel': ['Säugetiere', 'Vögel', 'Fische', 'Tiere', 'Wirbeltiere', 'Greifvögel', 'Amphibien', 'Reptilien', 'Insekten', 'Getränke', 'Alkoholische Getränke', 'Küchengeräte', 'Elektrogeräte'],
    'Getränke': ['Obstsorten', 'Lebensmittel'],
    'Gewürze und Kräuter': ['Pflanzen', 'Blumen'],
    'Küchenkräuter': ['Pflanzen', 'Blumen'],
    'Pflanzen': ['Küchenkräuter', 'Gewürze und Kräuter'],
    'Tiere': ['Lebensmittel'],
    'Wirbeltiere': ['Lebensmittel'],
    'Küchengeräte': ['Besteck'],
    'Werkzeuge': ['Küchengeräte', 'Schreibgeräte'],
    'Süßigkeiten': ['Backwaren'],
    'Backwaren': ['Süßigkeiten'],
    'Wetterphänomene': ['Naturkatastrophen'],
    'Naturkatastrophen': ['Wetterphänomene'],
    'Elektrogeräte': ['Küchengeräte'],
    'Wissenschaften': ['Schulfächer'],
    'Schulfächer': ['Wissenschaften', 'Naturwissenschaften'],
    'Körperteile': ['Organe'],
    'Zeiteinheiten': ['Monate', 'Wochentage', 'Jahreszeiten', 'Zeitangaben'],
    'Zeitangaben': ['Zeiteinheiten'],
    'Himmelskörper': ['Planeten'],
  };

  // ===================== 4. SENTENCES =====================
  // level ;; sentence with ___ ;; correct ;; wrong=reason ;; wrong=reason ;; ...   (exactly one correct word, >= 4 wrong with a reason each)
  const SENT_RAW = `
1;; Sie blieb zu Hause, ___ sie krank war.;; weil;; obwohl=Obwohl drückt einen Gegensatz aus; die Krankheit ist hier aber der Grund.;; damit=Damit nennt einen Zweck, keinen Grund.;; ob=Ob leitet eine indirekte Frage ein.;; dass=Mit „dass“ lässt sich hier kein Grund anschließen.
1;; ___ die Sonne schien, war es empfindlich kalt.;; Obwohl;; Weil=Die Sonne ist kein Grund für die Kälte.;; Damit=Damit nennt einen Zweck, der hier keinen Sinn ergibt.;; Dass=Mit „dass“ ist der Satz grammatisch nicht möglich.;; Sodass=„Sodass“ nennt eine Folge und steht nicht am Satzanfang.
1;; Es regnete so stark, ___ die Straße überflutet wurde.;; dass;; obwohl=Ein Gegensatz passt nicht zu „so stark … dass“.;; weil=Die Überflutung ist die Folge, nicht der Grund.;; damit=Eine Folge ist kein Zweck.;; ob=Ob leitet eine indirekte Frage ein.
1;; Er wartet seit einer Stunde ___ den Bus.;; auf;; an=Zu „warten“ gehört die Präposition „auf“.;; für=Zu „warten“ gehört die Präposition „auf“.;; zu=Zu „warten“ gehört die Präposition „auf“.;; bei=Zu „warten“ gehört die Präposition „auf“.
1;; Sie interessiert sich sehr ___ Astronomie.;; für;; an=Es heißt „sich interessieren für“.;; auf=Es heißt „sich interessieren für“.;; über=Es heißt „sich interessieren für“.;; um=Es heißt „sich interessieren für“.
1;; Der Nachbar hat ___ großen Hund.;; einen;; ein=„Hund“ ist männlich und steht im Akkusativ; „ein“ passt nicht.;; eine=„Eine“ ist weiblich.;; einem=„Einem“ ist Dativ.;; eines=„Eines“ ist Genitiv.
1;; Wir haben gestern lange ___.;; gespielt;; spielt=Nach „haben“ steht das Partizip.;; gespielen=Das Partizip ist falsch gebildet.;; spielte=Präteritum passt nicht zu „haben“.;; spielen=Der Infinitiv ergibt hier keinen vollständigen Satz.
1;; Er ist gestern nach Hause ___.;; gegangen;; gegehen=Das Partizip ist falsch gebildet.;; ging=Präteritum passt nicht zu „ist“.;; gehen=Der Infinitiv ergibt hier keinen vollständigen Satz.;; gegangt=Das Partizip ist falsch gebildet.
1;; Meine Schwester ___ Ärztin.;; ist;; bin=„Bin“ gehört zu „ich“.;; sind=„Sind“ gehört zu „wir/sie“.;; seid=„Seid“ gehört zu „ihr“.;; bist=„Bist“ gehört zu „du“.
1;; Ich lese ein Buch, ___ ich auf den Zug warte.;; während;; ob=Ob leitet eine indirekte Frage ein.;; dass=Mit „dass“ lässt sich hier keine Zeitangabe anschließen.;; sodass=Eine Folge ergibt hier keinen Sinn.;; damit=Der Zweck „auf den Zug zu warten“ ergibt keinen Sinn.
1;; Gestern ___ wir im Zoo.;; waren;; sind=Es fehlt das Partizip („gewesen“); außerdem passt Präsens nicht zu „gestern“.;; war=„War“ gehört zu „ich/er/sie/es“.;; wären=„Wären“ ist Konjunktiv II und passt nicht zu „gestern“.;; wird=Futur passt nicht zu „gestern“.
1;; Je früher wir losfahren, ___ besser.;; desto;; dann=„Je … desto/umso“ ist die feste Verbindung.;; weil=„Je … desto/umso“ ist die feste Verbindung.;; als=„Je … desto/umso“ ist die feste Verbindung.;; ob=„Je … desto/umso“ ist die feste Verbindung.
1;; Hast du ___ Schlüssel gesehen?;; meinen;; mein=Akkusativ männlich verlangt „meinen“.;; meine=„Meine“ ist weiblich oder Plural.;; meinem=„Meinem“ ist Dativ.;; meiner=„Meiner“ ist Dativ weiblich oder Genitiv.
1;; Er fragt, ___ das Kino schon geöffnet hat.;; ob;; dass=Nach „fragen“ folgt hier eine indirekte Frage mit „ob“.;; weil=Ein Grund wird nicht erfragt.;; damit=Ein Zweck wird nicht erfragt.;; obwohl=Ein Gegensatz wird nicht erfragt.
1;; Der Kuchen schmeckt ___ als der vom Bäcker.;; besser;; gut=Nach „als“ braucht man den Komparativ.;; am besten=Der Superlativ passt nicht zu „als“.;; guter=Die Steigerung ist falsch gebildet.;; gutter=Die Steigerung ist falsch gebildet.
1;; Nach dem Essen putzt er sich die ___.;; Zähne;; Zahn=Es sind mehrere Zähne gemeint, also Plural.;; Zahnen=Diese Form gibt es nicht.;; Zähnen=Das wäre Dativ Plural; hier steht der Akkusativ.;; Zähn=Diese Form gibt es nicht.
1;; Mein Bruder wohnt ___ München.;; in;; nach=„Nach“ bezeichnet eine Richtung, keinen Ort.;; zu=„Zu“ passt nicht vor Städtenamen.;; an=„An“ passt nicht vor Städtenamen.;; auf=„Auf“ passt nicht vor Städtenamen.
1;; Sie ___ gern Gitarre.;; spielt;; spielen=Das wäre die Form für „wir/sie (Plural)“.;; spiele=Das wäre die Form für „ich“.;; spielst=Das wäre die Form für „du“.;; gespielt=Das Partizip allein bildet kein Prädikat.
1;; Reden ist Silber, Schweigen ist ___.;; Gold;; Bronze=Im Sprichwort heißt es „Schweigen ist Gold“.;; Eisen=Im Sprichwort heißt es „Schweigen ist Gold“.;; Kupfer=Im Sprichwort heißt es „Schweigen ist Gold“.;; Blei=Im Sprichwort heißt es „Schweigen ist Gold“.
1;; Aller guten Dinge sind ___.;; drei;; zwei=Im Sprichwort heißt es „drei“.;; vier=Im Sprichwort heißt es „drei“.;; fünf=Im Sprichwort heißt es „drei“.;; sieben=Im Sprichwort heißt es „drei“.
1;; Das Kind hat sich beim Sturz das Bein ___.;; gebrochen;; gebrechen=Das Partizip ist falsch gebildet.;; gebrach=Diese Form gibt es nicht.;; brach=Präteritum passt nicht zu „hat … “.;; brechen=Der Infinitiv ergibt keinen vollständigen Satz.
1;; Die Kinder sind im Garten ___.;; gewesen;; gewest=Das Partizip ist falsch gebildet.;; war=Nach „sind“ steht das Partizip.;; waren=Nach „sind“ steht das Partizip.;; sein=Nach „sind“ steht das Partizip.
2;; Der Vortrag war so ___, dass niemand einschlief.;; fesselnd;; ermüdend=Das würde das Einschlafen erklären, nicht verhindern.;; eintönig=Ein eintöniger Vortrag macht eher müde.;; langatmig=Ein langatmiger Vortrag macht eher müde.;; einschläfernd=Das widerspricht dem Nebensatz direkt.
2;; Er hat das Angebot ___, weil die Bedingungen ungünstig waren.;; abgelehnt;; angenommen=Bei ungünstigen Bedingungen wäre das unlogisch.;; begrüßt=Bei ungünstigen Bedingungen wäre das unlogisch.;; angefordert=Das passt nicht zum Grund „ungünstige Bedingungen“.;; verlangt=Das passt nicht zum Grund „ungünstige Bedingungen“.
2;; Die Wanderer erreichten den Gipfel, ___ sie völlig erschöpft waren.;; obwohl;; weil=Erschöpfung ist kein Grund für das Erreichen des Gipfels.;; damit=Erschöpfung ist kein Zweck.;; ob=Ob leitet eine indirekte Frage ein.;; dass=Mit „dass“ ist der Satz nicht korrekt anzuschließen.
2;; Diese Tatsache ___ sich nicht leugnen.;; lässt;; lassen=Der Plural passt nicht zu „Tatsache“.;; lasse=Das wäre die Form für „ich“.;; lasst=Das wäre der Imperativ Plural oder „ihr“.;; gelassen=Das Partizip allein bildet kein Prädikat.
2;; Sie hat die Prüfung mit Bestnote ___.;; bestanden;; bestehen=Der Infinitiv ergibt keinen vollständigen Satz.;; bestand=Nach „hat“ steht das Partizip.;; bestandet=Diese Form gibt es nicht.;; gestanden=Das ist das Partizip eines anderen Verbs.
2;; Bitte schließ die Tür, es ___.;; zieht;; ziehen=Das wäre die Pluralform und passt nicht zu „es“.;; zogen=Das ist Präteritum Plural.;; gezogen=Das Partizip allein bildet kein Prädikat.;; ziehst=Das wäre die Form für „du“.
2;; Die Mannschaft hat das Spiel knapp ___.;; verloren;; verlohren=Das Partizip wird ohne „h“ geschrieben.;; verlor=Nach „hat“ steht das Partizip.;; verlieren=Der Infinitiv ergibt keinen vollständigen Satz.;; verlorn=Diese Form gibt es nicht.
2;; Der Lehrer lobte die Schüler, ___ sie sich sehr angestrengt hatten.;; weil;; obwohl=Ein Lob trotz Anstrengung ergibt keinen Sinn.;; damit=Die Anstrengung war bereits geschehen und ist kein Zweck.;; ob=Ob leitet eine indirekte Frage ein.;; dass=Mit „dass“ lässt sich hier kein Grund anschließen.
2;; Er sprach so leise, dass man ihn kaum ___.;; verstand;; verstehen=Der Infinitiv ergibt am Satzende keinen vollständigen Satz.;; verstanden=Ohne Hilfsverb ist das Partizip falsch.;; verstehst=Das wäre die Form für „du“.;; verstehe=Das wäre die Form für „ich“.
2;; Anna ist größer ___ ihre Schwester.;; als;; wie=Nach dem Komparativ steht in der Standardsprache „als“.;; denn=Nach dem Komparativ steht in der Standardsprache „als“.;; dass=Nach dem Komparativ steht in der Standardsprache „als“.;; ob=Nach dem Komparativ steht in der Standardsprache „als“.
2;; Wenn du Hilfe brauchst, ___ du mich anrufen.;; kannst;; kann=„Kann“ passt zu „er/sie/es“.;; können=„Können“ passt zu „wir/sie (Plural)“.;; könnt=„Könnt“ passt zu „ihr“.;; kannte=Das ist die Form eines anderen Verbs („kennen“).
2;; Das Paket ___ gestern geliefert.;; wurde;; wurden=Der Plural passt nicht zu „das Paket“.;; wird=Präsens passt nicht zu „gestern“.;; worden=„Worden“ steht nur als Partizip am Ende („ist geliefert worden“).;; geworden=„Geworden“ ist ein Partizip und bildet hier kein Passiv.
2;; Wenn ich mehr Geld ___, würde ich ein Haus kaufen.;; hätte;; habe=Der Indikativ passt nicht zur Möglichkeitsform „würde“.;; hatte=Der Indikativ passt nicht zur Möglichkeitsform „würde“.;; haben=Die Form passt nicht zu „ich“.;; gehabt=Das Partizip allein bildet kein Prädikat.
2;; Er tat so, ___ ob er nichts gehört hätte.;; als;; wie=„Wie ob“ ist keine Verbindung.;; wenn=„Wenn ob“ ist keine Verbindung.;; dass=„Dass ob“ ist keine Verbindung.;; weil=„Weil ob“ ist keine Verbindung.
2;; Sie fragte, ___ er Zeit habe.;; ob;; dass=Nach „fragen“ folgt eine indirekte Frage mit „ob“.;; weil=Ein Grund wird nicht erfragt.;; damit=Ein Zweck wird nicht erfragt.;; wenn=„Wenn“ leitet keine indirekte Frage ein.
2;; Der Ball rollte ___ Hang hinunter.;; den;; dem=„Hinunter“ verlangt hier den Akkusativ.;; der=„Hang“ ist männlich; „der“ wäre Nominativ.;; des=„Des“ ist Genitiv.;; dies=Das ist kein Artikel.
2;; Wer rastet, der ___.;; rostet;; ruht=Im Sprichwort heißt es „rostet“.;; rennt=Im Sprichwort heißt es „rostet“.;; rudert=Im Sprichwort heißt es „rostet“.;; rechnet=Im Sprichwort heißt es „rostet“.
2;; Man soll den Tag nicht vor dem ___ loben.;; Abend;; Morgen=Im Sprichwort heißt es „Abend“.;; Mittag=Im Sprichwort heißt es „Abend“.;; Nachmittag=Im Sprichwort heißt es „Abend“.;; Sonntag=Im Sprichwort heißt es „Abend“.
2;; Ein Unglück kommt selten ___.;; allein;; gern=Im Sprichwort heißt es „allein“.;; oft=Im Sprichwort heißt es „allein“.;; schnell=Im Sprichwort heißt es „allein“.;; zweimal=Im Sprichwort heißt es „allein“.
2;; Hunde, die bellen, ___ nicht.;; beißen;; jagen=Im Sprichwort heißt es „beißen“.;; fressen=Im Sprichwort heißt es „beißen“.;; laufen=Im Sprichwort heißt es „beißen“.;; schlafen=Im Sprichwort heißt es „beißen“.
2;; Es ist nicht alles Gold, was ___.;; glänzt;; strahlt=Im Sprichwort heißt es „glänzt“.;; blendet=Im Sprichwort heißt es „glänzt“.;; blinkt=Im Sprichwort heißt es „glänzt“.;; schimmert=Im Sprichwort heißt es „glänzt“.
2;; Je mehr er übte, ___ sicherer wurde er.;; desto;; als=„Je … desto/umso“ ist die feste Verbindung.;; wie=„Je … desto/umso“ ist die feste Verbindung.;; wenn=„Je … desto/umso“ ist die feste Verbindung.;; ob=„Je … desto/umso“ ist die feste Verbindung.
2;; Das Wasser im See war so ___, dass man bis zum Grund sehen konnte.;; klar;; trüb=Trübes Wasser verhindert den Blick auf den Grund.;; schlammig=Schlammiges Wasser verhindert den Blick auf den Grund.;; dunkel=Dunkles Wasser verhindert den Blick auf den Grund.;; schmutzig=Schmutziges Wasser verhindert den Blick auf den Grund.
2;; Nach dem Marathon war er so ___, dass er kaum noch gehen konnte.;; erschöpft;; ausgeruht=Das ist das Gegenteil von „kaum noch gehen können“.;; munter=Das widerspricht dem Nebensatz.;; fit=Das widerspricht dem Nebensatz.;; frisch=Das widerspricht dem Nebensatz.
2;; Das Wetter war schlecht; ___ blieben wir zu Hause.;; deshalb;; trotzdem=„Trotzdem“ drückt einen Gegensatz aus, hier folgt aber eine Konsequenz.;; obwohl=„Obwohl“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; weil=„Weil“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; damit=„Damit“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.
3;; Der Politiker blieb in der Debatte stets ___ und ließ sich nicht provozieren.;; sachlich;; impulsiv=Wer impulsiv ist, lässt sich leicht provozieren.;; ausfallend=Wer ausfallend wird, hat sich provozieren lassen.;; aufbrausend=Wer aufbrausend ist, lässt sich leicht provozieren.;; gehässig=Gehässigkeit widerspricht dem Bild eines Unprovozierten.
3;; Die Ergebnisse der Studie sind ___: Sie lassen mehrere Deutungen zu.;; mehrdeutig;; eindeutig=Das ist das Gegenteil.;; zwingend=Zwingende Ergebnisse lassen keine Alternativen zu.;; unstrittig=Unstrittige Ergebnisse lassen keine Alternativen zu.;; offenkundig=Offenkundige Ergebnisse lassen keine Alternativen zu.
3;; Wegen der anhaltenden Dürre ___ sich die Lage der Bauern zusehends.;; verschlechterte;; verbesserte=Dürre verbessert die Lage nicht.;; erholte=Dürre führt nicht zur Erholung.;; festigte=Eine Festigung passt nicht zu „Dürre“.;; stabilisierte=Eine Stabilisierung passt nicht zu „zusehends“ und „Dürre“.
3;; Er verfügt über ein ___ Wissen, das weit über sein Fachgebiet hinausgeht.;; umfassendes;; lückenhaftes=Lückenhaftes Wissen geht nicht weit über ein Fachgebiet hinaus.;; spärliches=Spärliches Wissen widerspricht dem Nebensatz.;; dürftiges=Dürftiges Wissen widerspricht dem Nebensatz.;; begrenztes=Begrenztes Wissen widerspricht dem Nebensatz.
3;; Aufgrund ___ starken Regens wurde das Konzert abgesagt.;; des;; dem=„Aufgrund“ verlangt den Genitiv.;; den=„Aufgrund“ verlangt den Genitiv.;; der=„Der“ passt nicht zu „Regens“ (männlich, Singular).;; dessen=„Dessen“ ist ein Relativpronomen und kein Artikel.
3;; Die Zeugin ___, dass er das Geheimnis verraten habe.;; behauptete;; behauptest=Das wäre die Form für „du“.;; behaupteten=Das wäre die Pluralform.;; behauptetet=Diese Form gibt es nicht.;; behaupten=Das wäre die Pluralform.
3;; Nachdem er den Brief ___ hatte, ging er zur Post.;; geschrieben;; schrieb=Nach „hatte“ steht das Partizip.;; schreibt=Nach „hatte“ steht das Partizip.;; schreiben=Nach „hatte“ steht das Partizip.;; schreibend=Das Partizip Präsens passt nicht zum Plusquamperfekt.
3;; Sie weiß nicht, ___ sie helfen soll.;; wem;; wen=„Helfen“ verlangt den Dativ.;; wer=„Wer“ ist Nominativ.;; wessen=„Wessen“ ist Genitiv.;; was=„Was“ bezieht sich nicht auf Personen.
3;; Weil er ___ war, konnte er den Termin nicht wahrnehmen.;; verhindert;; verfügbar=Wer verfügbar ist, kann einen Termin wahrnehmen.;; anwesend=Wer anwesend ist, kann einen Termin wahrnehmen.;; ausgeruht=Das liefert keinen Grund für das Fehlen.;; bereit=Wer bereit ist, kann einen Termin wahrnehmen.
3;; Das Wetter war schlecht; ___ gingen wir spazieren.;; trotzdem;; deshalb=Schlechtes Wetter ist kein Grund zum Spazierengehen.;; weil=„Weil“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; obwohl=„Obwohl“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; damit=„Damit“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.
3;; Er trat zurück, ___ ihm niemand das Vertrauen entzogen hatte.;; obwohl;; weil=Das Vertrauen wurde nicht entzogen; das ist kein Grund für den Rücktritt.;; sofern=„Sofern“ drückt eine Bedingung aus.;; falls=„Falls“ drückt eine Bedingung aus.;; indem=„Indem“ nennt ein Mittel, keinen Gegensatz.
3;; Sie lernte Tag und Nacht, ___ sie die Prüfung bestehen konnte.;; damit;; obwohl=Ein Gegensatz passt nicht zu intensivem Lernen.;; weil=Das Bestehen ist kein Grund für das Lernen.;; ob=Ob leitet eine indirekte Frage ein.;; falls=„Falls“ drückt eine Bedingung aus.
3;; Ich bin mir ___, dass er die Wahrheit sagt.;; sicher;; sichere=Diese Form gibt es hier nicht.;; sichert=Das ist eine Verbform.;; sicherlich=„Sicherlich“ ist kein Adjektiv und passt nicht zu „mir“.;; sicherst=Das ist eine Verbform.
3;; Das Kind ___ sich vor dem Hund.;; fürchtet;; fürchten=Der Plural passt nicht zu „das Kind“.;; fürchtest=Das wäre die Form für „du“.;; fürchte=Das wäre die Form für „ich“.;; gefürchtet=Das Partizip allein bildet kein Prädikat.
3;; Der Zeuge widersprach sich mehrfach, ___ seine Aussage unglaubwürdig wirkte.;; sodass;; obwohl=Ein Gegensatz passt nicht: Die Widersprüche sind der Grund der Wirkung.;; damit=Eine Folge ist kein Zweck.;; ob=Ob leitet eine indirekte Frage ein.;; weil=Die Reihenfolge von Ursache und Wirkung wäre vertauscht.
3;; Sie verbrachte Stunden in der Bibliothek, ___ ihr Referat zu vollenden.;; um;; damit=Nach „damit“ folgt ein Nebensatz mit eigenem Subjekt.;; weil=„Weil“ verlangt einen Nebensatz.;; obwohl=„Obwohl“ verlangt einen Nebensatz.;; dass=„Dass“ verlangt einen Nebensatz.
1;; Das Mädchen ___ gerne Bücher.;; liest;; lesen=Der Plural passt nicht zu „das Mädchen“.;; lest=Das wäre die Form für „ihr“.;; lese=Das wäre die Form für „ich“.;; gelesen=Das Partizip allein bildet kein Prädikat.
1;; Wir ___ morgen ins Kino gehen.;; wollen;; will=Das wäre die Form für „ich/er/sie/es“.;; willst=Das wäre die Form für „du“.;; wollt=Das wäre die Form für „ihr“.;; gewollt=Das Partizip allein bildet kein Prädikat.
1;; Im Winter ist es oft ___ als im Sommer.;; kälter;; kalt=Nach „als“ braucht man den Komparativ.;; am kältesten=Der Superlativ passt nicht zu „als“.;; kaltter=Die Steigerung ist falsch gebildet.;; kältere=Die Endung passt nicht zu „ist es“.
1;; Ich habe mich über das Geschenk sehr ___.;; gefreut;; freute=Nach „habe“ steht das Partizip.;; freuen=Der Infinitiv ergibt hier keinen vollständigen Satz.;; gefreuen=Das Partizip ist falsch gebildet.;; freue=Nach „habe“ steht das Partizip.
1;; Gib mir bitte ___ Stück Kuchen.;; ein;; einen=„Stück“ ist sächlich; „einen“ wäre männlich.;; eine=„Eine“ ist weiblich.;; einem=„Einem“ ist Dativ.;; einer=„Einer“ ist Dativ weiblich oder Genitiv.
1;; Die Ausstellung ___ noch bis Ende des Monats zu sehen.;; ist;; sind=Der Plural passt nicht zu „die Ausstellung“.;; bist=Das wäre die Form für „du“.;; seid=Das wäre die Form für „ihr“.;; sein=Der Infinitiv ergibt hier keinen vollständigen Satz.
2;; Sie hat ___ Zeit, deshalb kann sie nicht kommen.;; keine;; nicht=Ein Nomen wie „Zeit“ wird mit „kein“ verneint.;; kein=Die Endung passt nicht zu „Zeit“ (weiblich).;; keiner=Die Endung passt nicht zum Akkusativ.;; nichts=„Nichts“ passt nicht vor „Zeit“.
2;; Der Zug hatte Verspätung, ___ kamen wir zu spät an.;; deshalb;; trotzdem=„Trotzdem“ drückt einen Gegensatz aus.;; obwohl=„Obwohl“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; weil=„Weil“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.;; damit=„Damit“ leitet einen Nebensatz ein; die Wortstellung stimmt nicht.
2;; Bei ___ Wetter bleiben wir lieber zu Hause.;; diesem;; dieser=„Wetter“ ist sächlich; „dieser“ wäre weiblich.;; dieses=„Bei“ verlangt den Dativ.;; diesen=„Bei“ verlangt den Dativ.;; dies=Das ist kein Artikelwort vor „Wetter“.
2;; Sie rechnet ___ einer Verspätung.;; mit;; auf=Es heißt „rechnen mit“.;; an=Es heißt „rechnen mit“.;; zu=Es heißt „rechnen mit“.;; bei=Es heißt „rechnen mit“.
2;; Obwohl es stark regnete, ___ wir spazieren.;; gingen;; gegangen=Das Partizip allein bildet kein Prädikat.;; ging=Das wäre die Form für „er/sie/es“.;; gehend=Das Partizip Präsens bildet kein Prädikat.;; gingt=Das wäre die Form für „ihr“.
2;; Sie tut, als ___ sie nichts wüsste.;; ob;; dass=„Als dass“ passt hier nicht.;; weil=„Als weil“ ist keine Verbindung.;; dann=„Als dann“ passt hier nicht.;; damit=„Als damit“ ist keine Verbindung.
3;; Er bestand ___, dass alle Beteiligten angehört werden.;; darauf;; davon=Es heißt „bestehen auf“.;; dazu=Es heißt „bestehen auf“.;; daran=Es heißt „bestehen auf“.;; dafür=Es heißt „bestehen auf“.
3;; Er hat den Vertrag unterschrieben, ohne ihn gelesen ___.;; zu haben;; haben=Bei „ohne … zu“ fehlt das „zu“.;; hat=Eine finite Form passt nicht in „ohne … zu“.;; gehabt=Das Partizip allein ergibt keinen Infinitivsatz.;; zu hatten=Die Form ist falsch gebildet.
3;; Das ist der Mann, ___ Auto gestohlen wurde.;; dessen;; dem=Es wird ein Genitiv („dessen“) verlangt.;; den=Es wird ein Genitiv („dessen“) verlangt.;; deren=„Deren“ ist weiblich oder Plural.;; der=Es wird ein Genitiv („dessen“) verlangt.
`;
  const SENTENCES = SENT_RAW.split('\n').map((s) => s.trim()).filter(Boolean).map((line, idx) => {
    const f = line.split(';;').map((s) => s.trim());
    const wrong = f.slice(3).map((w) => { const i = w.indexOf('='); return { w: w.slice(0, i).trim(), why: w.slice(i + 1).trim() }; });
    return { id: idx, lvl: +f[0], text: f[1], answer: f[2], wrong };
  });
  D.sentences = SENTENCES;

  // ===================== 5. SYNONYMS / ANTONYMS =====================
  // level | pos (a adjective, n noun, v verb) | headword | synonyms | antonyms | forbidden (near-synonyms / related words that must never be distractors; "-" = none)
  const SYN_RAW = `
1|a|schnell|rasch,flink,zügig|langsam,gemächlich|eilig,rapide,hurtig,rasant
1|a|groß|riesig,gewaltig,enorm|klein,winzig|hoch,mächtig,umfangreich,stattlich,erwachsen
1|a|klein|winzig,gering,klitzeklein|groß,riesig|kurz,niedrig,zierlich,kompakt
1|a|schön|hübsch,reizend,ansehnlich|hässlich,unansehnlich|prächtig,herrlich,wunderschön,attraktiv,toll,gut
1|a|traurig|betrübt,niedergeschlagen,bedrückt|fröhlich,heiter,froh|melancholisch,unglücklich,trübsinnig,wehmütig,deprimiert
1|a|fröhlich|heiter,munter,vergnügt|traurig,betrübt|froh,glücklich,lustig,ausgelassen,gut gelaunt
1|a|müde|schläfrig,erschöpft,matt|wach,munter,ausgeruht|kraftlos,ermattet,schlapp,träge,abgespannt
1|a|mutig|tapfer,furchtlos,unerschrocken|feige,ängstlich|kühn,wagemutig,beherzt,heldenhaft,verwegen,couragiert
1|a|feige|furchtsam,ängstlich,zaghaft|mutig,tapfer|zögerlich,scheu,schüchtern,hasenfüßig,verzagt
1|a|klug|schlau,intelligent,gescheit|dumm,töricht|weise,clever,pfiffig,begabt,vernünftig,gewitzt
1|a|dumm|töricht,einfältig,unklug|klug,schlau|blöd,albern,naiv,beschränkt,närrisch,unvernünftig
1|a|reich|vermögend,wohlhabend,begütert|arm,mittellos|betucht,gut situiert,üppig,reichhaltig,vermögensstark
1|a|arm|mittellos,bedürftig,unvermögend|reich,wohlhabend|dürftig,notleidend,verarmt,bescheiden,kärglich
1|a|leise|still,gedämpft,ruhig|laut,lärmend|flüsternd,geräuschlos,lautlos,sanft,gedämpft
1|a|laut|lärmend,dröhnend,schallend|leise,still|ohrenbetäubend,geräuschvoll,gellend,lärmig,tosend
1|a|ehrlich|aufrichtig,redlich,offen|unehrlich,verlogen|wahrhaftig,integer,direkt,gerade,treu
1|a|freundlich|nett,liebenswürdig,zuvorkommend|unfreundlich,schroff|herzlich,höflich,gütig,sympathisch,warm,gastlich
1|a|alt|betagt,bejahrt,greis|jung,neu|antik,altmodisch,veraltet,uralt,gebraucht,verbraucht,abgenutzt
1|a|jung|jugendlich,unreif|alt,betagt|frisch,neu,heranwachsend,knabenhaft,kindlich,unerfahren
1|a|schwer|gewichtig,massig,wuchtig|leicht,federleicht|kompliziert,schwierig,anstrengend,mühsam,belastend,schwerwiegend
1|a|dunkel|finster,düster,lichtlos|hell,licht|schwarz,duster,trübe,nachtschwarz,schummrig
1|a|hell|licht,leuchtend,strahlend|dunkel,finster|klar,glänzend,sonnig,blass,gleißend
1|a|sauber|rein,gepflegt,reinlich|schmutzig,dreckig|blank,hygienisch,gewaschen,makellos,gepflegt,ordentlich
1|a|schmutzig|dreckig,verschmutzt,unrein|sauber,rein|verdreckt,staubig,schlammig,fleckig,verunreinigt,ungepflegt
1|a|gefährlich|riskant,bedrohlich,brenzlig|ungefährlich,harmlos,sicher|heikel,kritisch,gewagt,schädlich,giftig,tödlich
1|a|leer|unbesetzt,ausgeräumt,entleert|voll,gefüllt|hohl,verlassen,unbewohnt,vakant,frei
1|a|voll|gefüllt,randvoll,überfüllt|leer,unbesetzt|satt,gesättigt,komplett,prall,vollständig,besetzt
2|a|zerbrechlich|brüchig,fragil,empfindlich|stabil,robust,fest|zart,dünn,spröde,hinfällig,gebrechlich,filigran
2|a|geizig|knauserig,filzig,knickerig|großzügig,freigebig,spendabel|sparsam,habgierig,gierig,kleinlich,genügsam,geldgierig
2|a|großzügig|freigebig,spendabel,gebefreudig|geizig,knauserig|nobel,edel,weitherzig,mildtätig,verschwenderisch,hilfsbereit
2|a|eifrig|emsig,fleißig,beflissen|faul,träge,lustlos|rege,bemüht,arbeitsam,unermüdlich,strebsam,tüchtig
2|a|faul|träge,untätig,bequem|fleißig,eifrig|müßig,lethargisch,schlaff,arbeitsscheu,lahm,passiv
2|a|bescheiden|genügsam,anspruchslos,zurückhaltend|anspruchsvoll,überheblich|demütig,einfach,schlicht,stolz,arm,zufrieden,gering
2|a|vorsichtig|behutsam,umsichtig,achtsam|leichtsinnig,unvorsichtig,sorglos|vorausschauend,zögerlich,ängstlich,zaghaft,bedächtig,achtlos,sicher
2|a|leichtsinnig|unbedacht,unvorsichtig,fahrlässig|vorsichtig,besonnen|verantwortungslos,sorglos,waghalsig,tollkühn,gedankenlos,riskant
2|a|ruhig|gelassen,friedlich,still|unruhig,aufgeregt,hektisch|gemütlich,gefasst,leise,entspannt,gleichmütig,besonnen,geruhsam
2|a|wütend|zornig,verärgert,erbost|besänftigt,friedlich,gelassen|aufgebracht,empört,sauer,rasend,gereizt,fuchsteufelswild,böse
2|a|gleichgültig|teilnahmslos,desinteressiert,apathisch|interessiert,engagiert,anteilnehmend|unbeteiligt,lustlos,kühl,uninteressiert,abgestumpft,egal
2|a|beliebt|geschätzt,populär,gefragt|unbeliebt,verhasst|angesehen,begehrt,berühmt,bekannt,gemocht,geachtet
2|a|gemütlich|behaglich,bequem,wohnlich|ungemütlich,unbehaglich|heimelig,kuschelig,angenehm,traut,wohlig
2|a|selten|rar,spärlich,vereinzelt|häufig,oft,zahlreich|knapp,kostbar,ungewöhnlich,einzigartig,wenig
2|a|offensichtlich|offenkundig,augenscheinlich,eindeutig|verborgen,unklar,versteckt|sichtbar,klar,deutlich,erkennbar,augenfällig,ersichtlich,anscheinend
2|a|nützlich|brauchbar,hilfreich,vorteilhaft|nutzlos,unbrauchbar,schädlich|praktisch,wertvoll,dienlich,zweckmäßig,sinnvoll,gut
3|a|prägnant|treffend,bündig,pointiert|weitschweifig,ausschweifend,umständlich|kurz,knapp,präzise,gedrängt,konzis,aussagekräftig,deutlich,markant
3|a|subtil|hintergründig,nuanciert,feinsinnig|plump,grob,offensichtlich|fein,zart,verfeinert,differenziert,diskret,unterschwellig,versteckt,raffiniert
3|a|obsolet|veraltet,überholt,überlebt|aktuell,modern,gängig|altmodisch,antiquiert,überflüssig,nutzlos,verjährt,gebräuchlich,zeitgemäß,alt
3|a|eloquent|redegewandt,wortgewandt,beredt|wortkarg,sprachlos,stumm|gesprächig,geschwätzig,redselig,schlagfertig,rhetorisch,überzeugend,rhetorisch
3|a|ambivalent|zwiespältig,gegensätzlich,widersprüchlich|eindeutig,klar|unentschieden,unschlüssig,zögerlich,unsicher,mehrdeutig,gespalten,doppeldeutig
3|a|redundant|überflüssig,entbehrlich,unnötig|notwendig,unentbehrlich|wiederholt,doppelt,ausufernd,überschüssig,verzichtbar,nutzlos,überzählig,unverzichtbar
3|a|marode|baufällig,verfallen,heruntergekommen|intakt,heil,gepflegt|brüchig,krank,schwach,altersschwach,ruinös,verwahrlost,reparaturbedürftig,kaputt
3|a|vage|ungenau,unbestimmt,nebulös|präzise,genau,eindeutig|ungefähr,undeutlich,verschwommen,schwammig,unklar,vermutlich,offen,ungewiss
3|a|akribisch|sorgfältig,gewissenhaft,minutiös|nachlässig,oberflächlich,schludrig|genau,gründlich,pedantisch,penibel,detailversessen,exakt,ordentlich,fein
3|a|arglos|unbefangen,gutgläubig,vertrauensvoll|argwöhnisch,misstrauisch,skeptisch|naiv,unschuldig,ehrlich,einfältig,ahnungslos,harmlos,unverdächtig
3|a|verwerflich|schändlich,unmoralisch,sittenwidrig|ehrenhaft,anständig,lobenswert|böse,schlecht,gemein,unehrenhaft,ehrlos,niederträchtig,tadelnswert,unredlich
3|a|rigoros|streng,unnachgiebig,strikt|nachsichtig,milde,lax|hart,kompromisslos,gnadenlos,unerbittlich,schonungslos,drastisch,konsequent
3|a|spärlich|dürftig,karg,kümmerlich|reichlich,üppig,ausgiebig|knapp,wenig,mager,selten,vereinzelt,rar,gering
3|a|konsequent|folgerichtig,stringent,unbeirrbar|inkonsequent,sprunghaft,wankelmütig|stur,entschlossen,standhaft,hartnäckig,eisern,prinzipientreu,beharrlich
3|a|rudimentär|ansatzweise,andeutungsweise,unausgebildet|ausgereift,vollständig,entwickelt|primitiv,einfach,grundlegend,elementar,unvollständig,bruchstückhaft,unterentwickelt
3|a|unabdingbar|unerlässlich,unentbehrlich,unverzichtbar|entbehrlich,überflüssig,verzichtbar|wichtig,erforderlich,essenziell,obligatorisch,wesentlich,nötig,unvermeidlich,dringend,notwendig,zwingend
3|a|kontrovers|umstritten,strittig,widersprüchlich|unumstritten,einhellig,einstimmig|gegensätzlich,diskutabel,heikel,uneins,problematisch,fragwürdig
3|a|prekär|heikel,misslich,bedenklich|unbedenklich,sicher,stabil|schwierig,gefährlich,kritisch,unsicher,brenzlig,riskant,peinlich,missglückt
3|a|vehement|heftig,energisch,nachdrücklich|zaghaft,verhalten,schwach|stark,leidenschaftlich,entschieden,gewaltig,ungestüm,hitzig,massiv,kraftvoll
1|n|Angst|Furcht,Besorgnis,Bangigkeit|Mut,Zuversicht|Panik,Schrecken,Sorge,Grauen,Entsetzen,Beklommenheit,Scheu
1|n|Freude|Vergnügen,Heiterkeit,Frohsinn|Trauer,Kummer,Leid|Spaß,Begeisterung,Wonne,Jubel,Lust,Fröhlichkeit,Glück
1|n|Streit|Zank,Auseinandersetzung,Zwist|Eintracht,Frieden,Versöhnung|Konflikt,Krach,Zoff,Meinungsverschiedenheit,Disput,Kampf,Fehde
1|n|Ärger|Verdruss,Zorn,Verstimmung|Freude,Gelassenheit|Unmut,Zoff,Empörung,Verärgerung,Groll,Wut,Missmut
1|n|Anfang|Beginn,Start,Auftakt|Ende,Schluss|Eröffnung,Ursprung,Entstehung,Einleitung,Aufbruch,Anbruch
1|n|Ende|Schluss,Abschluss,Finale|Anfang,Beginn|Ausgang,Stopp,Ziel,Tod,Rand,Vollendung,Ausklang
1|n|Lüge|Unwahrheit,Schwindel,Flunkerei|Wahrheit,Aufrichtigkeit|Betrug,Täuschung,Märchen,Fälschung,Ausrede,Halbwahrheit,Irreführung
1|n|Hilfe|Unterstützung,Beistand,Mithilfe|Behinderung,Hindernis|Förderung,Entlastung,Rat,Dienst,Zuwendung,Mitarbeit,Hilfestellung
1|n|Reichtum|Vermögen,Wohlstand,Wohlhabenheit|Armut,Not|Überfluss,Geld,Schätze,Fülle,Kapital,Luxus,Reichsein
1|n|Armut|Not,Mittellosigkeit,Dürftigkeit|Reichtum,Wohlstand|Elend,Bedürftigkeit,Mangel,Knappheit,Entbehrung,Verelendung,Bescheidenheit
1|n|Sieg|Triumph,Erfolg,Gewinn|Niederlage,Verlust|Meisterschaft,Titel,Eroberung,Durchbruch,Sieger,Gewinner,Pokal
2|n|Gefährte|Begleiter,Kamerad,Weggefährte|Feind,Gegner|Freund,Kumpel,Partner,Genosse,Gesellschafter,Mitstreiter,Kollege
2|n|Gefahr|Risiko,Bedrohung,Gefährdung|Sicherheit,Schutz|Unheil,Wagnis,Notlage,Drohung,Schaden,Unglück,Gefährlichkeit
2|n|Mangel|Fehlen,Knappheit,Defizit|Überfluss,Fülle|Not,Armut,Lücke,Verlust,Fehler,Unzulänglichkeit,Schwäche,Engpass
2|n|Wunsch|Verlangen,Begehren,Drang|Abneigung,Widerwille|Ziel,Traum,Bitte,Hoffnung,Lust,Anliegen,Bedürfnis,Gelüst
2|n|Mut|Tapferkeit,Courage,Kühnheit|Feigheit,Angst|Furchtlosigkeit,Zuversicht,Unerschrockenheit,Wagemut,Entschlossenheit,Heldentum,Tat
2|n|Fleiß|Eifer,Emsigkeit,Arbeitsamkeit|Faulheit,Trägheit|Ausdauer,Anstrengung,Beharrlichkeit,Strebsamkeit,Mühe,Ehrgeiz,Tüchtigkeit
2|n|Eile|Hast,Hektik,Dringlichkeit|Muße,Gemächlichkeit,Ruhe|Tempo,Geschwindigkeit,Zeitdruck,Rasanz,Betriebsamkeit,Stress,Schnelligkeit
2|n|Heimat|Zuhause,Geburtsland,Herkunftsort|Fremde|Vaterland,Wohnort,Ursprung,Gegend,Wurzeln,Geburtsort,Land,Heimatland
2|n|Vorteil|Nutzen,Pluspunkt,Vorzug|Nachteil,Schaden|Vorsprung,Profit,Annehmlichkeit,Bonus,Trumpf,Stärke,Gewinn
2|n|Nachteil|Handicap,Manko,Schattenseite|Vorteil,Vorzug|Mangel,Schaden,Benachteiligung,Last,Problem,Minuspunkt,Schwäche,Defizit
2|n|Ehrgeiz|Streben,Strebsamkeit,Zielstrebigkeit|Gleichgültigkeit,Genügsamkeit|Fleiß,Ambition,Wille,Antrieb,Sehnsucht,Ehrsucht,Gier,Eifer
2|n|Gerücht|Gerede,Klatsch,Tratsch|Tatsache,Beweis|Behauptung,Verleumdung,Lüge,Nachricht,Spekulation,Mutmaßung,Latrinenparole,Geschwätz
2|n|Brauch|Sitte,Tradition,Gepflogenheit|-|Gewohnheit,Ritual,Regel,Kultur,Ritus,Übung,Konvention
3|n|Resignation|Entsagung,Mutlosigkeit,Verzicht|Hoffnung,Zuversicht|Aufgabe,Niedergeschlagenheit,Schicksalsergebung,Apathie,Hoffnungslosigkeit,Lethargie,Kapitulation
3|n|Dilemma|Zwickmühle,Zwangslage,Klemme|Lösung|Problem,Notlage,Entscheidung,Zweifel,Krise,Ausweglosigkeit,Patt,Konflikt
3|n|Tenor|Grundtenor,Kernaussage,Tendenz|-|Stimmung,Sinn,Botschaft,Aussage,Hauptpunkt,Thema,Inhalt
3|n|Fazit|Ergebnis,Schlussfolgerung,Resümee|-|Zusammenfassung,Bilanz,Ausgang,Schluss,Urteil,Quintessenz,Einleitung
3|n|Euphorie|Hochstimmung,Überschwang,Begeisterung|Niedergeschlagenheit,Depression,Trübsinn|Freude,Rausch,Ekstase,Jubel,Glück,Verzückung,Leidenschaft,Wonne
3|n|Misstrauen|Argwohn,Skepsis,Zweifel|Vertrauen,Zutrauen|Verdacht,Zurückhaltung,Vorbehalt,Unsicherheit,Unglaube,Verunsicherung,Vorsicht
3|n|Zuversicht|Optimismus,Hoffnung,Vertrauen|Pessimismus,Schwarzseherei,Mutlosigkeit|Gewissheit,Glaube,Heiterkeit,Sicherheit,Resignation,Mut,Zutrauen
3|n|Missgunst|Neid,Eifersucht,Abgunst|Gunst,Wohlwollen,Gönnerhaftigkeit|Groll,Gehässigkeit,Böswilligkeit,Hass,Ablehnung,Feindseligkeit,Missmut,Missbilligung
3|n|Anmut|Grazie,Charme,Liebreiz|Plumpheit,Unbeholfenheit,Hässlichkeit|Schönheit,Eleganz,Reiz,Würde,Zauber,Lieblichkeit,Zierlichkeit,Eleganz
3|n|Hochmut|Arroganz,Überheblichkeit,Dünkel|Bescheidenheit,Demut|Stolz,Eitelkeit,Einbildung,Anmaßung,Selbstüberschätzung,Eingebildetheit,Selbstgefälligkeit,Dünkelhaftigkeit
3|n|Gleichmut|Gelassenheit,Seelenruhe,Ruhe|Aufregung,Erregung|Besonnenheit,Fassung,Ausgeglichenheit,Unerschütterlichkeit,Stoizismus,Seelenfrieden,Gleichgültigkeit
1|v|beginnen|anfangen,starten,loslegen|beenden,aufhören,enden|einleiten,eröffnen,anbrechen,anheben,ansetzen,aufnehmen,einsteigen
1|v|kaufen|erwerben,anschaffen,besorgen|verkaufen,veräußern|bestellen,ersteigern,einkaufen,handeln,erstehen,beziehen,shoppen
1|v|verkaufen|veräußern,absetzen,losschlagen|kaufen,erwerben|handeln,vertreiben,abgeben,verhökern,anbieten,versteigern,vermarkten,umsetzen
1|v|rennen|laufen,sprinten,eilen|schleichen,trödeln|hetzen,flitzen,spurten,joggen,rasen,hasten,galoppieren,gehen
1|v|sagen|äußern,mitteilen,erklären|schweigen|reden,sprechen,behaupten,verkünden,erzählen,bemerken,erwidern,flüstern,rufen
1|v|fragen|nachfragen,anfragen,befragen|antworten,erwidern|bitten,forschen,prüfen,verhören,erkundigen,wissen wollen
1|v|lachen|kichern,glucksen,prusten|weinen,schluchzen|lächeln,grinsen,feixen,schmunzeln,jubeln,johlen,scherzen,amüsieren
1|v|weinen|schluchzen,heulen,flennen|lachen,jubeln|klagen,jammern,wimmern,trauern,greinen,tränen
1|v|finden|entdecken,aufspüren,auffinden|verlieren,suchen|antreffen,erwischen,erfahren,stoßen,erkennen,ausfindig machen,ermitteln
1|v|verlieren|einbüßen,verlegen,verbummeln|gewinnen,finden|vermissen,verschwenden,verpassen,verspielen,aufgeben,verlorengehen,versäumen
1|v|gewinnen|siegen,triumphieren,erringen|verlieren,unterliegen|erwerben,erlangen,erzielen,erreichen,verdienen,erobern,besiegen,bezwingen
2|v|schimpfen|meckern,schelten,zetern|loben,preisen|beschimpfen,tadeln,motzen,nörgeln,klagen,rügen,fluchen,wettern,toben
2|v|loben|preisen,rühmen,würdigen|tadeln,rügen,schelten|anerkennen,ehren,schmeicheln,belobigen,beglückwünschen,gratulieren,bewundern,hervorheben
2|v|zögern|zaudern,schwanken,säumen|handeln,entscheiden,zugreifen|warten,bedenken,verharren,stocken,innehalten,abwarten,trödeln,hadern,verweilen
2|v|verbergen|verstecken,verheimlichen,verhüllen|zeigen,offenbaren,enthüllen|tarnen,verschleiern,verdecken,vertuschen,unterschlagen,geheim halten,wahren,kaschieren
2|v|zerstören|vernichten,verwüsten,demolieren|aufbauen,errichten,erschaffen|ruinieren,beschädigen,zertrümmern,sprengen,abreißen,verheeren,kaputtmachen,ausradieren,vernichten
2|v|aufbauen|errichten,konstruieren,erstellen|abreißen,zerstören,einreißen|bauen,gründen,anlegen,schaffen,montieren,zusammensetzen,erschaffen,aufstellen,entwickeln,arrangieren
2|v|schweigen|verstummen,still sein,stillhalten|reden,sprechen,plaudern|sagen,flüstern,verharren,mauern,ruhen,verschweigen,pausieren,verbergen
2|v|vermeiden|umgehen,meiden,ausweichen|aufsuchen,ansteuern|vorbeugen,verhindern,unterlassen,verzichten,umschiffen,umfahren,fernbleiben,verschonen,entgehen,suchen
2|v|bewundern|verehren,anhimmeln,bestaunen|verachten,verabscheuen|schätzen,achten,respektieren,lieben,würdigen,beneiden,staunen,loben,mögen,preisen
2|v|erlauben|gestatten,genehmigen,zulassen|verbieten,untersagen|erleichtern,ermöglichen,billigen,freigeben,bewilligen,dulden,einwilligen,gewähren,zustimmen
2|v|verbieten|untersagen,verwehren,sperren|erlauben,gestatten|verhindern,unterbinden,ablehnen,vorenthalten,ächten,verweigern,bannen,verpönen,unterbinden
3|v|kritisieren|bemängeln,beanstanden,monieren|loben,würdigen|tadeln,rügen,verurteilen,anprangern,bemäkeln,nörgeln,meckern,schelten,bewerten
3|v|eruieren|ermitteln,herausfinden,ergründen|verschleiern|erkunden,untersuchen,klären,prüfen,erforschen,recherchieren,feststellen,aufklären,analysieren
3|v|resümieren|zusammenfassen,bilanzieren,rekapitulieren|-|schließen,folgern,überblicken,wiederholen,erinnern,abschließen,fassen,ausführen
3|v|konfrontieren|gegenüberstellen,entgegenhalten|schonen,verschonen|zusammenführen,anklagen,vorhalten,herausfordern,vorwerfen,zwingen,aussetzen,begegnen
3|v|kaschieren|überspielen,vertuschen,verschleiern|offenlegen,enthüllen,zeigen|verdecken,tarnen,verheimlichen,verschönern,beschönigen,retuschieren,übertünchen,verbergen
3|v|mutmaßen|vermuten,annehmen,spekulieren|wissen,beweisen|glauben,schätzen,ahnen,denken,erahnen,fürchten,unterstellen,veranschlagen,zweifeln
3|v|florieren|blühen,gedeihen,prosperieren|verkümmern,darniederliegen,stagnieren|wachsen,aufblühen,boomen,sprießen,wuchern,expandieren,fruchten,erfolgreich sein
3|v|stagnieren|stocken,stillstehen,verharren|florieren,gedeihen,wachsen|stehenbleiben,festsitzen,einfrieren,lahmen,verkümmern,rückläufig sein,auf der Stelle treten
3|v|diffamieren|verleumden,schmähen,herabsetzen|rühmen,ehren,loben|beleidigen,anschwärzen,verunglimpfen,beschimpfen,schlechtmachen,denunzieren,verteufeln,verspotten,demütigen
3|v|zementieren|festigen,verfestigen,festschreiben|aufweichen,lockern|manifestieren,untermauern,bestätigen,stabilisieren,verankern,festklopfen,besiegeln
3|v|abwägen|erwägen,überlegen,prüfen|-|bedenken,beurteilen,vergleichen,erörtern,nachdenken,ermessen,werten,einschätzen,bewerten
3|v|besänftigen|beruhigen,beschwichtigen,mäßigen|aufwiegeln,aufbringen,reizen|trösten,mildern,dämpfen,stillen,entschärfen,glätten,zähmen,umstimmen,erregen
`;
  const SYN = SYN_RAW.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
    const f = line.split('|').map((s) => s.trim());
    const list = (s) => (s === '-' || !s ? [] : s.split(',').map((x) => x.trim()).filter(Boolean));
    return { lvl: +f[0], pos: f[1], head: f[2], syn: list(f[3]), ant: list(f[4]), forb: list(f[5]) };
  });
  D.syn = SYN;

  // ===================== 7. VOCABULARY =====================
  // level | group | word | definition.  Words in the same group are close in meaning; their definitions are never used as
  // wrong options for each other. Wrong options come from the definitions of words in other groups.
  const VOC_RAW = `
1|choice|Alternative|andere Möglichkeit, Wahlmöglichkeit
1|reason|Argument|Begründung, mit der man eine Behauptung stützt
1|talk|Diskussion|Aussprache, bei der Meinungen ausgetauscht werden
1|check|Kontrolle|Überprüfung, ob etwas in Ordnung ist
1|info|Information|Auskunft, Mitteilung
1|conflict|Konflikt|Auseinandersetzung, Streit
1|praise|Kompliment|anerkennendes, freundliches Wort
1|complaint|Reklamation|Beanstandung einer mangelhaften Ware
1|promise|Garantie|Zusicherung, dass eine Ware fehlerfrei ist
1|rule|Prinzip|Grundsatz, nach dem man handelt
1|custom|Tradition|überlieferter Brauch
1|test|Experiment|wissenschaftlicher Versuch
1|issue|Problem|schwierige Aufgabe oder Frage
1|way|Methode|planmäßiges Vorgehen
1|mood|Optimist|Mensch, der zuversichtlich in die Zukunft blickt
1|mood2|Pessimist|Mensch, der stets das Schlimmste erwartet
1|self|Egoist|Mensch, der vor allem an den eigenen Vorteil denkt
1|share|Minderheit|kleinerer Teil einer Gruppe
1|share|Majorität|Mehrheit, größerer Teil einer Gruppe
1|culture|Kultur|Gesamtheit der geistigen und künstlerischen Leistungen einer Gesellschaft
2|short|prägnant|kurz und treffend formuliert
2|fine|subtil|fein und kaum wahrnehmbar
2|twofold|Ambivalenz|gleichzeitiges Nebeneinander gegensätzlicher Gefühle oder Haltungen
2|practical|pragmatisch|sachbezogen und am praktischen Nutzen orientiert
2|joy|Euphorie|Zustand überschwänglicher Hochstimmung
2|agree|Kompromiss|Einigung durch gegenseitiges Nachgeben
2|agree|Konsens|allgemeine Übereinstimmung der Meinungen
2|speech|eloquent|redegewandt, sprachlich ausdrucksstark
2|old|obsolet|nicht mehr gebräuchlich, überholt
2|assume|Hypothese|unbewiesene Annahme, die überprüft werden soll
2|sum|Resümee|zusammenfassende Schlussfolgerung
2|weight|Priorität|Vorrang, höhere Dringlichkeit
2|weight|Relevanz|Bedeutsamkeit für einen bestimmten Zusammenhang
2|accept|Toleranz|Duldsamkeit gegenüber anderen Meinungen und Lebensweisen
2|conflict|Dilemma|Zwangslage zwischen zwei unangenehmen Möglichkeiten
2|similar|Analogie|Entsprechung, Ähnlichkeit von Verhältnissen
2|real|authentisch|echt und glaubwürdig
2|real2|Fiktion|Erfundenes, Erdachtes
2|real3|Realität|Wirklichkeit
2|math|Variable|veränderliche Größe
2|time|Chronologie|zeitliche Abfolge von Ereignissen
2|power|Dominanz|Vorherrschaft, überwiegender Einfluss
2|drive|Initiative|erster Anstoß zu einer Handlung, Unternehmungsgeist
2|drive|Motivation|Beweggrund, Antrieb für ein Verhalten
2|office|Instanz|zuständige Stelle oder Behörde
2|limit|Kapazität|Fassungsvermögen, Leistungsfähigkeit
2|limit|Limit|Grenze, Höchstmaß
2|crash|Kollision|Zusammenstoß
2|opposite|Kontrast|deutlicher Gegensatz
2|complex|komplex|vielschichtig, aus vielen Teilen zusammengesetzt
2|diff|Nuance|feiner, kaum merklicher Unterschied
2|exact|Präzision|Genauigkeit
2|view|Perspektive|Blickwinkel; Aussicht auf die Zukunft
2|view|Vision|Zukunftsvorstellung, Traumbild
2|trend|Tendenz|erkennbare Entwicklungsrichtung
2|open|Transparenz|Durchschaubarkeit, Offenheit
3|extra|redundant|überflüssig, mehrfach vorhanden
3|pride|Arroganz|Überheblichkeit, hochmütiges Auftreten
3|assume|Prämisse|Voraussetzung, von der eine Schlussfolgerung ausgeht
3|contra|Paradoxon|scheinbarer Widerspruch
3|opposite|Dichotomie|Zweiteilung, strikte Gegenüberstellung zweier Begriffe
3|short-lived|ephemer|kurzlebig, vergänglich
3|obvious|eklatant|offenkundig, ins Auge springend
3|logic|kohärent|zusammenhängend und schlüssig
3|logic|plausibel|einleuchtend, nachvollziehbar
3|short|lakonisch|kurz und trocken, wortkarg
3|ignore|Ignoranz|Nichtbeachtung oder bewusste Unwissenheit gegenüber etwas
3|ignore|Apathie|Teilnahmslosigkeit, mangelndes Interesse
3|hidden|latent|verborgen vorhanden, noch nicht in Erscheinung getreten
3|hidden|implizit|nicht ausdrücklich gesagt, aber mitgemeint
3|hidden2|explizit|ausdrücklich, klar ausgesprochen
3|emotion|Pathos|übertriebene, feierliche Gefühlsbetonung
3|exact2|Pedant|übergenauer, kleinlicher Mensch
3|time2|Anachronismus|zeitliche Fehleinordnung, etwas, das nicht in seine Zeit passt
3|opposite|Diskrepanz|Abweichung oder Widerspruch zwischen zwei Dingen
3|fate|Fatalismus|Glaube an eine unabwendbare Schicksalsfügung
3|office|Hierarchie|Rangordnung mit über- und untergeordneten Stellen
3|honest|Integrität|Unbescholtenheit, Aufrichtigkeit im Handeln
3|feel|Intuition|Eingebung, Erkennen ohne bewusstes Nachdenken
3|mock|Ironie|Ausdrucksweise, bei der das Gegenteil des Gemeinten gesagt wird
3|mock|Sarkasmus|bissiger, verletzender Spott
3|image|Metapher|bildhafter Ausdruck, bei dem etwas ohne „wie“ übertragen wird
3|image|Allegorie|bildhafte Darstellung eines abstrakten Begriffs
3|dull|Monotonie|Eintönigkeit
3|self|Opportunismus|Anpassung an die Umstände zum eigenen Vorteil
3|model|Paradigma|Muster, Beispiel; grundlegende Denkweise
3|real3|Phänomen|wahrnehmbare Erscheinung
3|joke|Pointe|überraschender, zugespitzter Höhepunkt eines Witzes
3|media|Propaganda|gezielte, oft politische Meinungsbeeinflussung
3|sum|Quintessenz|das Wesentliche, der Kern einer Sache
3|sum|Synthese|Verbindung getrennter Elemente zu einem Ganzen
3|strong|Resilienz|seelische Widerstandskraft
3|speech|Rhetorik|Redekunst
3|doubt|Skepsis|Zweifel, kritische Zurückhaltung
3|together|Symbiose|Zusammenleben verschiedener Lebewesen zum gegenseitigen Nutzen
3|trivial|trivial|alltäglich, unbedeutend
3|dream|Utopie|Entwurf einer idealen, aber (noch) nicht verwirklichten Gesellschaft
3|force|Vehemenz|Heftigkeit, Nachdruck
3|cut|Zäsur|Einschnitt, deutliche Unterbrechung
3|twofold|Ambiguität|Mehrdeutigkeit
3|rise|Eskalation|stufenweise Verschärfung
3|change|Fluktuation|Schwankung, ständiger Wechsel
3|money|Inflation|allgemeine Geldentwertung durch steigende Preise
3|money|Konjunktur|Gesamtlage und Schwankungen der Wirtschaft
3|money|Rezession|Rückgang der Wirtschaftsleistung
3|money|Subvention|staatliche Geldzuwendung an Unternehmen
3|money|Dividende|Gewinnanteil, den ein Unternehmen an Aktionäre ausschüttet
3|change|Metamorphose|Verwandlung, Gestaltwechsel
3|illness|Pandemie|weltweite Ausbreitung einer Infektionskrankheit
3|illness|Epidemie|zeitlich und örtlich begrenzte Ausbreitung einer Krankheit
3|balance|Symmetrie|spiegelbildliche Gleichmäßigkeit
3|sure|rigide|starr, unbeugsam
3|sure2|diffus|ohne klare Konturen, verschwommen
3|mind|Empathie|Fähigkeit, sich in andere Menschen einzufühlen
3|mind|Sympathie|spontane Zuneigung zu einem Menschen
3|move|Migration|Wanderung von Menschen in ein anderes Land oder eine andere Region
3|forecast|Prognose|Vorhersage einer künftigen Entwicklung
3|law|Legislative|gesetzgebende Gewalt im Staat
3|law|Exekutive|ausführende, vollziehende Gewalt im Staat
`;
  const VOCAB = VOC_RAW.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
    const f = line.split('|').map((s) => s.trim());
    return { lvl: +f[0], grp: f[1], word: f[2], def: f[3] };
  });
  // Misspelling pairs: [correct, wrong]; the wrong form is a typical error and is not a correct spelling of any word in the list.
  const MISS_RAW = `
Rhythmus|Rythmus
Maschine|Maschiene
vielleicht|vieleicht
Standard|Standart
Bibliothek|Bibliotek
Atmosphäre|Atmosfäre
Katastrophe|Katastrofe
Philosophie|Filosofie
Akkord|Akord
Adresse|Addresse
Hypothese|Hypotese
Mathematik|Mathematick
Chaos|Kaos
Quittung|Quitung
Rhabarber|Rabarber
Ingenieur|Ingeneur
Labyrinth|Labirynth
Nachbar|Nachbahr
Wahrheit|Warheit
Lexikon|Lexicon
Diktat|Dictat
Mannschaft|Manschaft
Rücksicht|Rüksicht
Entschuldigung|Entschudigung
Terrasse|Terasse
Apotheke|Appotheke
Allergie|Alergie
Therapie|Terapie
Theater|Teater
Thema|Tema
Interesse|Intresse
Prozent|Procent
Tabelle|Tabele
Millionen|Milionen
Kommissar|Komissar
Kassette|Kasette
Sympathie|Simpathie
Symmetrie|Simmetrie
Syndrom|Sindrom
Hygiene|Higiene
Lawine|Lavine
Vegetarier|Vegeterier
Sekretär|Sekreter
Paket|Packet
pünktlich|pünklich
Quelle|Kwelle
Konkurrenz|Konkurenz
Satellit|Sattelit
Existenz|Existens
Ahnung|Anung
Fieber|Fiebber
Resultat|Resulltat
Biologie|Biollogie
Cousine|Kusine
`.split('\n').map((s) => s.trim()).filter(Boolean).map((l) => l.split('|'));
  D.vocab = VOCAB;
  D.misspell = MISS_RAW.filter((p) => p[0] !== 'Cousine');

  // ===================== 8. GENERAL KNOWLEDGE =====================
  // topic | level | question | correct | wrong answers separated by "~" ; "@pool" expands to the pool minus the correct answer.
  const KNOW_POOLS = {
    capitals: 'Paris~Rom~Madrid~Wien~Bern~Warschau~Prag~Budapest~Athen~Lissabon~Oslo~Stockholm~Helsinki~Kopenhagen~Brüssel~Dublin~London~Moskau~Tokio~Peking~Kairo~Ottawa~Berlin~Canberra~Ankara',
    composers: 'Johann Sebastian Bach~Wolfgang Amadeus Mozart~Ludwig van Beethoven~Johannes Brahms~Franz Schubert~Joseph Haydn~Georg Friedrich Händel~Richard Wagner~Giuseppe Verdi~Antonio Vivaldi~Frédéric Chopin~Robert Schumann~Peter Tschaikowski',
    authors: 'Johann Wolfgang von Goethe~Friedrich Schiller~Gotthold Ephraim Lessing~Franz Kafka~Bertolt Brecht~Heinrich Heine~Theodor Fontane~Hermann Hesse~Erich Kästner~Heinrich Böll~Günter Grass~Heinrich von Kleist~Georg Büchner~Theodor Storm',
    painters: 'Leonardo da Vinci~Michelangelo~Raffael~Rembrandt~Vincent van Gogh~Pablo Picasso~Albrecht Dürer~Claude Monet~Salvador Dalí~Edvard Munch~Gustav Klimt~Paul Cézanne~Henri Matisse~Caspar David Friedrich',
    scientists: 'Albert Einstein~Isaac Newton~Galileo Galilei~Johannes Kepler~Charles Darwin~Marie Curie~Max Planck~Niels Bohr~Werner Heisenberg~Wilhelm Conrad Röntgen~Louis Pasteur~Robert Koch',
  };
  const KNOW_RAW = `
Geographie|1|Wie heißt die Hauptstadt von Frankreich?|Paris|@capitals
Geographie|1|Wie heißt die Hauptstadt von Italien?|Rom|@capitals
Geographie|1|Wie heißt die Hauptstadt von Spanien?|Madrid|@capitals
Geographie|1|Wie heißt die Hauptstadt von Österreich?|Wien|@capitals
Geographie|1|Wie heißt die Hauptstadt der Schweiz?|Bern|Zürich~Genf~Basel~Luzern~Lausanne~St. Gallen
Geographie|1|Wie heißt die Hauptstadt von Schweden?|Stockholm|@capitals
Geographie|1|Wie heißt die Hauptstadt von Japan?|Tokio|@capitals
Geographie|1|Wie heißt die Hauptstadt von Ägypten?|Kairo|@capitals
Geographie|2|Wie heißt die Hauptstadt von Polen?|Warschau|@capitals
Geographie|2|Wie heißt die Hauptstadt von Portugal?|Lissabon|@capitals
Geographie|2|Wie heißt die Hauptstadt von Griechenland?|Athen|@capitals
Geographie|2|Wie heißt die Hauptstadt von Norwegen?|Oslo|@capitals
Geographie|2|Wie heißt die Hauptstadt von Ungarn?|Budapest|@capitals
Geographie|2|Wie heißt die Hauptstadt von Kanada?|Ottawa|Toronto~Montreal~Vancouver~Québec~Calgary~Winnipeg
Geographie|2|Wie heißt die Hauptstadt von Australien?|Canberra|Sydney~Melbourne~Brisbane~Perth~Adelaide~Auckland
Geographie|2|Wie heißt die Hauptstadt von Brasilien?|Brasília|Rio de Janeiro~São Paulo~Salvador~Buenos Aires~Lima~Santiago
Geographie|2|Wie heißt die Hauptstadt der Türkei?|Ankara|Istanbul~Izmir~Bursa~Antalya~Konya~Adana
Geographie|2|In welchem Land liegt die Hauptstadt Lima?|Peru|Chile~Bolivien~Kolumbien~Ecuador~Argentinien~Brasilien
Geographie|2|Zu welchem Land gehört die Hauptstadt Nairobi?|Kenia|Tansania~Uganda~Äthiopien~Somalia~Sudan~Ägypten
Geographie|2|Zu welchem Land gehört die Hauptstadt Bangkok?|Thailand|Vietnam~Laos~Kambodscha~Myanmar~Malaysia~Indonesien
Geographie|1|Welcher Fluss fließt durch Wien?|Donau|Rhein~Elbe~Inn~Moldau~Oder~Isar
Geographie|1|Durch welche Hauptstadt fließt die Seine?|Paris|Rom~Madrid~Wien~London~Berlin~Prag
Geographie|1|Welcher ist der höchste Berg der Erde?|Mount Everest|K2~Kilimandscharo~Mont Blanc~Matterhorn~Aconcagua~Zugspitze
Geographie|1|Welcher Berg ist der höchste Deutschlands?|Zugspitze|Watzmann~Feldberg~Brocken~Fichtelberg~Hochkönig~Großglockner
Geographie|2|Welcher Berg ist der höchste Österreichs?|Großglockner|Zugspitze~Wildspitze~Watzmann~Matterhorn~Mont Blanc~Dachstein
Geographie|2|Wie heißt der höchste Berg der Alpen?|Mont Blanc|Matterhorn~Zugspitze~Großglockner~Eiger~Monte Rosa~Piz Bernina
Geographie|1|Welcher ist der größte Ozean der Erde?|Pazifik|Atlantik~Indischer Ozean~Arktischer Ozean~Nordsee~Mittelmeer~Karibik
Geographie|1|Welcher Kontinent ist der flächenmäßig größte?|Asien|Afrika~Europa~Nordamerika~Südamerika~Australien~Antarktis
Geographie|1|Welcher Kontinent ist der kleinste?|Australien|Europa~Antarktis~Südamerika~Afrika~Asien~Nordamerika
Geographie|1|Auf welchem Kontinent liegt Brasilien?|Südamerika|Nordamerika~Afrika~Asien~Europa~Australien~Antarktis
Geographie|1|Wie viele Bundesländer hat Deutschland?|16|12~14~15~17~18~10
Geographie|2|Wie viele Bundesländer hat Österreich?|9|7~8~10~12~16~6
Geographie|2|Wie viele Kantone hat die Schweiz?|26|20~22~24~25~27~30
Geographie|1|Wie heißt die Hauptstadt des Bundeslandes Bayern?|München|Nürnberg~Augsburg~Regensburg~Würzburg~Stuttgart~Ingolstadt
Geographie|2|Wie heißt die Hauptstadt von Nordrhein-Westfalen?|Düsseldorf|Köln~Dortmund~Essen~Münster~Bonn~Duisburg
Geographie|2|Wie heißt die Hauptstadt von Baden-Württemberg?|Stuttgart|Karlsruhe~Mannheim~Freiburg~Heidelberg~Ulm~Konstanz
Geographie|2|Wie heißt die Hauptstadt von Sachsen?|Dresden|Leipzig~Chemnitz~Görlitz~Zwickau~Bautzen~Plauen
Geographie|2|Wie heißt die Hauptstadt von Niedersachsen?|Hannover|Braunschweig~Göttingen~Oldenburg~Osnabrück~Hildesheim~Wolfsburg
Geographie|3|Wie heißt die Hauptstadt von Hessen?|Wiesbaden|Frankfurt am Main~Kassel~Darmstadt~Offenbach~Fulda~Gießen
Geographie|3|Wie heißt die Hauptstadt von Rheinland-Pfalz?|Mainz|Koblenz~Trier~Ludwigshafen~Kaiserslautern~Worms~Speyer
Geographie|1|Welches Meer liegt zwischen Südeuropa und Nordafrika?|Mittelmeer|Nordsee~Ostsee~Schwarzes Meer~Rotes Meer~Karibik~Arabisches Meer
Geographie|1|Welches ist flächenmäßig das größte Land der Erde?|Russland|Kanada~China~USA~Brasilien~Australien~Indien
Geographie|2|Welches ist der kleinste Staat der Erde?|Vatikanstadt|Monaco~San Marino~Liechtenstein~Malta~Andorra~Luxemburg
Geographie|1|Welcher See grenzt an Deutschland, Österreich und die Schweiz?|Bodensee|Chiemsee~Müritz~Genfer See~Gardasee~Neusiedler See~Starnberger See
Geographie|3|Zu welchem Land gehört die Atlantikinsel Madeira?|Portugal|Spanien~Italien~Frankreich~Griechenland~Marokko~Brasilien
Geographie|3|In welchem Land liegt der Kilimandscharo?|Tansania|Kenia~Uganda~Äthiopien~Südafrika~Sambia~Ruanda
Geographie|3|Welcher Fluss ist der längste Europas?|Wolga|Donau~Rhein~Elbe~Dnepr~Don~Ural
Geographie|2|In welches Meer mündet der Nil?|Mittelmeer|Rotes Meer~Schwarzes Meer~Atlantik~Arabisches Meer~Persischer Golf~Ostsee
Geschichte|1|In welchem Jahr fiel die Berliner Mauer?|1989|1961~1987~1990~1991~1985~1979
Geschichte|1|In welchem Jahr wurde Deutschland wiedervereinigt?|1990|1989~1991~1988~1992~1985~1987
Geschichte|2|In welchem Jahr wurde die Berliner Mauer gebaut?|1961|1949~1953~1956~1968~1971~1948
Geschichte|1|In welchem Jahr begann der Erste Weltkrieg?|1914|1912~1916~1918~1939~1905~1871
Geschichte|1|In welchem Jahr endete der Zweite Weltkrieg in Europa?|1945|1944~1946~1939~1918~1949~1941
Geschichte|1|In welchem Jahr begann der Zweite Weltkrieg?|1939|1933~1938~1941~1914~1945~1936
Geschichte|1|In welchem Jahr erreichte Kolumbus Amerika?|1492|1066~1415~1517~1588~1618~1789
Geschichte|1|In welchem Jahr begann die Französische Revolution?|1789|1776~1799~1815~1848~1870~1688
Geschichte|2|In welchem Jahr schlug Martin Luther der Überlieferung nach seine Thesen an?|1517|1453~1492~1555~1618~1648~1789
Geschichte|3|In welchem Jahr endete der Dreißigjährige Krieg?|1648|1555~1618~1713~1789~1815~1871
Geschichte|3|In welchem Jahr wurde das Deutsche Kaiserreich gegründet?|1871|1848~1866~1888~1914~1815~1918
Geschichte|2|In welchem Jahr wurde die Bundesrepublik Deutschland gegründet?|1949|1945~1948~1953~1955~1961~1990
Geschichte|1|Wer war der erste Bundeskanzler der Bundesrepublik Deutschland?|Konrad Adenauer|Willy Brandt~Helmut Schmidt~Ludwig Erhard~Helmut Kohl~Kurt Georg Kiesinger~Theodor Heuss
Geschichte|1|Wer erreichte 1492 im Auftrag Spaniens Amerika?|Christoph Kolumbus|Vasco da Gama~Marco Polo~Ferdinand Magellan~James Cook~Hernán Cortés~Francis Drake
Geschichte|1|Welches Volk baute die Pyramiden von Gizeh?|Ägypter|Römer~Griechen~Perser~Babylonier~Phönizier~Hethiter
Geschichte|2|Welcher römische Feldherr überschritt 49 v. Chr. den Rubikon?|Julius Caesar|Augustus~Nero~Hannibal~Cicero~Marc Aurel~Pompeius
Geschichte|1|Welche Stadt war das Zentrum des Römischen Reiches?|Rom|Athen~Paris~Madrid~Berlin~Wien~Prag
Geschichte|2|Welche Schlacht beendete 1815 endgültig die Herrschaft Napoleons?|Waterloo|Austerlitz~Trafalgar~Verdun~Sedan~Jena~Stalingrad
Geschichte|1|Wer war der erste Präsident der Vereinigten Staaten?|George Washington|Abraham Lincoln~Thomas Jefferson~Benjamin Franklin~John Adams~Theodore Roosevelt~Ulysses S. Grant
Geschichte|2|In welchem Jahr wurde die Unabhängigkeit der USA erklärt?|1776|1492~1620~1789~1812~1861~1865
Geschichte|1|In welchem Jahr landeten die ersten Menschen auf dem Mond?|1969|1957~1961~1965~1972~1975~1981
Geschichte|1|Wer betrat als erster Mensch den Mond?|Neil Armstrong|Buzz Aldrin~Juri Gagarin~John Glenn~Alan Shepard~Michael Collins~Sergei Koroljow
Geschichte|2|Wer war der erste Mensch im Weltall?|Juri Gagarin|Neil Armstrong~Alan Shepard~John Glenn~Buzz Aldrin~Sergei Koroljow~Michael Collins
Geschichte|1|Wer erfand um 1450 in Europa den Buchdruck mit beweglichen Lettern?|Johannes Gutenberg|Albrecht Dürer~Martin Luther~Konrad Zuse~Carl Benz~Johannes Kepler~Philipp Melanchthon
Geschichte|2|In welchem Jahr sank die Titanic?|1912|1905~1908~1914~1918~1920~1898
Geschichte|2|Welche Epoche folgt in der Geschichte auf das Mittelalter?|Neuzeit|Antike~Steinzeit~Bronzezeit~Eisenzeit~Urzeit~Frühzeit
Geschichte|2|Wer krönte sich 1804 selbst zum Kaiser der Franzosen?|Napoleon Bonaparte|Ludwig XIV.~Karl der Große~Wilhelm I.~Franz Joseph I.~Friedrich der Große~Ludwig XVI.
Geschichte|3|In welchem Jahr wurde Karl der Große zum Kaiser gekrönt?|800|476~962~1066~1000~768~1215
Geschichte|2|Wer war der erste Reichskanzler des Deutschen Kaiserreichs?|Otto von Bismarck|Bernhard von Bülow~Theobald von Bethmann Hollweg~Gustav Stresemann~Paul von Hindenburg~Leo von Caprivi~Friedrich Ebert
Geschichte|3|In welchem Jahr wurde Julius Caesar ermordet?|44 v. Chr.|100 v. Chr.~31 v. Chr.~27 v. Chr.~476 n. Chr.~44 n. Chr.~79 n. Chr.
Geschichte|3|In welchem Jahr gilt das Weströmische Reich traditionell als untergegangen?|476 n. Chr.|410 n. Chr.~330 n. Chr.~800 n. Chr.~1066 n. Chr.~27 v. Chr.~44 v. Chr.
Natur|1|Wie viele Beine hat ein Insekt?|6|4~8~10~2~12~14
Natur|1|Wie viele Beine hat eine Spinne?|8|6~4~10~12~2~14
Natur|1|Welches Landtier ist das schwerste?|Elefant|Nashorn~Giraffe~Flusspferd~Bär~Büffel~Löwe
Natur|1|Welches ist das schnellste Landtier?|Gepard|Löwe~Pferd~Leopard~Wolf~Strauß~Zebra
Natur|1|Welches ist das größte Tier der Erde?|Blauwal|Elefant~Pottwal~Walhai~Riesenkalmar~Giraffe~Orca
Natur|1|Welches Organ pumpt das Blut durch den Körper?|Herz|Lunge~Leber~Niere~Magen~Gehirn~Milz
Natur|2|Wie viele Zähne hat ein erwachsener Mensch mit Weisheitszähnen?|32|28~30~34~36~24~20
Natur|2|Welches Gas nehmen Pflanzen für die Fotosynthese auf?|Kohlenstoffdioxid|Stickstoff~Wasserstoff~Helium~Methan~Argon~Ammoniak
Natur|2|Welcher Stoff gibt Blättern ihre grüne Farbe?|Chlorophyll|Hämoglobin~Melanin~Karotin~Keratin~Insulin~Kollagen
Natur|2|Welcher Bestandteil des Blutes transportiert den Sauerstoff?|Rote Blutkörperchen|Weiße Blutkörperchen~Blutplättchen~Lymphe~Galle~Speichel~Urin
Natur|3|Wie viele Knochen hat ein erwachsener Mensch ungefähr?|206|106~150~250~300~412~180
Natur|2|Welcher ist der größte Knochen des Menschen?|Oberschenkelknochen|Schienbein~Wadenbein~Oberarmknochen~Speiche~Elle~Schlüsselbein
Natur|2|Welches ist das größte Organ des Menschen?|Haut|Leber~Lunge~Gehirn~Herz~Magen~Niere
Natur|1|Wie nennt man Tiere, die sowohl Pflanzen als auch Fleisch fressen?|Allesfresser|Pflanzenfresser~Fleischfresser~Insektenfresser~Aasfresser~Parasiten~Räuber
Natur|3|Welches Säugetier legt Eier?|Schnabeltier|Delfin~Fledermaus~Igel~Känguru~Wal~Seehund
Natur|2|Wovon ernähren sich Koalas fast ausschließlich?|Eukalyptusblätter|Bambus~Bananen~Gras~Insekten~Fisch~Beeren
Natur|1|Wovon ernähren sich Große Pandas fast ausschließlich?|Bambus|Eukalyptus~Gras~Fisch~Honig~Insekten~Beeren
Natur|2|Wie nennt man die Verwandlung einer Raupe zum Schmetterling?|Metamorphose|Fotosynthese~Evolution~Mutation~Häutung~Symbiose~Verdauung
Natur|2|Zu welcher Tiergruppe gehört der Frosch?|Amphibien|Reptilien~Fische~Säugetiere~Vögel~Insekten~Weichtiere
Natur|2|Welches Säugetier kann als einziges aktiv fliegen?|Fledermaus|Eichhörnchen~Igel~Maus~Marder~Fuchs~Siebenschläfer
Natur|2|Wie heißt die Lehre von den Tieren?|Zoologie|Botanik~Geologie~Ökologie~Anatomie~Meteorologie~Astronomie
Natur|2|Wie heißt die Lehre von den Pflanzen?|Botanik|Zoologie~Geologie~Meteorologie~Astronomie~Anatomie~Chemie
Natur|2|Welches Vitamin bildet der Körper unter Einfluss von Sonnenlicht?|Vitamin D|Vitamin A~Vitamin B12~Vitamin C~Vitamin E~Vitamin K~Vitamin B1
Natur|3|Wie lange dauert die Tragzeit eines Elefanten ungefähr?|22 Monate|3 Monate~6 Monate~9 Monate~12 Monate~4 Jahre~5 Jahre
Physik|1|Wie lautet die chemische Formel von Wasser?|H₂O|CO₂~O₂~NaCl~H₂O₂~NH₃~CH₄
Physik|2|Welches chemische Symbol hat Gold?|Au|Ag~Go~Gd~Fe~Pb~Cu
Physik|2|Welches chemische Symbol hat Silber?|Ag|Au~Si~S~Sb~Sn~Zn
Physik|2|Welches chemische Symbol hat Eisen?|Fe|Ei~Ir~F~Es~Fr~Fm
Physik|3|Welches chemische Symbol hat Natrium?|Na|N~Ne~Ni~Nb~Nd~Np
Physik|3|Welches chemische Symbol hat Kalium?|K|Ka~Ca~Kr~Ku~P~Pt
Physik|1|Welches chemische Symbol hat Sauerstoff?|O|H~C~N~S~P~Fe
Physik|1|Bei wie viel Grad Celsius gefriert Wasser unter Normaldruck?|0 °C|−10 °C~4 °C~10 °C~32 °C~100 °C~−273 °C
Physik|1|Bei wie viel Grad Celsius siedet Wasser unter Normaldruck?|100 °C|90 °C~80 °C~120 °C~212 °C~50 °C~150 °C
Physik|2|Wie groß ist die Lichtgeschwindigkeit ungefähr?|300 000 km/s|3 000 km/s~30 000 km/s~3 000 000 km/s~340 km/s~1 000 km/s~30 km/s
Physik|2|Wie schnell breitet sich Schall in Luft ungefähr aus?|340 m/s|34 m/s~3 400 m/s~300 000 m/s~34 000 m/s~100 m/s~30 m/s
Physik|2|Welche Teilchen tragen eine negative elektrische Ladung?|Elektronen|Protonen~Neutronen~Photonen~Neutrinos~Atomkerne~Positronen
Physik|2|In welcher Einheit wird die elektrische Spannung gemessen?|Volt|Ampere~Ohm~Watt~Joule~Newton~Hertz
Physik|2|In welcher Einheit wird die Kraft gemessen?|Newton|Joule~Watt~Pascal~Hertz~Volt~Kelvin
Physik|2|In welcher Einheit wird die Frequenz gemessen?|Hertz|Watt~Volt~Ohm~Pascal~Joule~Tesla
Physik|2|In welcher Einheit wird die Leistung gemessen?|Watt|Volt~Joule~Newton~Pascal~Ohm~Hertz
Physik|3|In welcher Einheit wird der Druck gemessen?|Pascal|Newton~Joule~Watt~Hertz~Tesla~Ohm
Physik|2|Welches Gas macht den größten Teil der Erdatmosphäre aus?|Stickstoff|Sauerstoff~Kohlenstoffdioxid~Argon~Wasserstoff~Helium~Methan
Physik|2|Welches Element hat die Ordnungszahl 1?|Wasserstoff|Helium~Sauerstoff~Kohlenstoff~Stickstoff~Lithium~Eisen
Physik|2|Welches der folgenden Elemente ist ein Edelgas?|Neon|Sauerstoff~Stickstoff~Wasserstoff~Chlor~Eisen~Kohlenstoff
Physik|2|Welches Metall ist bei Zimmertemperatur flüssig?|Quecksilber|Blei~Zinn~Zink~Aluminium~Kupfer~Eisen
Physik|1|Welches ist das härteste natürliche Material?|Diamant|Quarz~Stahl~Granit~Eisen~Titan~Glas
Physik|2|Wie nennt man den Übergang von flüssig zu gasförmig?|Verdampfen|Schmelzen~Erstarren~Kondensieren~Sublimieren~Gefrieren~Lösen
Physik|1|Wie nennt man den Übergang von fest zu flüssig?|Schmelzen|Erstarren~Verdampfen~Kondensieren~Gefrieren~Sublimieren~Verdunsten
Physik|1|Welche Kraft hält die Planeten auf ihren Bahnen um die Sonne?|Gravitation|Magnetismus~Reibung~Auftrieb~Windkraft~Elektrizität~Spannung
Physik|1|Wer formulierte das Gravitationsgesetz?|Isaac Newton|Albert Einstein~Galileo Galilei~Johannes Kepler~Niels Bohr~Max Planck~Marie Curie
Physik|1|Wer entwickelte die Relativitätstheorie?|Albert Einstein|@scientists
Physik|2|Welchen pH-Wert hat neutrales Wasser?|7|1~3~5~9~10~14
Physik|2|Aus welchen Elementen besteht Kochsalz (Natriumchlorid)?|Natrium und Chlor|Natrium und Fluor~Kalium und Chlor~Calcium und Chlor~Natrium und Sauerstoff~Magnesium und Chlor~Kalium und Jod
Physik|1|Wie viele Planeten hat unser Sonnensystem?|8|7~9~10~11~12~6
Physik|1|Welcher Planet ist der Sonne am nächsten?|Merkur|Venus~Erde~Mars~Jupiter~Saturn~Neptun
Physik|1|Welcher Planet ist der größte unseres Sonnensystems?|Jupiter|Saturn~Erde~Neptun~Uranus~Mars~Venus
Physik|1|Welcher Planet wird „Roter Planet“ genannt?|Mars|Merkur~Venus~Jupiter~Saturn~Neptun~Uranus
Physik|1|Welcher Planet ist für sein auffälliges Ringsystem bekannt?|Saturn|Merkur~Venus~Erde~Mars~Pluto~Ceres
Physik|3|Wie lange braucht das Sonnenlicht ungefähr bis zur Erde?|8 Minuten|8 Sekunden~80 Sekunden~30 Minuten~8 Stunden~24 Stunden~1 Woche
Physik|1|Was misst ein Thermometer?|Temperatur|Luftdruck~Windstärke~Luftfeuchtigkeit~Niederschlag~Geschwindigkeit~Gewicht
Physik|2|Was misst ein Barometer?|Luftdruck|Temperatur~Luftfeuchtigkeit~Windgeschwindigkeit~Niederschlagsmenge~Sonnenscheindauer~Lautstärke
Physik|3|Welches Metall wird traditionell für den Glühfaden von Glühlampen verwendet?|Wolfram|Kupfer~Eisen~Aluminium~Blei~Zinn~Gold
Physik|3|Für welches Element steht das chemische Symbol Pb?|Blei|Platin~Phosphor~Zinn~Silber~Kupfer~Quecksilber
Mathematik|1|Wie viel ist 7 × 8?|56|54~48~63~64~58~49
Mathematik|1|Wie viel Grad hat ein rechter Winkel?|90°|45°~60°~100°~180°~360°~120°
Mathematik|1|Wie groß ist die Winkelsumme in einem Dreieck?|180°|90°~270°~360°~120°~100°~540°
Mathematik|1|Wie viele Ecken hat ein Sechseck?|6|5~7~8~4~12~10
Mathematik|1|Wie viel ist die Quadratwurzel aus 144?|12|11~13~14~16~72~24
Mathematik|1|Welche dieser Zahlen ist eine Primzahl?|17|15~21~27~33~39~51
Mathematik|2|Welche Primzahl ist gerade?|2|4~6~8~1~0~10
Mathematik|1|Wie viele Sekunden hat eine Stunde?|3600|360~600~1200~6000~3000~7200
Mathematik|2|Wie viele Minuten hat ein Tag?|1440|1200~1240~1400~2400~1640~1000
Mathematik|2|Wie viel sind 15 % von 200?|30|15~20~25~35~40~45
Mathematik|2|Wie lautet die Formel für den Umfang eines Kreises?|2 · π · r|π · r²~2 · r²~π · r~4 · π · r²~π · d²~π + r
Mathematik|2|Wie lautet die Formel für die Fläche eines Kreises?|π · r²|2 · π · r~π · d~2 · r²~π · r~4 · π · r²~π + r²
Mathematik|2|Welche Zahl stellt die römische Zahl XIV dar?|14|16~4~24~11~15~9
Mathematik|2|Welche Zahl stellt die römische Zahl C dar?|100|50~500~1000~10~5~200
Mathematik|3|Welche Zahl stellt die römische Zahl D dar?|500|50~100~1000~5~5000~10
Mathematik|1|Wie lautet die Zahl π auf zwei Nachkommastellen gerundet?|3,14|2,72~1,41~1,62~3,41~4,13~6,28
Mathematik|1|Wie viele Nullen hat eine Million?|6|3~4~5~7~9~12
Mathematik|2|Wie viele Nullen hat eine Milliarde?|9|6~7~8~10~12~15
Mathematik|3|Wie viele Nullen hat eine Billion?|12|9~10~15~18~6~21
Mathematik|2|Wie viele Ecken hat ein Würfel?|8|6~4~12~10~14~16
Mathematik|2|Wie viele Kanten hat ein Würfel?|12|6~8~10~14~16~24
Mathematik|1|Wie viele Flächen hat ein Würfel?|6|4~8~12~10~14~5
Mathematik|2|Wie geht die Folge 1, 1, 2, 3, 5, 8 weiter?|13|11~12~14~15~16~10
Mathematik|2|Wie viel ist 2 hoch 10?|1024|1000~512~2048~1020~100~2024
Mathematik|1|Wie viel ist 3 hoch 4?|81|12~64~27~72~243~7
Mathematik|2|Wie groß ist die Winkelsumme in einem Viereck?|360°|180°~270°~540°~720°~90°~400°
Mathematik|1|Welcher Bruch entspricht der Dezimalzahl 0,25?|1/4|1/2~1/3~2/5~1/5~3/4~1/8
Mathematik|1|Löse 3x + 5 = 20. Wie groß ist x?|5|3~4~6~7~8~10
Mathematik|2|Wie viele Diagonalen hat ein Quadrat?|2|1~3~4~0~6~8
Mathematik|2|Was ist das kleinste gemeinsame Vielfache von 4 und 6?|12|24~10~8~18~2~36
Mathematik|2|Was ist der größte gemeinsame Teiler von 12 und 18?|6|3~2~9~12~36~1
Mathematik|1|Wie viel Grad hat ein Vollkreis?|360°|180°~90°~270°~100°~400°~720°
Mathematik|2|Wie groß ist der Mittelwert der Zahlen 2, 4 und 9?|5|4~6~7~9~3~15
Mathematik|2|Wie nennt man das Ergebnis einer Division?|Quotient|Produkt~Summe~Differenz~Potenz~Divisor~Faktor
Mathematik|1|Wie nennt man das Ergebnis einer Multiplikation?|Produkt|Summe~Differenz~Quotient~Faktor~Potenz~Rest
Mathematik|2|Wie nennt man Zahlen, die nur durch 1 und durch sich selbst teilbar sind?|Primzahlen|Quadratzahlen~Kubikzahlen~Brüche~gerade Zahlen~Dezimalzahlen~Ganzzahlen
Kultur|1|Wer schrieb das Drama „Faust“?|Johann Wolfgang von Goethe|@authors
Kultur|2|Wer schrieb das Drama „Die Räuber“?|Friedrich Schiller|@authors
Kultur|2|Wer schrieb die Erzählung „Die Verwandlung“?|Franz Kafka|@authors
Kultur|2|Wer schrieb „Die Dreigroschenoper“ (Text)?|Bertolt Brecht|@authors
Kultur|3|Wer schrieb den Roman „Der Steppenwolf“?|Hermann Hesse|@authors
Kultur|2|Wer schrieb den Roman „Buddenbrooks“?|Thomas Mann|Hermann Hesse~Günter Grass~Theodor Fontane~Robert Musil~Stefan Zweig~Heinrich Böll
Kultur|3|Wer schrieb den Roman „Effi Briest“?|Theodor Fontane|@authors
Kultur|3|Wer schrieb den Roman „Die Blechtrommel“?|Günter Grass|Heinrich Böll~Siegfried Lenz~Martin Walser~Uwe Johnson~Max Frisch~Peter Handke
Kultur|1|Wer schrieb „Romeo und Julia“?|William Shakespeare|Charles Dickens~Oscar Wilde~Jane Austen~Christopher Marlowe~Lord Byron~John Milton
Kultur|2|Wer schrieb den Roman „Don Quijote“?|Miguel de Cervantes|Lope de Vega~Dante Alighieri~Molière~Voltaire~Victor Hugo~Gabriel García Márquez
Kultur|3|Wer schrieb „Die Göttliche Komödie“?|Dante Alighieri|Petrarca~Boccaccio~Homer~Vergil~William Shakespeare~Miguel de Cervantes
Kultur|2|Wer gilt als Verfasser der „Ilias“?|Homer|Vergil~Sophokles~Platon~Aristoteles~Ovid~Herodot
Kultur|2|Wer schrieb „Der kleine Prinz“?|Antoine de Saint-Exupéry|Victor Hugo~Albert Camus~Jules Verne~Alexandre Dumas~Molière~Voltaire
Kultur|1|Wer schrieb die Romane über „Harry Potter“?|J. K. Rowling|Astrid Lindgren~Michael Ende~Roald Dahl~Cornelia Funke~J. R. R. Tolkien~Lewis Carroll
Kultur|2|Wer schrieb „Die unendliche Geschichte“?|Michael Ende|Otfried Preußler~Astrid Lindgren~Erich Kästner~Cornelia Funke~Wilhelm Busch~Janosch
Kultur|1|Wer schrieb „Pippi Langstrumpf“?|Astrid Lindgren|Michael Ende~Erich Kästner~Otfried Preußler~Roald Dahl~Cornelia Funke~Janosch
Kultur|2|Wer schrieb „Max und Moritz“?|Wilhelm Busch|Erich Kästner~Heinrich Hoffmann~Michael Ende~Janosch~Otfried Preußler~Christian Morgenstern
Kultur|3|Wer schrieb den „Struwwelpeter“?|Heinrich Hoffmann|Wilhelm Busch~Erich Kästner~Michael Ende~Janosch~Otfried Preußler~Christian Morgenstern
Kultur|1|Wer malte die „Mona Lisa“?|Leonardo da Vinci|@painters
Kultur|2|Wer malte 1889 die „Sternennacht“ (Saint-Rémy)?|Vincent van Gogh|@painters
Kultur|3|Wer malte „Der Schrei“?|Edvard Munch|@painters
Kultur|2|Wer malte „Guernica“?|Pablo Picasso|@painters
Kultur|3|Wer schuf die Marmorstatue „David“ in Florenz (um 1504)?|Michelangelo|Leonardo da Vinci~Raffael~Auguste Rodin~Albrecht Dürer~Antonio Canova~Gian Lorenzo Bernini
Kultur|2|In welcher Stadt wurde Mozart geboren?|Salzburg|Wien~Linz~Graz~Innsbruck~Prag~Augsburg
Kultur|2|In welcher Stadt wurde Beethoven geboren?|Bonn|Wien~Köln~Hamburg~Leipzig~Salzburg~Düsseldorf
Kultur|1|Wer komponierte die Oper „Die Zauberflöte“?|Wolfgang Amadeus Mozart|@composers
Kultur|1|Wer komponierte die Neunte Sinfonie mit der „Ode an die Freude“?|Ludwig van Beethoven|@composers
Kultur|2|Wer komponierte die Violinkonzerte „Die vier Jahreszeiten“?|Antonio Vivaldi|@composers
Kultur|2|Wer komponierte „Der Ring des Nibelungen“?|Richard Wagner|@composers
Kultur|2|Wer komponierte die „Brandenburgischen Konzerte“?|Johann Sebastian Bach|@composers
Kultur|2|Wie viele Saiten hat eine Geige?|4|3~5~6~7~8~12
Kultur|2|Wie viele Saiten hat eine klassische Gitarre?|6|4~5~7~8~10~12
Kultur|3|Wie viele Tasten hat ein modernes Standardklavier?|88|76~84~92~96~100~66
Kultur|1|Wie viele Linien hat ein Notensystem?|5|3~4~6~7~8~10
Kultur|2|Welches Instrument gehört zu den Holzblasinstrumenten?|Klarinette|Trompete~Posaune~Tuba~Horn~Geige~Trommel
Kultur|3|Welches berühmte Opernhaus steht in Mailand?|Teatro alla Scala|Semperoper~Metropolitan Opera~Wiener Staatsoper~Covent Garden~Palais Garnier~Teatro Colón
Sprache|1|Welcher Artikel gehört zu „Mädchen“?|das|der~die~ein~eine~den~dem
Sprache|1|Welche Wortart ist das Wort „Tisch“?|Nomen|Verb~Adjektiv~Artikel~Pronomen~Präposition~Adverb
Sprache|1|Wie nennt man ein Wort mit gleicher oder ähnlicher Bedeutung?|Synonym|Antonym~Homonym~Akronym~Pseudonym~Anagramm~Palindrom
Sprache|1|Wie nennt man ein Wort mit gegensätzlicher Bedeutung?|Antonym|Synonym~Homonym~Akronym~Pseudonym~Anagramm~Palindrom
Sprache|2|Welches dieser Wörter ist ein Palindrom?|Otto|Tisch~Rose~Hund~Wasser~Garten~Mutter
Sprache|2|Welcher Fall steht nach der Präposition „mit“?|Dativ|Nominativ~Akkusativ~Genitiv~Vokativ~Ablativ~Lokativ
Sprache|2|Welcher Fall steht nach der Präposition „für“?|Akkusativ|Nominativ~Dativ~Genitiv~Vokativ~Ablativ~Instrumental
Sprache|2|In welcher Zeitform steht „Ich bin gegangen“?|Perfekt|Präsens~Präteritum~Plusquamperfekt~Futur I~Futur II~Imperativ
Sprache|2|In welcher Zeitform steht „Er hatte gegessen“?|Plusquamperfekt|Präsens~Präteritum~Perfekt~Futur I~Futur II~Imperativ
Sprache|2|Wie viele Buchstaben hat das Grundalphabet der deutschen Sprache (ohne Umlaute und ß)?|26|24~27~28~29~30~32
Sprache|1|Welche Sprache spricht man in Brasilien?|Portugiesisch|Spanisch~Englisch~Französisch~Italienisch~Niederländisch~Brasilianisch
Sprache|3|Welche Sprache hat die meisten Muttersprachler?|Chinesisch (Mandarin)|Englisch~Spanisch~Hindi~Arabisch~Portugiesisch~Russisch
Sprache|2|Welche Schrift wird in Russland verwendet?|Kyrillisch|Lateinisch~Griechisch~Arabisch~Hebräisch~Hangul~Devanagari
Sprache|2|Wie heißt die Lehre vom richtigen Schreiben?|Orthografie|Grammatik~Etymologie~Semantik~Syntax~Phonetik~Stilistik
Sprache|3|Wie heißt die Lehre vom Satzbau?|Syntax|Semantik~Morphologie~Phonetik~Etymologie~Lexikografie~Stilistik
Sprache|3|Wie nennt man gleich lautende Wörter mit verschiedener Bedeutung, etwa „Bank“ (Sitzgelegenheit und Geldinstitut)?|Homonyme|Synonyme~Antonyme~Akronyme~Anagramme~Palindrome~Pseudonyme
Sprache|1|Was bedeutet die Abkürzung „z. B.“?|zum Beispiel|zum Bahnhof~zur Beratung~zum Besuch~zum Beginn~zur Bank~zum Beitrag
Sprache|1|Was bedeutet die Abkürzung „usw.“?|und so weiter|und sonst wie~und so wahr~unser Satz~und sehr wichtig~ungefähr so wie~und sonstige Wörter
Sprache|2|Was bedeutet die Abkürzung „bzw.“?|beziehungsweise|bezüglich~bestimmt~bisweilen~bezogen~beinahe~bekanntlich
Politik|1|In welcher Stadt hat der Deutsche Bundestag seinen Sitz?|Berlin|Bonn~Frankfurt am Main~München~Hamburg~Köln~Karlsruhe
Politik|2|In welcher Stadt hat das Bundesverfassungsgericht seinen Sitz?|Karlsruhe|Berlin~Bonn~Frankfurt am Main~Leipzig~Kassel~Stuttgart
Politik|3|Wer wählt den Bundespräsidenten der Bundesrepublik Deutschland?|Die Bundesversammlung|Der Bundestag~Der Bundesrat~Das Volk~Der Bundeskanzler~Das Bundesverfassungsgericht~Die Bundesregierung
Politik|1|Wie heißt das Parlament der Bundesrepublik Deutschland?|Bundestag|Bundesrat~Landtag~Bundesversammlung~Volkskammer~Senat~Reichstag
Politik|2|Wie lange dauert eine Wahlperiode des Deutschen Bundestages?|4 Jahre|2 Jahre~3 Jahre~5 Jahre~6 Jahre~7 Jahre~8 Jahre
Politik|2|Ab welchem Alter darf man in Deutschland den Bundestag wählen?|18 Jahre|14 Jahre~16 Jahre~17 Jahre~19 Jahre~21 Jahre~25 Jahre
Politik|2|In welcher Stadt befindet sich der Hauptsitz der Vereinten Nationen?|New York|Genf~Wien~Paris~Brüssel~London~Washington
Politik|2|In welcher Stadt hat die Europäische Zentralbank ihren Sitz?|Frankfurt am Main|Brüssel~Straßburg~Luxemburg~Paris~Berlin~Wien
Politik|3|In welcher französischen Stadt hat das Europäische Parlament seinen offiziellen Sitz?|Straßburg|Paris~Lyon~Marseille~Lille~Nizza~Toulouse
Politik|3|Welche drei Gewalten unterscheidet man in einem Rechtsstaat klassisch?|Legislative, Exekutive, Judikative|Legislative, Exekutive, Opposition~Judikative, Exekutive, Presse~Parlament, Presse, Militär~Regierung, Opposition, Volk~Exekutive, Militär, Polizei~Legislative, Presse, Verwaltung
Politik|1|Welche Währung hatte Deutschland vor der Einführung des Euro?|D-Mark|Schilling~Franken~Lira~Gulden~Peseta~Pfund
Politik|1|Wie heißt die Währung der Schweiz?|Franken|Euro~Mark~Schilling~Krone~Pfund~Dollar
Politik|1|Wie heißt die Währung Japans?|Yen|Yuan~Won~Rupie~Dollar~Euro~Rubel
Politik|1|Wie heißt die Währung Großbritanniens?|Pfund|Euro~Dollar~Franken~Krone~Rupie~Mark
Politik|3|Wie viele ständige Mitglieder hat der UN-Sicherheitsrat?|5|3~4~6~7~10~15
Politik|3|In welcher Stadt hat der Internationale Gerichtshof der Vereinten Nationen seinen Sitz?|Den Haag|Genf~New York~Brüssel~Straßburg~Berlin~Wien
Politik|3|In welcher Stadt hat das Hauptquartier der NATO seinen Sitz?|Brüssel|Washington~London~Paris~Genf~Berlin~Wien
Politik|3|In welcher Stadt wird der Friedensnobelpreis verliehen?|Oslo|Stockholm~Kopenhagen~Genf~Helsinki~Berlin~Wien
Alltag|1|Wie viele Tage hat ein Schaltjahr?|366|365~364~367~360~372~355
Alltag|1|Wie viele Tage hat der Februar in einem Schaltjahr?|29|28~30~31~27~25~26
Alltag|2|Wie viele Monate eines Jahres haben 31 Tage?|7|4~5~6~8~9~3
Alltag|1|Wie viele Wochen hat ein Jahr ungefähr?|52|48~50~54~56~60~45
Alltag|1|Welche Farbe entsteht, wenn man Blau und Gelb mischt?|Grün|Orange~Violett~Braun~Rosa~Grau~Rot
Alltag|1|Welche Farbe entsteht, wenn man Rot und Blau mischt?|Violett|Grün~Orange~Braun~Grau~Gelb~Weiß
Alltag|1|Wie viele Spieler einer Mannschaft stehen beim Fußball gleichzeitig auf dem Feld?|11|9~10~12~7~8~15
Alltag|1|In welchem Abstand finden die Olympischen Sommerspiele normalerweise statt?|Alle vier Jahre|Jedes Jahr~Alle zwei Jahre~Alle drei Jahre~Alle fünf Jahre~Alle sechs Jahre~Alle zehn Jahre
Alltag|1|Welche Farbe hat ein Rubin?|Rot|Blau~Grün~Gelb~Schwarz~Weiß~Violett
Alltag|1|Wie viele Cent hat ein Euro?|100|10~50~1000~20~12~60
Alltag|1|Welcher Wochentag liegt zwischen Mittwoch und Freitag?|Donnerstag|Dienstag~Samstag~Sonntag~Montag~Mittwoch~Freitag
Alltag|2|Wie viele Buchstaben hat das Wort „Schmetterling“?|13|11~12~14~15~10~16
Alltag|1|Welches Land hat auf der Landkarte die Form eines Stiefels?|Italien|Spanien~Griechenland~Frankreich~Portugal~Kroatien~Norwegen
Alltag|2|Wie viele Karten hat ein Skatblatt?|32|52~36~48~40~24~54
Alltag|1|Wie viele Felder hat ein Schachbrett?|64|32~48~81~100~56~72
Alltag|2|Wie viele Figuren hat jeder Spieler zu Beginn einer Schachpartie?|16|8~12~14~15~18~20
Alltag|2|Wie groß ist die Augensumme zweier gegenüberliegender Seiten eines Standardwürfels?|7|6~8~9~10~5~12
Alltag|1|Wie lautet die europaweite Notrufnummer?|112|110~911~100~118~999~133
Alltag|1|In welcher Himmelsrichtung geht die Sonne auf?|Osten|Westen~Norden~Süden~Nordwesten~Südwesten~Nordosten
Alltag|1|Aus welchen Zutaten wird Bier traditionell gebraut?|Hopfen und Malz|Trauben und Hefe~Äpfel und Zucker~Reis und Salz~Mais und Honig~Kartoffeln und Pfeffer~Milch und Hopfen
Alltag|2|Wie nennt man die japanische Kunst des Papierfaltens?|Origami|Ikebana~Kalligrafie~Bonsai~Haiku~Manga~Karate
Alltag|3|Wie nennt man die japanische Kunst des Blumensteckens?|Ikebana|Origami~Bonsai~Kalligrafie~Haiku~Sushi~Sumo
Alltag|1|Wie viele Farben hat der Regenbogen traditionell?|7|5~6~8~9~10~12
`;
  const KNOWLEDGE = KNOW_RAW.split('\n').map((s) => s.trim()).filter(Boolean).map((line, idx) => {
    const f = line.split('|').map((s) => s.trim());
    const wrongRaw = f[4].split('~').map((s) => s.trim());
    let wrong = [];
    wrongRaw.forEach((w) => {
      if (w[0] === '@') wrong = wrong.concat(KNOW_POOLS[w.slice(1)].split('~').filter((x) => x !== f[3]));
      else wrong.push(w);
    });
    return { id: idx, topic: f[0], lvl: +f[1], q: f[2], answer: f[3], wrong: wrong, pooled: wrongRaw.some((w) => w[0] === '@') };
  });
  D.knowledge = KNOWLEDGE;

  // ===================== 6. ANAGRAMS =====================
  // category label (singular, used in the prompt) -> words (no ß; plain letters and umlauts only)
  const ANAG_RAW = {
    'Tier': 'Esel Hund Katze Maus Hase Wolf Fuchs Igel Bär Pferd Schaf Ziege Löwe Tiger Affe Ente Gans Adler Eule Hirsch Elefant Giraffe Krokodil Nashorn Pinguin Flamingo Kaninchen Nilpferd Papagei Delfin Zebra Känguru Eisbär Hamster Schlange Eichhörnchen Stachelschwein Schmetterling Wildschwein Meerschweinchen Leopard Gorilla Panther Krähe Spatz Storch Forelle Hummer Marder Dachs',
    'Stadt': 'Bonn Köln Essen Ulm Trier Mainz Kiel Halle Hamburg Dresden Bremen Leipzig Hannover Nürnberg Stuttgart Düsseldorf Frankfurt Karlsruhe Augsburg Heidelberg Regensburg Freiburg Würzburg Potsdam Erfurt Mannheim Lübeck Rostock Münster Koblenz Wien Bern Paris Rom Prag Oslo Lima Linz Graz Zürich Salzburg Innsbruck Basel Luzern Genf Berlin Madrid Lissabon Budapest Warschau Stockholm Kopenhagen Amsterdam Brüssel Dortmund Bielefeld Oldenburg Braunschweig Magdeburg Wiesbaden Saarbrücken',
    'Land': 'Chile Peru Kuba Iran Irak Indien Spanien Italien Polen Japan China Ägypten Schweiz Österreich Frankreich Dänemark Norwegen Schweden Portugal Argentinien Australien Kanada Mexiko Brasilien Finnland Ungarn Türkei Belgien Tunesien Island Irland Estland Lettland Litauen Slowenien Kroatien Bulgarien Rumänien Griechenland Marokko Algerien Kenia Ghana Nigeria Vietnam Thailand Malaysia Indonesien Pakistan Kolumbien Venezuela Ecuador Bolivien Paraguay Uruguay Tschechien Slowakei Luxemburg Niederlande Deutschland Russland Ukraine Serbien Albanien Zypern',
    'Obst': 'Apfel Birne Kirsche Banane Pflaume Traube Mango Melone Zitrone Ananas Pfirsich Erdbeere Himbeere Aprikose Mandarine Brombeere Heidelbeere Nektarine Orange Feige Dattel Limette Kokosnuss Granatapfel Johannisbeere Stachelbeere Mirabelle Zwetschge Grapefruit',
    'Beruf': 'Arzt Koch Maler Lehrer Pilot Bäcker Richter Metzger Friseur Schreiner Tischler Gärtner Pfarrer Polizist Elektriker Apotheker Fotograf Architekt Journalist Mechaniker Schneider Kellner Fahrer Maurer Schlosser Zahnarzt Tierarzt Bankkaufmann Rechtsanwalt Krankenpfleger Feuerwehrmann Dachdecker Sekretärin Bibliothekar Landwirt Uhrmacher Goldschmied Schauspieler Musiker Sänger Dolmetscher Programmierer',
    'Fluss': 'Rhein Elbe Main Oder Weser Donau Inn Isar Mosel Neckar Saale Lahn Ruhr Havel Spree Themse Seine Tiber Loire Wolga Ems Lech Iller Werra Fulda Aller Leine Nahe Eder Tauber Jagst Nil Amazonas Ebro Tajo Rhone Garonne Moldau Weichsel Dnepr Euphrat Tigris Ganges Indus Mekong Murray Missouri Mississippi Colorado Hudson',
    'Gemüse': 'Kohl Lauch Erbse Bohne Spinat Karotte Zwiebel Sellerie Brokkoli Spargel Fenchel Radieschen Blumenkohl Rosenkohl Kohlrabi Knoblauch Kartoffel Salat Rotkohl Wirsing Grünkohl Mangold Zucchini Aubergine Paprika Gurke Tomate Kürbis Rhabarber Pastinake Rettich Chicorée Artischocke',
    'Körperteil': 'Arm Bein Hand Knie Nase Kopf Mund Ohr Auge Hals Bauch Finger Ellbogen Schulter Handgelenk Zeh Daumen Stirn Kinn Wange Rücken Brust Lippe Zunge Zahn Ferse Wade Nacken Hüfte Knöchel Oberarm Oberschenkel Unterarm Schienbein Augenbraue Wimper Handfläche Fingernagel Zehennagel',
    'Blume': 'Rose Tulpe Lilie Narzisse Veilchen Margerite Orchidee Hyazinthe Krokus Primel Dahlie Nelke Aster Mohn Lavendel Iris Sonnenblume Gänseblümchen Vergissmeinnicht Schneeglöckchen Löwenzahn Kornblume Stiefmütterchen Pfingstrose Chrysantheme Gladiole Geranie Begonie Petunie Anemone Fresie Lupine Glockenblume Maiglöckchen Ringelblume Tagetes',
    'Möbelstück': 'Stuhl Tisch Sofa Regal Schrank Hocker Sessel Kommode Schreibtisch Bett Bank Vitrine Truhe Garderobe Nachttisch Bücherregal Sideboard Couch Liege Schaukelstuhl Esstisch Couchtisch Kleiderschrank Spiegelschrank Hängeschrank Eckbank Hochbett',
  };
  const ANAG = {};
  Object.keys(ANAG_RAW).forEach((k) => { ANAG[k] = ANAG_RAW[k].split(/\s+/).filter(Boolean); });
  D.anag = ANAG;
  // ===================== 9. SYLLOGISM TERM TRIPLES =====================
  // each term: sg = singular noun, g = gender (m/f/n), pl = plural noun. Neutral, mutually unrelated groups (statements are
  // to be taken as true even if they would be unusual in reality).
  const SYL_TERMS = [
    [['Lehrer', 'm', 'Lehrer'], ['Musiker', 'm', 'Musiker'], ['Sportler', 'm', 'Sportler']],
    [['Maler', 'm', 'Maler'], ['Schachspieler', 'm', 'Schachspieler'], ['Radfahrer', 'm', 'Radfahrer']],
    [['Koch', 'm', 'Köche'], ['Sänger', 'm', 'Sänger'], ['Fotograf', 'm', 'Fotografen']],
    [['Arzt', 'm', 'Ärzte'], ['Wanderer', 'm', 'Wanderer'], ['Autor', 'm', 'Autoren']],
    [['Gärtner', 'm', 'Gärtner'], ['Leser', 'm', 'Leser'], ['Läufer', 'm', 'Läufer']],
    [['Student', 'm', 'Studenten'], ['Pianist', 'm', 'Pianisten'], ['Schwimmer', 'm', 'Schwimmer']],
    [['Bäcker', 'm', 'Bäcker'], ['Wissenschaftler', 'm', 'Wissenschaftler'], ['Tänzer', 'm', 'Tänzer']],
    [['Pilot', 'm', 'Piloten'], ['Sammler', 'm', 'Sammler'], ['Segler', 'm', 'Segler']],
    [['Ingenieur', 'm', 'Ingenieure'], ['Dichter', 'm', 'Dichter'], ['Kletterer', 'm', 'Kletterer']],
    [['Händler', 'm', 'Händler'], ['Zeichner', 'm', 'Zeichner'], ['Reiter', 'm', 'Reiter']],
    [['Nachbar', 'm', 'Nachbarn'], ['Gitarrist', 'm', 'Gitarristen'], ['Taucher', 'm', 'Taucher']],
    [['Journalist', 'm', 'Journalisten'], ['Imker', 'm', 'Imker'], ['Skifahrer', 'm', 'Skifahrer']],
    [['Schüler', 'm', 'Schüler'], ['Erfinder', 'm', 'Erfinder'], ['Tennisspieler', 'm', 'Tennisspieler']],
    [['Richter', 'm', 'Richter'], ['Geiger', 'm', 'Geiger'], ['Angler', 'm', 'Angler']],
  ];
  D.sylTerms = SYL_TERMS;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.VerbalData = D;
})(typeof self !== 'undefined' ? self : this);
