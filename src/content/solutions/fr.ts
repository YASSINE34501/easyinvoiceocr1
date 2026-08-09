import type { SolutionContent } from "./types";

/**
 * Contenu français des pages Solutions.
 *
 * Rédigé pour des lecteurs francophones, non traduit mot à mot. Les
 * affirmations techniques et commerciales sont strictement identiques aux
 * versions anglaise et arabe : cinq conversions gratuites, compte obligatoire,
 * reconnaissance dans le navigateur, et aucune API opérationnelle.
 */

const labels: SolutionContent["labels"] = {
  intro: "Le problème",
  blocks: "Comment cela fonctionne",
  faqs: "Questions fréquentes",
  products: "Les outils correspondants",
  guides: "À lire également",
  breadcrumb: "Solutions",
};

export const solutionsFr: Record<string, SolutionContent> = {
  accountants: {
    name: "Experts-comptables",
    title: "OCR de factures pour experts-comptables et cabinets — EasyInvoiceOCR",
    description:
      "Traitez les factures fournisseurs en série, extrayez la TVA comme champ distinct, relisez par exception et exportez vers Excel ou CSV. Pensé pour une fin de mois de cabinet.",
    eyebrow: "Solutions",
    heading: "Conçu pour la pile de factures de fin de mois",
    lede: "Un cabinet ne traite pas une facture. Il en traite plusieurs centaines pour une douzaine de clients dans la même semaine, et le flux de travail doit être bâti pour cela.",
    intro: [
      "Le goulot d'étranglement d'un cabinet n'est presque jamais le logiciel comptable : c'est l'obtention de documents fournisseurs dans un état que ce logiciel acceptera. Un travail manuel, répétitif, et la chose la moins utile qu'une personne qualifiée puisse faire de la dernière semaine du mois.",
      "La transcription est la part qui revient à la machine. Le temps de vos collaborateurs vaut mieux sur les exceptions : la facture au mauvais taux de TVA, celle adressée à la mauvaise entité, celle qui n'aurait jamais dû être validée.",
    ],
    blocks: [
      {
        title: "Enchaîner un lot, pas un fichier",
        body: "Traitez les factures fournisseurs les unes après les autres sans rien reconfigurer entre deux. Chaque document est pris isolément : un mauvais scan ne gâche pas le reste de la session.",
        points: [
          "PDF et images mêlés dans la même session de travail",
          "Un résultat par document : extrait, à relire, ou en échec",
          "Un échec indique sa raison au lieu de disparaître",
        ],
      },
      {
        title: "La TVA comme champs distincts",
        body: "La taxe est le champ qui doit être juste. Numéro de TVA du fournisseur, taux, montant et ventilation HT/TTC sont extraits comme des valeurs séparées, et non déduits du total.",
        points: [
          "Identifiants fiscaux du fournisseur et du client",
          "Taux et montant relevés séparément",
          "Plusieurs taux sur une même facture conservés ligne par ligne",
          "Autoliquidation et lignes exonérées restituées telles qu'imprimées",
        ],
      },
      {
        title: "Relire par exception",
        body: "Les champs peu sûrs remontent en premier. Le relecteur confirme ou corrige, et ce sont les valeurs corrigées qui sont exportées : il n'existe pas de version brute parallèle susceptible de se glisser dans une déclaration.",
        points: [
          "Indice de confiance affiché par champ",
          "Le document d'origine à côté des valeurs extraites",
          "Lignes modifiables avec recalcul des totaux",
        ],
      },
      {
        title: "L'arithmétique comme véritable contrôle",
        body: "Une extraction qui s'équilibre est presque certainement juste. Les lignes sont additionnées face au sous-total, et le sous-total face au total annoncé ; les lignes qui ne se recoupent pas sont signalées au lieu d'être exportées en silence.",
      },
      {
        title: "Des exports qu'un logiciel acceptera",
        body: "Un classeur Excel avec feuille de synthèse et feuille de lignes, un CSV calibré pour l'import en comptabilité, ou un JSON détaillé champ par champ.",
        points: [
          "Fichier .xlsx avec synthèse et lignes",
          "CSV prêt pour l'import comptable",
          "JSON avec l'indice de confiance de chaque champ",
        ],
      },
      {
        title: "Les documents clients restent sur le poste du relecteur",
        body: "La reconnaissance s'exécute dans le navigateur : la facture d'un client n'est pas envoyée à un serveur pour être lue. Seul un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur le compte. Ce que nous affirmons, et ce que nous nous gardons d'affirmer, figure sur la page Sécurité.",
      },
    ],
    faqs: [
      {
        q: "Plusieurs collaborateurs peuvent-ils relire en même temps ?",
        a: "Chacun travaille dans sa propre session de navigateur, sur son propre compte. Il n'existe pas encore de file de relecture partagée : c'est une limite réelle, et non une fonctionnalité retenue.",
      },
      {
        q: "Les factures en plusieurs langues sont-elles gérées ?",
        a: "L'extraction traite les écritures latine et arabe ainsi que les formats internationaux de nombres, de dates et de devises. Lorsqu'une date est réellement ambiguë, le champ est signalé plutôt que deviné.",
      },
      {
        q: "Que se passe-t-il pour un document illisible ?",
        a: "Il est signalé en échec avec un motif, et il ne consomme aucune conversion de votre quota.",
      },
    ],
    cta: {
      label: "Traiter l'une de vos factures",
      href: "/fr/invoice-ocr#demo",
      note: "Ouvre l'OCR de factures avec la zone d'envoi. La reconnaissance porte sur votre fichier, dans votre navigateur.",
    },
    productLinks: [
      { label: "Extraire une facture isolée", href: "/fr/invoice-ocr" },
      { label: "Analyser des factures PDF multipages", href: "/fr/pdf-invoice-parser" },
      { label: "Comment les documents sont traités", href: "/fr/security" },
    ],
    blogLinks: [
      {
        label: "Ce que mesure vraiment une annonce de précision",
        href: "/fr/blog/invoice-ocr-accuracy-guide",
      },
      {
        label: "Pourquoi les lignes sont le vrai obstacle",
        href: "/fr/blog/line-item-extraction-hard",
      },
    ],
    labels,
    a11y: { navLabel: "Outils et guides pour les cabinets comptables" },
    emptyState: "Aucun document dans cette vue pour le moment.",
    errorState: "Cette page n'a pas pu être chargée. Rien n'a été décompté de votre quota.",
  },

  "small-businesses": {
    name: "Petites entreprises",
    title: "OCR de factures et de reçus pour petites entreprises — EasyInvoiceOCR",
    description:
      "Réduisez la saisie manuelle, réunissez factures fournisseurs et reçus dans une seule liste, exportez le mois vers Excel. Cinq conversions offertes, sans carte bancaire.",
    eyebrow: "Solutions",
    heading: "Arrêtez de ressaisir vos factures fournisseurs",
    lede: "La plupart des petites entreprises tiennent leur comptabilité dans un tableur, et l'essentiel de ce tableur est tapé à la main depuis du papier et des PDF. Ce qui disparaît ici, c'est la saisie, pas le tableur.",
    intro: [
      "Vous n'avez pas besoin d'une plateforme financière d'entreprise. Vous avez besoin que les montants passent de la facture à une feuille de calcul, correctement, sans y consacrer une soirée.",
      "Le périmètre est volontairement étroit : capturer le document, vérifier les chiffres, exporter la feuille. Aucun plan comptable à paramétrer avant de commencer.",
    ],
    blocks: [
      {
        title: "Moins de saisie, le même tableur",
        body: "Une facture fournisseur prend quelques minutes à taper et quelques secondes à vérifier. Les champs arrivent renseignés ; vous confirmez ceux qui sont signalés comme incertains et vous passez au suivant.",
      },
      {
        title: "Factures et reçus au même endroit",
        body: "Les deux deviennent des enregistrements avec fournisseur, date, TVA et total, au lieu d'être répartis entre une boîte mail, une galerie photo et un tiroir.",
        points: [
          "Une seule liste pour les factures et les reçus",
          "Recherche par fournisseur ou par montant",
          "Tri par date ou par total",
        ],
      },
      {
        title: "Quelle que soit la provenance",
        body: "Un PDF reçu par courriel, un scan d'imprimante et une photo de téléphone empruntent le même chemin : il n'y a pas de procédure distincte selon la source.",
      },
      {
        title: "Un mois, un export",
        body: "Exportez une période vers un classeur Excel : une feuille de synthèse avec les champs de la facture et une feuille de lignes avec le détail. Il s'ouvre dans Excel, Numbers, LibreOffice et Google Sheets.",
      },
      {
        title: "Cinq conversions pour vous décider",
        body: "Chaque compte dispose de cinq conversions réussies, gratuites et sans carte bancaire. Une conversion échouée ou annulée ne coûte rien : un mauvais scan n'en consomme pas.",
      },
    ],
    faqs: [
      {
        q: "Qu'est-ce qui est gratuit exactement ?",
        a: "Cinq conversions réussies par compte, communes à tous les outils. Ce n'est pas un quota mensuel et il ne se recharge pas : au-delà de la cinquième, une formule payante devient nécessaire.",
      },
      {
        q: "Faut-il un compte pour essayer ?",
        a: "Oui. Les conversions sont rattachées à un compte pour que les cinq gratuites puissent être décomptées, et pour que votre historique vous appartienne plutôt qu'à une session de navigateur.",
      },
      {
        q: "Ma facture est-elle envoyée à un serveur ?",
        a: "Non. La reconnaissance s'exécute dans votre navigateur. Seul un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur votre compte.",
      },
    ],
    cta: {
      label: "Essayer avec l'une de vos factures",
      href: "/fr/invoice-ocr#demo",
      note: "Cinq conversions offertes. Une conversion échouée n'en consomme aucune.",
    },
    productLinks: [
      { label: "Lire une facture fournisseur", href: "/fr/invoice-ocr" },
      { label: "Transformer des reçus en tableur", href: "/fr/receipt-to-excel" },
      { label: "Photographier un tableau", href: "/fr/image-to-excel" },
    ],
    blogLinks: [
      {
        label: "Une routine mensuelle qui tient dans la durée",
        href: "/fr/blog/receipts-to-spreadsheet-workflow",
      },
      {
        label: "Les questions à poser avant tout envoi de documents",
        href: "/fr/blog/gdpr-document-processing",
      },
    ],
    labels,
    a11y: { navLabel: "Outils et guides pour les petites entreprises" },
    emptyState: "Rien ici pour l'instant.",
    errorState: "Cette page n'a pas pu être chargée.",
  },

  freelancers: {
    name: "Indépendants",
    title: "OCR de reçus et de notes de frais pour indépendants — EasyInvoiceOCR",
    description:
      "Photographiez vos reçus au fil de l'eau, extrayez commerçant, date, TVA et total, exportez le mois vers Excel. Cinq conversions offertes.",
    eyebrow: "Solutions",
    heading: "Vos reçus, classés, depuis votre téléphone",
    lede: "La comptabilité d'un indépendant échoue à la capture, pas à la comptabilité. Si le reçu est photographié au moment où on le reçoit, tout le reste devient simple.",
    intro: [
      "Personne ne garde une boîte à chaussures par goût. On la garde parce que saisir des reçus est assez ennuyeux pour être repoussé jusqu'à ce qu'une échéance l'impose.",
      "Photographier le reçu à la réception, traiter un lot quand cela vous arrange, exporter le mois quand votre comptable le demande. C'est toute la boucle.",
    ],
    blocks: [
      {
        title: "Un reçu devient un enregistrement",
        body: "Commerçant, date, devise, TVA et total, tous consultables — au lieu d'une photo que vous ne retrouverez jamais.",
      },
      {
        title: "Voir ce que vous avez réellement dépensé",
        body: "Des totaux par mois et par commerçant, sans avoir à construire la feuille au préalable.",
      },
      {
        title: "Les factures dans les deux sens",
        body: "Gardez au même endroit les factures que vous émettez et celles que vous recevez : une question de fin d'année devient une recherche, non une fouille.",
      },
      {
        title: "Exporter et transmettre",
        body: "Un mois vers Excel ou CSV. Le texte Unicode — y compris les noms de commerçants en arabe ou accentués — est restitué exactement comme imprimé.",
      },
      {
        title: "Fonctionne sur le téléphone qui a pris la photo",
        body: "La zone d'envoi est adaptée au tactile et accepte les photos directement depuis la galerie. Aucune application à installer.",
      },
    ],
    faqs: [
      {
        q: "Un ticket thermique effacé fonctionne-t-il ?",
        a: "Parfois. Le papier thermique délavé et les plis en travers du montant sont les causes habituelles d'une mauvaise lecture. Lorsque rien ne peut être extrait, vous obtenez un résultat vide explicite, et cela ne consomme aucune conversion gratuite.",
      },
      {
        q: "Les noms de commerçants arabes ou accentués survivent-ils à l'export ?",
        a: "Oui. Le classeur est écrit en Unicode : les noms apparaissent tels qu'ils figurent sur le reçu.",
      },
      {
        q: "Combien de conversions gratuites ?",
        a: "Cinq conversions réussies par compte, communes à tous les outils, sans carte bancaire. Les conversions échouées ou annulées ne coûtent rien.",
      },
    ],
    cta: {
      label: "Essayer avec un reçu",
      href: "/fr/receipt-to-excel#demo",
      note: "Ouvre Reçus vers Excel. Cinq conversions offertes.",
    },
    productLinks: [
      { label: "Des reçus vers un tableur", href: "/fr/receipt-to-excel" },
      { label: "Un tableau photographié en .xlsx", href: "/fr/image-to-excel" },
      { label: "Centre d'aide", href: "/fr/help" },
    ],
    blogLinks: [
      {
        label: "La routine mensuelle des reçus",
        href: "/fr/blog/receipts-to-spreadsheet-workflow",
      },
      {
        label: "Comment la précision se mesure vraiment",
        href: "/fr/blog/invoice-ocr-accuracy-guide",
      },
    ],
    labels,
    a11y: { navLabel: "Outils et guides pour les indépendants" },
    emptyState: "Aucun reçu pour le moment.",
    errorState: "Cette page n'a pas pu être chargée.",
  },

  developers: {
    name: "Développeurs",
    title: "Extraction documentaire pour développeurs — API bientôt disponible — EasyInvoiceOCR",
    description:
      "L'API EasyInvoiceOCR n'est pas opérationnelle et n'accepte aucune requête. Ce qui existe aujourd'hui s'exécute dans le navigateur ; cette page expose le prévu et l'utilisable.",
    eyebrow: "Solutions",
    heading: "Il n'y a pas encore d'API — voici ce qui existe",
    lede: "Si vous évaluez cet outil pour une intégration, la réponse honnête vient d'abord : l'API HTTP n'est pas construite. Aucun point d'entrée n'accepte de requête et aucune clé n'est délivrée.",
    intro: [
      "Cette page listait auparavant cinq points d'entrée, un jeton d'authentification et des exemples de requêtes. Rien de tout cela n'était appelable : c'était la documentation d'un service inexistant. Elle a été retirée plutôt que nuancée.",
      "Ce qui fonctionne aujourd'hui s'exécute entièrement dans le navigateur : reconnaissance, extraction des champs, relecture et export, sans aller-retour serveur pour le document lui-même. Si cela correspond à l'endroit où se trouvent déjà vos utilisateurs, c'est utilisable dès maintenant.",
    ],
    blocks: [
      {
        title: "Ce qui est réellement disponible",
        body: "Les outils navigateur. L'OCR de factures, l'analyseur de factures PDF, Reçus vers Excel et Image vers Excel s'exécutent côté client et exportent en Excel, CSV ou JSON. Aucune étape d'intégration, aucune clé.",
        points: [
          "Reconnaissance et extraction dans le navigateur du visiteur",
          "Exports produits côté client en .xlsx, CSV ou JSON",
          "Aucun document n'est envoyé pour être lu",
        ],
      },
      {
        title: "Ce qui n'est pas disponible",
        body: "L'API HTTP. Pas de point d'entrée, pas d'authentification, pas d'environnement de test, pas de SDK, pas de webhooks. L'accès API ne fait partie d'aucune formule actuelle et n'est pas facturé.",
      },
      {
        title: "Ce qui est en cours de conception",
        body: "Soumettre un document, consulter son état, récupérer le résultat structuré, lister les envois, en supprimer un. Les objectifs de conception sont la soumission idempotente, un format d'erreur stable lisible par la machine et des en-têtes de limitation explicites. Rien n'est implémenté.",
      },
      {
        title: "Aucune date n'est promise",
        body: "Annoncer une échéance avant que le service soit construit et testé relèverait de la conjecture, et un plan d'intégration ne se bâtit pas sur une conjecture.",
      },
      {
        title: "Comment évaluer n'importe quelle API documentaire",
        body: "La liste de contrôle que nous vous invitons à nous opposer — format d'erreur, clés d'idempotence, en-têtes de limitation, versionnage et pagination par curseur — est détaillée dans le guide développeur, et elle vaut pour tous les éditeurs, nous compris.",
      },
    ],
    faqs: [
      {
        q: "Puis-je appeler l'API aujourd'hui ?",
        a: "Non. Aucun point d'entrée n'écoute : toute requête échoue. Ce n'est ni une bêta fermée ni une liste d'attente — le service n'existe pas encore.",
      },
      {
        q: "L'accès API fait-il partie de la formule Business ?",
        a: "Non. Il ne fait partie d'aucune formule actuelle et n'est pas facturé. Si cela change, les pages tarifaires l'indiqueront avant l'ouverture du service.",
      },
      {
        q: "Avec quoi puis-je m'intégrer en attendant ?",
        a: "Rien de programmatique. Les outils navigateur réalisent l'extraction aujourd'hui, mais il s'agit d'un parcours utilisateur, pas d'un service appelable depuis votre code.",
      },
    ],
    cta: {
      label: "Découvrir ce que proposera l'API",
      href: "/fr/ocr-api",
      note: "La page API OCR décrit l'interface prévue. Elle n'accepte aucune requête.",
    },
    productLinks: [
      { label: "L'API OCR — bientôt disponible", href: "/fr/ocr-api" },
      { label: "L'extraction qui fonctionne aujourd'hui", href: "/fr/invoice-ocr" },
      { label: "Documentation", href: "/fr/documentation" },
    ],
    blogLinks: [
      {
        label: "Une liste de contrôle pour choisir une API d'OCR",
        href: "/fr/blog/choosing-ocr-api",
      },
      {
        label: "Ce qu'il faut demander sur le traitement des documents",
        href: "/fr/blog/gdpr-document-processing",
      },
    ],
    labels,
    a11y: { navLabel: "Outils et guides pour les développeurs" },
    emptyState: "Il n'y a rien à afficher ici pour le moment.",
    errorState: "Cette page n'a pas pu être chargée.",
  },
};
