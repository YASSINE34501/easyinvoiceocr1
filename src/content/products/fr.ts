import type { ProductContent } from "./types";

/**
 * Contenu français des pages produit.
 *
 * Rédigé pour des lecteurs francophones plutôt que traduit phrase à phrase :
 * les titres, les exemples et les tournures diffèrent là où la langue diffère.
 * En revanche, chaque affirmation technique est identique à la version
 * anglaise — un produit qui promet autre chose selon la langue est un défaut,
 * pas une adaptation.
 */

const security: string[] = [
  "La reconnaissance s'exécute dans votre navigateur. Le document n'est pas envoyé à un serveur pour être lu.",
  "Comme le fichier reste sur votre appareil pendant l'extraction, son contenu n'est jamais écrit dans nos journaux ni placé dans une file de traitement.",
  "Un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur votre compte pour tenir à jour votre quota et votre historique. Le contenu du document n'en fait pas partie.",
  "La connexion à l'application se fait uniquement en HTTPS/TLS.",
  "Vous pouvez supprimer un enregistrement de conversion à tout moment depuis votre compte.",
];

const labels: ProductContent["labels"] = {
  what: "De quoi s'agit-il",
  fields: "Ce qui est extrait",
  audience: "À qui cela s'adresse",
  formats: "Formats acceptés",
  capabilities: "Ce que vous pouvez faire",
  security: "Comment vos documents sont traités",
  faqs: "Questions fréquentes",
  relatedGuides: "Guides associés",
  relatedTools: "Outils associés",
};

export const productsFr: Record<string, ProductContent> = {
  "invoice-ocr": {
    name: "OCR de factures",
    title: "OCR de factures — Extraire les données d'un PDF ou d'un scan",
    description:
      "Déposez une facture PDF ou une image et récupérez le fournisseur, le numéro, les dates, la TVA, les totaux et les lignes sous forme de données structurées, modifiables et exportables en Excel, CSV ou JSON.",
    eyebrow: "Produit",
    heading: "Un OCR de factures qui rend des données structurées et modifiables",
    lede: "Déposez un PDF, un scan ou une photo de facture. Le document est lu dans votre navigateur, chaque champ revient accompagné d'un indice de confiance, et vous corrigez ce qui doit l'être avant d'exporter en Excel, CSV ou JSON.",
    what: [
      "L'OCR de factures associe la reconnaissance de caractères à la compréhension du document. Un OCR simple vous rend un bloc de texte ; un OCR de factures détermine en plus quel fragment est le numéro de facture, lequel est la date d'échéance, et quels montants appartiennent à quelle ligne.",
      "C'est cette distinction qui rend le résultat exploitable. Au lieu de ressaisir une facture dans un tableur, vous relisez un enregistrement structuré dont chaque champ est déjà renseigné et reste modifiable.",
      "Les valeurs peu sûres sont mises en évidence : le temps de relecture va aux champs qui réclament vraiment un œil humain, et non au document entier.",
    ],
    fields: [
      {
        group: "Fournisseur et client",
        items: [
          "Nom du fournisseur",
          "Adresse du fournisseur",
          "Numéro de TVA intracommunautaire",
          "Nom et adresse du client",
          "Coordonnées lorsqu'elles figurent sur le document",
        ],
      },
      {
        group: "Document",
        items: [
          "Numéro de facture",
          "Référence de commande",
          "Date de facture",
          "Date d'échéance",
          "Conditions de règlement",
          "Devise",
        ],
      },
      {
        group: "Montants",
        items: [
          "Total hors taxes",
          "Remise",
          "Taux de TVA",
          "Montant de TVA",
          "Frais de port",
          "Total à payer",
          "Montant réglé / solde",
        ],
      },
      {
        group: "Lignes de facture",
        items: [
          "Désignation",
          "Quantité",
          "Unité",
          "Prix unitaire",
          "Remise sur la ligne",
          "TVA de la ligne",
          "Total de la ligne",
        ],
      },
    ],
    audience: [
      {
        title: "Cabinets comptables",
        body: "Les collaborateurs qui traitent les factures fournisseurs de plusieurs clients et veulent un export homogène plutôt qu'une archive de PDF scannés.",
      },
      {
        title: "Comptabilité fournisseurs",
        body: "Les équipes qui rapprochent les factures des bons de commande et préparent les campagnes de règlement.",
      },
      {
        title: "Dirigeants de TPE",
        body: "Toute personne qui saisit encore à la main les totaux de ses factures dans un tableur en fin de mois.",
      },
    ],
    formats: [
      "PDF — natif (avec couche texte) ou scanné, en une ou plusieurs pages",
      "JPG / JPEG — photos et numérisations",
      "PNG — captures d'écran et exports",
      "Jusqu'à 20 Mo par fichier",
    ],
    capabilities: [
      {
        title: "Glisser-déposer ou parcourir",
        body: "Déposez un fichier sur la zone d'envoi ou choisissez-le sur votre appareil. Le type et la taille sont vérifiés avant tout traitement.",
      },
      {
        title: "Une progression visible",
        body: "Préparation, lecture et extraction des champs sont annoncées comme des étapes distinctes : un document lent ne ressemble jamais à une page figée.",
      },
      {
        title: "Relecture côte à côte",
        body: "Le document d'origine s'affiche à côté des champs extraits, ce qui permet de vérifier une valeur sans ouvrir le fichier source séparément.",
      },
      {
        title: "Lignes modifiables",
        body: "Ajoutez, supprimez, réordonnez et corrigez les lignes. Les totaux se recalculent au fur et à mesure, pour que les chiffres exportés restent cohérents entre eux.",
      },
      {
        title: "Trois formats d'export",
        body: "Excel (.xlsx) avec une feuille de synthèse et une feuille de lignes, CSV pour les imports, et JSON pour les systèmes qui consomment l'enregistrement brut.",
      },
      {
        title: "Des échecs annoncés clairement",
        body: "Fichier non pris en charge, fichier trop volumineux, scan illisible et résultat vide donnent chacun un message précis et une marche à suivre.",
      },
    ],
    security,
    faqs: [
      {
        q: "Cela fonctionne-t-il sur des factures scannées ou photographiées ?",
        a: "Oui. Les PDF natifs comme les images prises au téléphone sont acceptés. La qualité du résultat dépend de la source : une prise de vue droite, nette et bien éclairée se lit bien mieux qu'un cliché de travers en basse résolution — et dans les deux cas, chaque champ reste modifiable.",
      },
      {
        q: "Que devient un champ dont le moteur n'est pas sûr ?",
        a: "Il est renvoyé avec un indice de confiance faible et signalé dans le panneau de relecture, afin que vous le vérifiiez avant l'export.",
      },
      {
        q: "Les factures de plusieurs pages sont-elles prises en charge ?",
        a: "Oui — un PDF multipage est traité comme un seul document, et les lignes réparties sur plusieurs pages sont regroupées dans un tableau unique.",
      },
      {
        q: "Quelles langues et quelles devises sont gérées ?",
        a: "L'extraction gère les formats internationaux de nombres, de dates et de devises, ainsi que les écritures latine et arabe. L'interface est disponible en français, en anglais et en arabe.",
      },
      {
        q: "Ma facture est-elle envoyée quelque part ?",
        a: "Non. La reconnaissance s'exécute dans votre navigateur : le document n'est pas transmis à un serveur pour être lu. Seul un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur votre compte.",
      },
    ],
    cta: {
      label: "Extraire une facture",
      href: "/fr/invoice-ocr#upload",
      note: "Cinq conversions offertes. Sans carte bancaire.",
    },
    relatedGuides: [
      {
        label: "Ce que signifie vraiment la précision d'un OCR",
        href: "/fr/blog/invoice-ocr-accuracy-guide",
      },
      {
        label: "Lire des factures en arabe, en français et en écritures mixtes",
        href: "/fr/blog/multilingual-invoice-extraction",
      },
    ],
    relatedTools: [
      { label: "Analyser une facture PDF de plusieurs pages", href: "/fr/pdf-invoice-parser" },
      { label: "Transformer des reçus en tableur", href: "/fr/receipt-to-excel" },
    ],
    solutionLink: {
      label: "Traitement des factures en cabinet comptable",
      href: "/fr/solutions/accountants",
    },
    labels,
    emptyState:
      "Aucun champ de facture n'a été trouvé dans ce document. Reprenez la photo bien à plat, plus nette, avec les quatre coins dans le cadre.",
    errorState: "Ce document n'a pas pu être lu. Rien n'a été décompté de votre quota.",
    a11y: {
      uploadLabel: "Envoyer une facture",
      previewLabel: "Aperçu de la facture envoyée",
    },
  },

  "receipt-to-excel": {
    name: "Reçus vers Excel",
    title: "Reçus vers Excel — Convertir des photos de reçus en tableur",
    description:
      "Envoyez un ou plusieurs reçus et exportez commerçant, date, devise, total hors taxes, TVA, pourboire, total et articles vers un classeur Excel propre, à plat ou groupé.",
    eyebrow: "Produit",
    heading: "Transformer une pile de reçus en un seul tableur",
    lede: "Photographiez ou numérisez vos reçus, envoyez-les ensemble, corrigez ce qui doit l'être, puis téléchargez un classeur Excel unique — à plat pour les tableaux croisés, ou groupé par reçu pour la lecture.",
    what: [
      "Les reçus sont les documents les plus difficiles à tenir à jour : petits, imprimés sur papier thermique, froissés, et ils arrivent un par un. Les saisir dans un tableur en fin de mois est précisément la tâche que tout le monde repousse.",
      "Reçus vers Excel lit un lot d'images en une seule passe et produit un classeur que vous pouvez transmettre à votre comptable ou importer dans votre logiciel.",
      "Comme les valeurs extraites restent modifiables avant l'export, un total effacé ou une ligne de TVA mal lue se corrige en deux secondes, au lieu d'obliger à refaire toute la feuille.",
    ],
    fields: [
      {
        group: "En-tête du reçu",
        items: [
          "Nom du commerçant",
          "Lieu",
          "Date",
          "Heure",
          "Numéro de reçu ou de transaction",
          "Devise",
        ],
      },
      {
        group: "Montants",
        items: [
          "Total hors taxes",
          "TVA",
          "Pourboire",
          "Remise",
          "Total",
          "Moyen de paiement lorsqu'il est imprimé",
        ],
      },
      {
        group: "Articles",
        items: ["Désignation", "Quantité", "Prix unitaire", "Total de la ligne"],
      },
    ],
    audience: [
      {
        title: "Indépendants",
        body: "Toute personne qui déclare des frais professionnels et veut une liste mensuelle plutôt qu'une boîte à chaussures.",
      },
      {
        title: "Petites équipes",
        body: "Le rapprochement des notes de frais de quelques personnes, sans acheter une plateforme dédiée.",
      },
      {
        title: "Experts-comptables",
        body: "Les clients qui envoient des photos de reçus et attendent une feuille ventilée en retour.",
      },
    ],
    formats: ["JPG / JPEG", "PNG", "WebP", "Reçus au format PDF", "Jusqu'à 20 Mo par fichier"],
    capabilities: [
      {
        title: "Envoi par lot",
        body: "Sélectionnez ou déposez plusieurs reçus d'un coup. Chacun est traité indépendamment : une image illisible ne fait pas échouer le lot.",
      },
      {
        title: "Deux mises en page de classeur",
        body: "À plat — une ligne par article, la référence du reçu répétée, idéale pour les tableaux croisés. Groupée — un bloc par reçu, avec une ligne d'en-tête et ses articles en dessous.",
      },
      {
        title: "Sortie compatible Unicode",
        body: "Les noms de commerçants et d'articles en arabe, en latin accentué ou dans d'autres écritures sont écrits comme du texte, et non comme des caractères déformés.",
      },
      {
        title: "Aperçu avant téléchargement",
        body: "Le tableau exact qui sera écrit dans le classeur s'affiche d'abord à l'écran. Rien ne se télécharge avant que vous l'ayez vu.",
      },
      {
        title: "Correction reçu par reçu",
        body: "Rectifiez un nom de commerçant ou un montant de TVA sur un reçu sans toucher au reste du lot.",
      },
      {
        title: "Gestion des devises",
        body: "La devise imprimée est conservée pour chaque reçu : un lot multidevise ne devient pas silencieusement monodevise.",
      },
    ],
    security,
    faqs: [
      {
        q: "Combien de reçus puis-je envoyer en une fois ?",
        a: "La taille du lot est limitée par le quota mensuel de pages de votre formule. Chaque image de reçu compte pour une page.",
      },
      {
        q: "Le texte arabe ou accentué survit-il à l'export ?",
        a: "Oui. Le classeur est écrit en Unicode : les noms non latins apparaissent tels qu'ils figurent sur le reçu.",
      },
      {
        q: "Puis-je exporter en CSV ?",
        a: "Oui — la même mise en page à plat est disponible en CSV, aux côtés du .xlsx et du JSON.",
      },
      {
        q: "Et un reçu totalement illisible ?",
        a: "Il est renvoyé comme résultat vide avec une explication claire, et signalé à part dans le lot pour que vous le repreniez en photo ou le saisissiez à la main.",
      },
    ],
    cta: {
      label: "Convertir des reçus",
      href: "/fr/receipt-to-excel#upload",
      note: "Cinq conversions offertes. Sans carte bancaire.",
    },
    relatedGuides: [
      {
        label: "Une routine mensuelle pour vos reçus",
        href: "/fr/blog/receipts-to-spreadsheet-workflow",
      },
      {
        label: "Les questions à poser avant de confier vos documents",
        href: "/fr/blog/gdpr-document-processing",
      },
    ],
    relatedTools: [
      { label: "Extraire les données d'une facture complète", href: "/fr/invoice-ocr" },
      { label: "Photographier un tableau et obtenir un classeur", href: "/fr/image-to-excel" },
    ],
    solutionLink: {
      label: "Notes de frais des travailleurs indépendants",
      href: "/fr/solutions/freelancers",
    },
    labels,
    emptyState:
      "Rien n'a pu être lu sur ce reçu. Le papier thermique effacé et les plis en travers du montant en sont les causes habituelles.",
    errorState: "Ce reçu n'a pas pu être traité. Rien n'a été décompté de votre quota.",
    a11y: { uploadLabel: "Envoyer des reçus", previewLabel: "Aperçu du reçu envoyé" },
  },

  "pdf-invoice-parser": {
    name: "Analyseur de factures PDF",
    title: "Analyseur de factures PDF — Extraire des PDF natifs ou scannés",
    description:
      "Analysez des factures PDF d'une ou plusieurs pages, natives ou scannées, avec navigation entre les pages, extraction au niveau du document et des lignes, relecture et export structuré.",
    eyebrow: "Produit",
    heading: "Analyser une facture PDF — texte natif ou image scannée",
    lede: "Envoyez n'importe quelle facture PDF. Les PDF avec couche texte sont lus directement, les pages scannées passent par la reconnaissance, et les documents multipages conservent leur structure : chaque valeur reste vérifiable sur la page dont elle provient.",
    what: [
      "Il existe deux sortes de factures PDF, qui appellent deux traitements différents. Un PDF natif, exporté depuis un logiciel comptable, contient une véritable couche texte. Un PDF scanné n'est qu'une image de papier enveloppée dans un conteneur PDF, sans aucun texte.",
      "L'analyseur détecte le type qu'on lui remet et l'oriente en conséquence : vous n'avez pas à savoir lequel vous avez entre les mains.",
      "Les documents multipages sont courants en facturation fournisseur — une page de synthèse suivie de pages de lignes. La navigation entre les pages est conservée, et les lignes sont regroupées d'une page à l'autre dans un tableau unique.",
    ],
    fields: [
      {
        group: "Niveau document",
        items: [
          "Numéro de facture",
          "Dates de facture et d'échéance",
          "Blocs fournisseur et client",
          "Numéros de TVA",
          "Devise",
          "Conditions de règlement",
        ],
      },
      {
        group: "Totaux",
        items: [
          "Total hors taxes",
          "Taux et montant de TVA",
          "Remises",
          "Frais de port",
          "Total général",
          "Solde dû",
        ],
      },
      {
        group: "Par ligne",
        items: [
          "Désignation",
          "Quantité",
          "Prix unitaire",
          "TVA",
          "Total de la ligne",
          "Numéro de la page d'origine",
        ],
      },
    ],
    audience: [
      {
        title: "Comptabilité fournisseurs",
        body: "Les équipes qui reçoivent des PDF fournisseurs par courriel et les ressaisissent dans un ERP.",
      },
      {
        title: "Cabinets d'expertise comptable",
        body: "Les structures qui traitent chaque mois des lots de factures fournisseurs pour leurs clients.",
      },
      {
        title: "Services opérationnels",
        body: "Toute personne qui rapproche de longs documents de facturation avec des livraisons.",
      },
    ],
    formats: [
      "PDF avec couche texte (export natif)",
      "PDF scanné (pages images, lues par reconnaissance)",
      "PDF de plusieurs pages",
      "Jusqu'à 20 Mo par fichier",
    ],
    capabilities: [
      {
        title: "Navigation entre les pages",
        body: "Passez d'une page à l'autre du document source pendant la relecture, la page courante étant indiquée.",
      },
      {
        title: "Détection natif / scanné",
        body: "Le document est inspecté à la recherche d'une couche texte, puis orienté automatiquement vers l'analyse directe ou vers la reconnaissance.",
      },
      {
        title: "Lignes réparties sur plusieurs pages",
        body: "Un tableau de lignes coupé par un saut de page est reconstitué en un tableau continu, chaque ligne conservant sa page d'origine.",
      },
      {
        title: "Relire et corriger",
        body: "Chaque champ du document et chaque ligne restent modifiables avant l'export.",
      },
      {
        title: "Des erreurs PDF explicites",
        body: "PDF protégé par mot de passe, corrompu, vide ou non pris en charge : chacun produit un message distinct indiquant la marche à suivre, plutôt qu'un échec générique.",
      },
      {
        title: "Export structuré",
        body: "Excel avec feuilles de synthèse et de lignes, CSV, ou JSON incluant les références de page.",
      },
    ],
    security,
    faqs: [
      {
        q: "Les PDF protégés par mot de passe sont-ils acceptés ?",
        a: "Non. Un PDF chiffré est refusé avec un message vous invitant à retirer le mot de passe puis à réessayer.",
      },
      {
        q: "Quelle est la limite de pages ?",
        a: "Le nombre de pages est borné par la taille du fichier (20 Mo) et par le quota mensuel de votre formule. Chaque page analysée compte pour une page.",
      },
      {
        q: "Sait-il séparer plusieurs factures dans un même PDF ?",
        a: "Non. Un fichier est traité comme un seul document. S'il contient plusieurs factures, elles sont extraites en un seul enregistrement, que vous pouvez corriger ou scinder avant l'export.",
      },
      {
        q: "Le PDF d'origine est-il conservé ?",
        a: "Le fichier reste sur votre appareil. Seul un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur votre compte.",
      },
    ],
    cta: {
      label: "Analyser une facture PDF",
      href: "/fr/pdf-invoice-parser#upload",
      note: "Cinq conversions offertes. Sans carte bancaire.",
    },
    relatedGuides: [
      {
        label: "Pourquoi extraire les lignes est plus difficile que lire le total",
        href: "/fr/blog/line-item-extraction-hard",
      },
      {
        label: "Comment juger une annonce de précision",
        href: "/fr/blog/invoice-ocr-accuracy-guide",
      },
    ],
    relatedTools: [
      { label: "Extraire depuis une image de facture", href: "/fr/invoice-ocr" },
      { label: "Convertir un PDF en document Word modifiable", href: "/fr/pdf-to-word" },
    ],
    solutionLink: {
      label: "Comptabilité fournisseurs en cabinet",
      href: "/fr/solutions/accountants",
    },
    labels,
    emptyState:
      "Aucun champ de facture n'a été trouvé dans ce PDF. Il s'agit peut-être d'un scan sans texte lisible.",
    errorState: "Ce PDF n'a pas pu être analysé. Rien n'a été décompté de votre quota.",
    a11y: {
      uploadLabel: "Envoyer une facture PDF",
      previewLabel: "Aperçu de la page PDF envoyée",
    },
  },

  "image-to-excel": {
    name: "Image vers Excel",
    title: "Image vers Excel — Convertir un tableau photographié en .xlsx",
    description:
      "Envoyez une image JPG, PNG ou WebP d'un tableau ou d'un document, prévisualisez-la, extrayez les lignes et colonnes structurées, modifiez-les et téléchargez un véritable classeur Excel.",
    eyebrow: "Produit",
    heading: "Photographiez un tableau, repartez avec un tableur",
    lede: "Envoyez l'image d'un tableau imprimé, d'un relevé ou d'une facture. Les lignes et les colonnes sont détectées, présentées sous forme de grille modifiable, puis exportées vers un vrai classeur .xlsx — les nombres comme nombres, les dates comme dates.",
    what: [
      "Beaucoup de données financières arrivent encore sous forme d'image : la photo d'un relevé imprimé, la capture d'un portail dépourvu de bouton d'export, le scan d'un tarif fournisseur.",
      "Image vers Excel retrouve la structure du tableau à l'intérieur de cette image et vous rend la grille, pour que vous puissiez travailler les valeurs au lieu de les déchiffrer.",
      "Le résultat est un vrai classeur produit par une bibliothèque tableur — ni un CSV renommé, ni un fichier vide au nom prometteur.",
    ],
    fields: [
      {
        group: "Structure du tableau",
        items: [
          "En-têtes de colonnes",
          "Cellules",
          "Gestion des cellules fusionnées",
          "Plusieurs tableaux par image le cas échéant",
        ],
      },
      {
        group: "Valeurs typées",
        items: [
          "Les nombres écrits comme des nombres",
          "Les montants avec leur symbole monétaire conservé",
          "Les dates normalisées au format ISO dans une seconde colonne",
          "Le texte conservé en Unicode",
        ],
      },
    ],
    audience: [
      {
        title: "Analystes",
        body: "Toute personne qui reçoit des données sous forme d'image et doit les exploiter dans une feuille.",
      },
      {
        title: "Comptables",
        body: "Les relevés et grands livres qui n'existent que sur papier.",
      },
      {
        title: "Services opérationnels",
        body: "Tarifs, inventaires et bons de livraison photographiés au téléphone.",
      },
    ],
    formats: ["JPG / JPEG", "PNG", "WebP", "Jusqu'à 20 Mo par image"],
    capabilities: [
      {
        title: "Aperçu de l'image",
        body: "L'image envoyée s'affiche à côté de la grille extraite, pour comparer cellule par cellule.",
      },
      {
        title: "Grille modifiable",
        body: "Modifiez n'importe quelle cellule, renommez un en-tête, supprimez une ligne parasite venue d'un pied de page.",
      },
      {
        title: "Un vrai fichier .xlsx",
        body: "Le classeur est généré par une bibliothèque tableur et s'ouvre dans Excel, LibreOffice, Numbers et Google Sheets. Une extraction vide ne produit jamais de téléchargement.",
      },
      {
        title: "Conservation des types",
        body: "Les cellules numériques sont écrites comme des nombres et s'additionnent correctement ; les dates et les codes devise sont conservés à côté du texte d'origine.",
      },
      {
        title: "Texte Unicode",
        body: "L'arabe, le latin accentué et les autres écritures sont restitués sans altération.",
      },
      {
        title: "Traitement des résultats vides",
        body: "Si aucune structure de tableau n'est trouvée, vous en êtes informé, avec des conseils de reprise, plutôt que de recevoir une feuille blanche.",
      },
    ],
    security,
    faqs: [
      {
        q: "Et si l'image ne contient aucun tableau ?",
        a: "Vous obtenez un message explicite indiquant qu'aucune structure de tableau n'a été détectée, avec des conseils pour une meilleure prise de vue. Aucun fichier n'est téléchargé.",
      },
      {
        q: "Les nombres sont-ils utilisables dans des formules ?",
        a: "Oui — les cellules numériques sont écrites avec un type numérique : SOMME et les autres fonctions marchent sans passer par une conversion texte-colonnes.",
      },
      {
        q: "Puis-je obtenir du CSV ou du JSON ?",
        a: "Oui, la même grille s'exporte en CSV et en JSON.",
      },
      {
        q: "Les photos de travers sont-elles gérées ?",
        a: "Une légère rotation est tolérée. Un tableau fortement incliné ou partiellement coupé réduit la qualité — l'aperçu vous montre ce qui a été lu avant l'export.",
      },
    ],
    cta: {
      label: "Convertir une image",
      href: "/fr/image-to-excel#upload",
      note: "Cinq conversions offertes. Sans carte bancaire.",
    },
    relatedGuides: [
      {
        label: "Pourquoi la structure d'un tableau est le vrai obstacle",
        href: "/fr/blog/line-item-extraction-hard",
      },
      {
        label: "Regrouper un mois de reçus dans une seule feuille",
        href: "/fr/blog/receipts-to-spreadsheet-workflow",
      },
    ],
    relatedTools: [
      { label: "Extraire plutôt une facture complète", href: "/fr/invoice-ocr" },
      { label: "Réunir des images dans un seul PDF", href: "/fr/image-to-pdf" },
    ],
    solutionLink: {
      label: "Gestion documentaire en petite entreprise",
      href: "/fr/solutions/small-businesses",
    },
    labels,
    emptyState:
      "Aucune structure de tableau n'a été détectée dans cette image. Reprenez la photo plus à plat et mieux éclairée.",
    errorState: "Cette image n'a pas pu être traitée. Rien n'a été décompté de votre quota.",
    a11y: {
      uploadLabel: "Envoyer l'image d'un tableau",
      previewLabel: "Aperçu de l'image envoyée",
    },
  },

  "ocr-api": {
    name: "API OCR",
    title: "API OCR — Extraction programmatique prévue (bientôt disponible)",
    description:
      "L'API HTTP d'EasyInvoiceOCR n'est pas encore disponible et n'accepte aucune requête. Cette page décrit l'interface en cours de conception, afin que les intégrateurs puissent l'anticiper.",
    eyebrow: "Bientôt disponible",
    heading: "L'API OCR n'est pas encore disponible",
    lede: "Cette page décrit une interface en cours de conception. Aucun point d'entrée n'accepte de requête, aucune clé n'est délivrée et aucune échéance n'est promise. Elle existe pour que toute personne préparant une intégration en connaisse la forme envisagée.",
    what: [
      "L'API s'adresse aux équipes qui disposent déjà d'un système recevant des factures — un ERP, un outil d'achat, un tableau de bord interne — et préféreraient que l'extraction s'y déroule plutôt que dans un onglet de navigateur.",
      "Rien de ce qui est décrit ci-dessous n'est en service. Les points d'entrée n'existent pas, aucune authentification n'est délivrée et aucune requête n'aboutira. Considérez cette page comme une note de conception, non comme la documentation d'un service appelable aujourd'hui.",
      "Elle est publiée tôt pour une raison : un intégrateur qui compare des éditeurs mérite de savoir ce qui est prévu et ce qui ne l'est pas, plutôt que de découvrir l'écart après s'être engagé.",
    ],
    fields: [
      {
        group: "Opérations prévues",
        items: [
          "Soumettre un document pour extraction",
          "Consulter l'état de traitement d'une soumission",
          "Récupérer le résultat structuré",
          "Lister les documents déjà soumis",
          "Supprimer un document et son enregistrement",
        ],
      },
      {
        group: "Contenu de réponse prévu",
        items: [
          "Métadonnées et état du document",
          "Champs de la facture avec indice de confiance",
          "Tableau des lignes",
          "Devise détectée et indices de localisation",
          "Nombre de pages",
        ],
      },
    ],
    audience: [
      {
        title: "Équipes produit",
        body: "Ajouter la capture documentaire à une application existante.",
      },
      {
        title: "Outils internes",
        body: "Automatiser une boîte de réception de factures fournisseurs vers une base de données.",
      },
      {
        title: "Intégrateurs",
        body: "Relier l'extraction à un logiciel comptable pour le compte d'un client.",
      },
    ],
    formats: [
      "L'interface envisagée vise les mêmes entrées que les outils navigateur : PDF, JPG, PNG et WebP.",
      "Aucun point d'entrée n'étant en service, aucune limite de taille ni de débit n'est appliquée.",
    ],
    capabilities: [
      {
        title: "N'accepte aucune requête",
        body: "Il n'existe aucun point d'entrée actif. Tout appel effectué aujourd'hui échouera, faute d'interlocuteur.",
      },
      {
        title: "Aucune clé n'est délivrée",
        body: "Il n'y a ni gestion de clés, ni espace développeur, ni moyen de s'authentifier. L'accès API ne fait partie d'aucune formule actuelle.",
      },
      {
        title: "Objectifs de conception, non fonctionnalités",
        body: "Soumission idempotente, format d'erreur stable et lisible par la machine, en-têtes de limitation explicites : voilà autour de quoi l'interface est pensée. Aucun de ces éléments n'est implémenté.",
      },
      {
        title: "Ni SDK ni webhooks",
        body: "Ni l'un ni l'autre n'existe. Ils sont absents de cette page plutôt que décrits comme s'ils fonctionnaient.",
      },
    ],
    security,
    faqs: [
      {
        q: "L'API est-elle disponible aujourd'hui ?",
        a: "Non. Elle n'accepte aucune requête. Il n'y a ni point d'entrée, ni clé, ni environnement de test.",
      },
      {
        q: "L'accès API est-il inclus dans la formule Business ?",
        a: "Non. L'accès API ne fait partie d'aucune formule actuelle et n'est pas facturé. Si cela change, les pages tarifaires l'indiqueront avant l'ouverture du service.",
      },
      {
        q: "Quand sera-t-elle disponible ?",
        a: "Aucune date ne peut être annoncée. En avancer une avant que le service soit construit et testé relèverait de la conjecture, et un plan d'intégration ne se bâtit pas sur une conjecture.",
      },
      {
        q: "Que puis-je utiliser en attendant ?",
        a: "Les outils navigateur réalisent la même extraction dès aujourd'hui : l'OCR de factures, l'analyseur de factures PDF et Reçus vers Excel fonctionnent sans API.",
      },
    ],
    cta: {
      label: "Utiliser les outils navigateur",
      href: "/fr/invoice-ocr",
      note: "L'API n'accepte aucune requête. Les outils navigateur réalisent la même extraction aujourd'hui.",
    },
    relatedGuides: [
      {
        label: "La liste de contrôle du développeur pour évaluer une API d'OCR",
        href: "/fr/blog/choosing-ocr-api",
      },
      {
        label: "Ce qu'il faut demander sur le traitement de vos données",
        href: "/fr/blog/gdpr-document-processing",
      },
    ],
    relatedTools: [
      { label: "Extraire des factures dans le navigateur", href: "/fr/invoice-ocr" },
      { label: "Analyser des factures PDF multipages", href: "/fr/pdf-invoice-parser" },
    ],
    solutionLink: { label: "Repères pour les développeurs", href: "/fr/solutions/developers" },
    labels,
    emptyState: "Il n'y a rien à afficher : l'API n'est pas en service.",
    errorState: "L'API n'est pas disponible. Aucune requête ne peut aboutir pour le moment.",
    a11y: {
      uploadLabel: "L'envoi est indisponible",
      previewLabel: "Aucun aperçu disponible",
    },
  },
};
